#!/usr/bin/env python3
"""Amber Journal: publish up to five *source-linked* RSS briefs each day.

No LLM, paid API or scraping. If five eligible new items are unavailable,
publish only the verified items and report the shortfall; never fabricate news.
All auto-generated posts disclose their status as automated source notices.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "news.json"
BERLIN = ZoneInfo("Europe/Berlin")
NOW = datetime.now(timezone.utc)
TODAY = datetime.now(BERLIN).date().isoformat()
FEEDS = [
    ("tagesschau", "https://www.tagesschau.de/index~rss2.xml", "geopolitics", "Geopolitik"),
    ("tagesschau Europa", "https://www.tagesschau.de/ausland/europa/index~rss2.xml", "geopolitics", "Geopolitik"),
    ("Deutsche Welle", "https://rss.dw.com/rdf/rss-en-all", "society", "Gesellschaft"),
    ("heise online", "https://www.heise.de/rss/heise-atom.xml", "technology", "Technologie"),
    ("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/", "crypto", "Krypto"),
    ("UN News", "https://news.un.org/feed/subscribe/en/news/all/rss.xml", "humanitarian", "Humanitäres"),
    ("NASA", "https://www.nasa.gov/news-release/feed/", "science", "Wissenschaft"),
    ("Europäische Kommission", "https://commission.europa.eu/node/2/rss_en", "law", "Recht & Gesetze"),
    ("GameStar", "https://www.gamestar.de/rss/gaming.rss", "gaming", "Gaming"),
    ("Eurogamer", "https://www.eurogamer.net/feed", "gaming", "Gaming"),
]
LABELS = {"geopolitics":"Geopolitik","finance":"Finanzen","crypto":"Krypto","humanitarian":"Humanitäres","charity":"Charity","law":"Recht & Gesetze","technology":"Technologie","science":"Wissenschaft","gaming":"Gaming","society":"Gesellschaft","culture":"Kultur","environment":"Umwelt","health":"Gesundheit"}
QUESTIONS = {
 "geopolitics":"Welche Konsequenzen könnten sich für internationale Zusammenarbeit ergeben?",
 "finance":"Welche wirtschaftlichen Folgen sind für Menschen im Alltag besonders wichtig?",
 "crypto":"Welche Fragen zur Sicherheit und Regulierung digitaler Finanzmärkte sind offen?",
 "humanitarian":"Wie kann Hilfe für Betroffene konkret und transparent wirksam werden?",
 "charity":"Wie erkennt man wirksame und seriöse Hilfsprojekte?",
 "law":"Welche Rechte und Pflichten sollten gesellschaftlich Vorrang haben?",
 "technology":"Wie sollten Chancen und Risiken dieser Technologie abgewogen werden?",
 "science":"Welche offenen Fragen sollte die Wissenschaft weiter untersuchen?",
 "gaming":"Wie beeinflusst Gaming Kultur, Gemeinschaft und Kreativität?",
 "society":"Welche Perspektiven fehlen in der öffentlichen Diskussion?",
}
GENERIC = "Welche Perspektiven fehlen in der öffentlichen Diskussion?"
SAFE_DOMAINS = ("tagesschau.de","dw.com","heise.de","coindesk.com","news.un.org","nasa.gov","commission.europa.eu","gamestar.de","eurogamer.net")
ATOM = "{http://www.w3.org/2005/Atom}"
RSS1 = "{http://purl.org/rss/1.0/}"

def clean(value: str, limit=220):
    value = re.sub(r"<[^>]+>"," ",value or "")
    value = html.unescape(value)
    value = " ".join(value.split()).strip()
    return value[:limit].rsplit(" ",1)[0].strip() if len(value)>limit and " " in value[:limit] else value[:limit]

def child_text(node, names):
    for name in names:
        child = node.find(name)
        if child is not None and child.text:
            return child.text.strip()
    return ""

def parse_time(text):
    if not text:
        return None
    try:
        dt = parsedate_to_datetime(text)
    except (ValueError,TypeError,IndexError):
        try:
            dt = datetime.fromisoformat(text.replace("Z","+00:00"))
        except ValueError:
            return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)

def approved_link(href):
    try:
        url = urllib.parse.urlsplit(href.strip())
        host = (url.hostname or "").lower()
        return url.scheme=="https" and any(host == d or host.endswith("."+d) for d in SAFE_DOMAINS) and bool(url.path)
    except (ValueError,AttributeError):
        return False

def read_feed(name, url, category, label):
    req=urllib.request.Request(url,headers={"User-Agent":"AmberJournal/1.0 (public beta; RSS source-linked aggregator)","Accept":"application/rss+xml,application/atom+xml,application/xml,text/xml,*/*"})
    with urllib.request.urlopen(req,timeout=16) as resp:
        content=resp.read(2_000_000)
    root=ET.fromstring(content)
    items=root.findall(".//item")
    items+=root.findall(".//"+RSS1+"item")
    items+=root.findall(".//"+ATOM+"entry")
    result=[]
    for entry in items[:55]:
        title=clean(child_text(entry,["title",RSS1+"title",ATOM+"title"]),145)
        link=child_text(entry,["link",RSS1+"link",ATOM+"link"])
        if not link:
            for el in entry.findall(ATOM+"link"):
                if el.attrib.get("rel","alternate")=="alternate" and el.attrib.get("href"):
                    link=el.attrib["href"];break
        if not approved_link(link) or len(title)<18:
            continue
        published=parse_time(child_text(entry,["pubDate","{http://purl.org/dc/elements/1.1/}date",ATOM+"published",ATOM+"updated","published","updated"]))
        if published is None or published < NOW-timedelta(hours=40) or published > NOW+timedelta(hours=4):
            continue
        ident=hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
        result.append({
          "id":"rss-"+ident,"editorialDate":TODAY,"publishedAt":published.isoformat(),
          "category":category,"categoryLabel":label,"source":name,"sourceUrl":link,
          "title":title,
          "dek":f"{name} hat diese Meldung veröffentlicht. Die Fakten und Einzelheiten stehen in der verlinkten Originalquelle.",
          "summary":f"Automatisch zusammengestellter Quellenhinweis von Amber Journal. Thema der Originalmeldung: {title}. Dieser Kurzbeitrag enthält keine unabhängig verifizierten Zusatzbehauptungen. Für Details, unterschiedliche Perspektiven und eventuelle Aktualisierungen bitte den Originalbericht lesen.",
          "question":QUESTIONS.get(category,GENERIC),
          "kind":"Automatischer Quellenhinweis · nicht redaktionell geprüft",
          "verified":False
        })
    return result

def main():
    try:
        store=json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    except (ValueError,OSError):
        store={}
    old=store.get("items",[]) if isinstance(store.get("items",[]),list) else []
    seen={n.get("sourceUrl") for n in old if isinstance(n,dict)}
    candidates=[]
    for name,url,cat,label in FEEDS:
        try:
            found=read_feed(name,url,cat,label)
            candidates.extend(found)
            print(f"{name}: {len(found)} eligible stories")
        except (ET.ParseError,urllib.error.URLError,TimeoutError,ValueError) as exc:
            print(f"WARNING: {name}: {exc}",file=sys.stderr)
    candidates.sort(key=lambda n:n["publishedAt"],reverse=True)
    fresh=[];used_sources=set();used_categories=set()
    for n in candidates:
        if n["sourceUrl"] in seen or n["category"] in used_categories:continue
        fresh.append(n);seen.add(n["sourceUrl"]);used_sources.add(n["source"]);used_categories.add(n["category"])
        if len(fresh)>=5:break
    if len(fresh)<5:
        for n in candidates:
            if n["sourceUrl"] in seen or n["source"] in used_sources:continue
            fresh.append(n);seen.add(n["sourceUrl"]);used_sources.add(n["source"])
            if len(fresh)>=5:break
    # No backfilling from old stories, no repeated posts for engagement metrics.
    if not fresh:
        print("No new source-backed articles; retaining prior issue.")
        return
    ordered=(fresh+old)[:90]
    store={"edition":TODAY,"updatedAt":datetime.now(timezone.utc).isoformat(),
      "method":"Automatic RSS-linked briefing; not independent editorial fact-checking. Each entry cites its original publisher.",
      "todayCount":sum(n.get("editorialDate")==TODAY for n in ordered),
      "items":ordered}
    OUTPUT.write_text(json.dumps(store,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Published {len(fresh)} new briefs ({len(ordered)} in archive).",flush=True)
    if len(fresh)<5:print("WARNING: Fewer than five fresh, source-backed news items; no fabricated substitutes.",file=sys.stderr)

if __name__=="__main__":
    main()
