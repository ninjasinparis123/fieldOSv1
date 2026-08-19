// Market Pulse — Scriptable iOS widget
// V1: morning analysis feed + live BTC/ETH + live aggressive buyer/seller pressure
// Public data only. No API keys required.

const FEED_URL = "https://raw.githubusercontent.com/ninjasinparis123/fieldOSv1/main/market-pulse/data/market-pulse.json";
const BINANCE = "https://api.binance.com";
const REFRESH_MINUTES = 15;

const fm = FileManager.local();
const cacheDir = fm.joinPath(fm.documentsDirectory(), "market-pulse");
if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);
const cachePath = fm.joinPath(cacheDir, "feed.json");

const C = {
  bg: new Color("071018"),
  panel: new Color("0B1620"),
  line: new Color("1C2A35"),
  text: new Color("F3F7FA"),
  muted: new Color("7F93A3"),
  green: new Color("38E06C"),
  yellow: new Color("FFD84A"),
  orange: new Color("FF8A2A"),
  red: new Color("FF3D4D"),
  cyan: new Color("48C9FF"),
  moonDark: new Color("1D2730"),
  moonLight: new Color("EAF1F7")
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function n(v, fallback = null) { const x = Number(v); return Number.isFinite(x) ? x : fallback; }
function pct(v) { return Number.isFinite(v) ? `${Math.round(v)}%` : "—"; }
function fmtPrice(v) {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return v.toLocaleString("de-DE", {maximumFractionDigits: 0});
  if (v >= 10) return v.toLocaleString("de-DE", {maximumFractionDigits: 2});
  return v.toLocaleString("de-DE", {maximumFractionDigits: 4});
}
function signed(v) {
  if (!Number.isFinite(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function colorForScore(s) {
  if (!Number.isFinite(s)) return C.muted;
  if (s >= 65) return C.green;
  if (s >= 45) return C.yellow;
  return C.red;
}
function biasForScore(s) {
  if (!Number.isFinite(s)) return "NEUTRAL";
  if (s >= 65) return "BUY";
  if (s <= 35) return "SHORT";
  return "NEUTRAL";
}

async function loadJSON(url, timeout = 10) {
  const r = new Request(url);
  r.timeoutInterval = timeout;
  return await r.loadJSON();
}

async function loadFeed() {
  try {
    const data = await loadJSON(`${FEED_URL}?t=${Date.now()}`);
    fm.writeString(cachePath, JSON.stringify(data));
    return data;
  } catch (e) {
    if (fm.fileExists(cachePath)) {
      try { return JSON.parse(fm.readString(cachePath)); } catch (_) {}
    }
    return {
      status: "offline", score: null, bias: "NEUTRAL", confidence: null,
      confidenceLabel: "OFFLINE", indicators: [], crossMarkets: [],
      moon: {}, topReasons: [], newsSummary: "Keine Feed-Daten verfügbar."
    };
  }
}

async function get24h(symbol) {
  try {
    const d = await loadJSON(`${BINANCE}/api/v3/ticker/24hr?symbol=${symbol}`);
    return {price: n(d.lastPrice), change: n(d.priceChangePercent)};
  } catch (_) { return {price:null, change:null}; }
}

async function getBuyerSellerPressure(symbol = "BTCUSDT") {
  try {
    const kl = await loadJSON(`${BINANCE}/api/v3/klines?symbol=${symbol}&interval=5m&limit=12`);
    let vol = 0, takerBuy = 0;
    for (const k of kl) {
      vol += n(k[5], 0);
      takerBuy += n(k[9], 0);
    }
    if (vol <= 0) return {buyer:null, seller:null};
    const buyer = clamp((takerBuy / vol) * 100, 0, 100);
    return {buyer, seller:100-buyer};
  } catch (_) { return {buyer:null, seller:null}; }
}

function approxMoon() {
  const synodic = 29.53058867;
  const epoch = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (Date.now() - epoch) / 86400000;
  let age = ((days % synodic) + synodic) % synodic;
  const phase = age / synodic;
  const illum = (1 - Math.cos(2*Math.PI*phase)) / 2;
  let name = "Neumond";
  if (phase < 0.03 || phase > 0.97) name = "Neumond";
  else if (phase < 0.22) name = "Zunehmende Sichel";
  else if (phase < 0.28) name = "Erstes Viertel";
  else if (phase < 0.47) name = "Zunehmender Mond";
  else if (phase < 0.53) name = "Vollmond";
  else if (phase < 0.72) name = "Abnehmender Mond";
  else if (phase < 0.78) name = "Letztes Viertel";
  else name = "Abnehmende Sichel";
  return {phase, age, illumination: illum*100, name};
}

function drawMoon(phase, size = 72) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const pad = 3;
  const r = new Rect(pad, pad, size-2*pad, size-2*pad);
  ctx.setFillColor(C.moonDark); ctx.fillEllipse(r);

  // illuminated half + moving terminator approximation
  const p = clamp(phase, 0, 1);
  const waxing = p <= 0.5;
  const local = waxing ? p*2 : (p-0.5)*2;
  const lightFrac = waxing ? local : 1-local;

  ctx.setFillColor(C.moonLight);
  if (waxing) {
    ctx.fillEllipse(new Rect(size/2, pad, size/2-pad, size-2*pad));
  } else {
    ctx.fillEllipse(new Rect(pad, pad, size/2-pad, size-2*pad));
  }

  // Terminator ellipse: crude but smooth and high-res
  const w = Math.max(2, (size-2*pad) * Math.abs(1 - 2*lightFrac));
  const x = (size-w)/2;
  ctx.setFillColor(lightFrac < 0.5 ? C.moonDark : C.moonLight);
  ctx.fillEllipse(new Rect(x, pad, w, size-2*pad));

  // outline
  ctx.setStrokeColor(new Color("7A8A96", 0.55));
  ctx.setLineWidth(1.1);
  ctx.strokeEllipse(r);
  return ctx.getImage();
}

function drawGauge(score, size = new Size(360, 170)) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const cx = size.width/2;
  const cy = size.height-18;
  const radius = Math.min(size.width*0.39, size.height*0.82);
  const start = Math.PI;
  const end = 2*Math.PI;

  function point(a, r) { return new Point(cx + Math.cos(a)*r, cy + Math.sin(a)*r); }
  function strokeArc(a1,a2,r,color,width,steps=80) {
    const path = new Path();
    path.move(point(a1,r));
    for (let i=1;i<=steps;i++) {
      const a = a1 + (a2-a1)*(i/steps);
      path.addLine(point(a,r));
    }
    ctx.addPath(path); ctx.setStrokeColor(color); ctx.setLineWidth(width); ctx.strokePath();
  }

  strokeArc(start, end, radius, new Color("26343F"), 13);
  strokeArc(start, start+(end-start)*0.35, radius, C.red, 13);
  strokeArc(start+(end-start)*0.35, start+(end-start)*0.65, radius, C.yellow, 13);
  strokeArc(start+(end-start)*0.65, end, radius, C.green, 13);

  for (let i=0;i<=20;i++) {
    const a = start + (end-start)*(i/20);
    const p1 = point(a, radius-12);
    const p2 = point(a, radius-(i%5===0?28:20));
    const path = new Path(); path.move(p1); path.addLine(p2);
    ctx.addPath(path); ctx.setStrokeColor(new Color("D9E2E8", i%5===0?0.9:0.45));
    ctx.setLineWidth(i%5===0?2:1); ctx.strokePath();
  }

  const s = Number.isFinite(score) ? clamp(score,0,100) : 50;
  const a = start + (end-start)*(s/100);
  const needle = new Path(); needle.move(point(a, 8)); needle.addLine(point(a, radius-32));
  ctx.addPath(needle); ctx.setStrokeColor(colorForScore(s)); ctx.setLineWidth(6); ctx.strokePath();
  ctx.setFillColor(new Color("DCE6ED")); ctx.fillEllipse(new Rect(cx-8,cy-8,16,16));
  ctx.setFillColor(C.bg); ctx.fillEllipse(new Rect(cx-4,cy-4,8,8));

  ctx.setTextAlignedCenter(); ctx.setFont(Font.boldSystemFont(42)); ctx.setTextColor(colorForScore(s));
  ctx.drawTextInRect(Number.isFinite(score)?`${Math.round(score)}`:"—", new Rect(cx-60, cy-radius+50, 120, 55));
  ctx.setFont(Font.semiboldSystemFont(15)); ctx.setTextColor(C.text);
  ctx.drawTextInRect(biasForScore(score), new Rect(cx-70, cy-radius+100, 140, 25));
  ctx.setFont(Font.systemFont(10)); ctx.setTextColor(C.muted);
  ctx.drawTextInRect("SHORT", new Rect(12, cy-18, 55, 18));
  ctx.drawTextInRect("NEUTRAL", new Rect(cx-40, cy-18, 80, 18));
  ctx.drawTextInRect("BUY", new Rect(size.width-65, cy-18, 50, 18));
  return ctx.getImage();
}

function addTxt(stack, text, size=11, color=C.text, weight="regular") {
  const t = stack.addText(String(text));
  t.textColor = color;
  t.font = weight === "bold" ? Font.boldSystemFont(size) : weight === "semibold" ? Font.semiboldSystemFont(size) : Font.systemFont(size);
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.65;
  return t;
}

function addDot(stack, color, label) {
  const d = stack.addText("●"); d.textColor = color; d.font = Font.systemFont(9);
  stack.addSpacer(3); addTxt(stack, label, 9, C.muted);
}

function statusColor(status, score=null) {
  const s = String(status||"").toLowerCase();
  if (s.includes("bull") || s.includes("buy") || s.includes("risk-on") || s.includes("positive")) return C.green;
  if (s.includes("bear") || s.includes("short") || s.includes("risk-off") || s.includes("negative")) return C.red;
  if (Number.isFinite(score)) return colorForScore(score);
  return C.yellow;
}

function card(parent) {
  const s = parent.addStack(); s.backgroundColor = C.panel; s.cornerRadius = 11; s.setPadding(8,8,8,8); return s;
}

function mergeLiveScore(feedScore, buyerPressure, btcChange) {
  if (!Number.isFinite(feedScore)) return null;
  let adj = 0;
  if (Number.isFinite(buyerPressure)) adj += clamp((buyerPressure-50)*0.12, -3, 3);
  if (Number.isFinite(btcChange)) adj += clamp(btcChange*0.35, -3, 3);
  return clamp(feedScore + adj, 0, 100);
}

async function main() {
  const [feed, btc, eth, flow] = await Promise.all([
    loadFeed(), get24h("BTCUSDT"), get24h("ETHUSDT"), getBuyerSellerPressure("BTCUSDT")
  ]);

  const moonLocal = approxMoon();
  const moonPhase = Number.isFinite(n(feed?.moon?.phase)) ? n(feed.moon.phase) : moonLocal.phase;
  const moonName = feed?.moon?.phaseName || feed?.moon?.name || moonLocal.name;
  const moonIll = Number.isFinite(n(feed?.moon?.illumination)) ? n(feed.moon.illumination) : moonLocal.illumination;

  const baseScore = n(feed.score);
  const liveScore = mergeLiveScore(baseScore, flow.buyer, btc.change);
  const displayScore = Number.isFinite(liveScore) ? liveScore : baseScore;
  const bias = Number.isFinite(displayScore) ? biasForScore(displayScore) : (feed.bias || "NEUTRAL");

  const widget = new ListWidget();
  widget.backgroundColor = C.bg;
  widget.setPadding(10,10,10,10);
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES*60000);

  const family = config.widgetFamily || "large";

  // Header
  const head = widget.addStack(); head.centerAlignContent();
  addTxt(head, "MARKET PULSE", 13, C.text, "bold");
  head.addSpacer();
  addTxt(head, "LIVE", 9, C.green, "semibold");
  widget.addSpacer(7);

  if (family === "small") {
    const g = widget.addImage(drawGauge(displayScore, new Size(290,135))); g.resizable = true; g.imageSize = new Size(145,68);
    widget.addSpacer(5);
    const row = widget.addStack(); row.centerAlignContent();
    const mi = row.addImage(drawMoon(moonPhase, 48)); mi.imageSize = new Size(32,32);
    row.addSpacer(7);
    const col = row.addStack(); col.layoutVertically();
    addTxt(col, `${moonName}`, 9, C.text, "semibold");
    addTxt(col, `Käufer ${pct(flow.buyer)}`, 9, flow.buyer>=50?C.green:C.red);
    Script.setWidget(widget); Script.complete(); return;
  }

  const top = widget.addStack();
  const moonCard = card(top); moonCard.layoutVertically(); moonCard.size = new Size(88,0);
  addTxt(moonCard, "MOND", 9, C.muted, "semibold");
  moonCard.addSpacer(4);
  const mi = moonCard.addImage(drawMoon(moonPhase, 68)); mi.imageSize = new Size(58,58); mi.centerAlignImage();
  moonCard.addSpacer(3); addTxt(moonCard, moonName, 9, C.text, "semibold");
  addTxt(moonCard, `${pct(moonIll)} beleuchtet`, 8, C.muted);

  top.addSpacer(7);
  const gaugeCard = card(top); gaugeCard.layoutVertically();
  addTxt(gaugeCard, "MARKT-PEGEL", 9, C.muted, "semibold");
  const g = gaugeCard.addImage(drawGauge(displayScore)); g.resizable = true; g.imageSize = new Size(210,99); g.centerAlignImage();
  const conf = gaugeCard.addStack(); conf.centerAlignContent();
  addTxt(conf, "Confidence ", 9, C.muted); addTxt(conf, Number.isFinite(n(feed.confidence))?pct(n(feed.confidence)):(feed.confidenceLabel||"—"), 9, C.cyan, "semibold");

  top.addSpacer(7);
  const flowCard = card(top); flowCard.layoutVertically(); flowCard.size = new Size(110,0);
  addTxt(flowCard, "WER KAUFT?", 9, C.muted, "semibold"); flowCard.addSpacer(5);
  addTxt(flowCard, `KÄUFER ${pct(flow.buyer)}`, 15, C.green, "bold");
  addTxt(flowCard, `VERKÄUFER ${pct(flow.seller)}`, 12, C.red, "semibold");
  flowCard.addSpacer(5);
  const bar = flowCard.addStack(); bar.size = new Size(90,7); bar.cornerRadius = 4; bar.backgroundColor = C.red;
  const b = bar.addStack(); b.backgroundColor = C.green; b.cornerRadius = 4; b.size = new Size(Number.isFinite(flow.buyer)?90*flow.buyer/100:45,7);
  flowCard.addSpacer(5); addTxt(flowCard, "5m × 12 · Taker Flow", 7, C.muted);

  widget.addSpacer(7);

  // Live markets
  const mk = widget.addStack();
  const btcCard = card(mk); btcCard.layoutVertically();
  addTxt(btcCard, "BTC/USDT", 9, C.muted, "semibold"); addTxt(btcCard, fmtPrice(btc.price), 12, C.text, "bold"); addTxt(btcCard, signed(btc.change), 9, (btc.change||0)>=0?C.green:C.red, "semibold");
  mk.addSpacer(6);
  const ethCard = card(mk); ethCard.layoutVertically();
  addTxt(ethCard, "ETH/USDT", 9, C.muted, "semibold"); addTxt(ethCard, fmtPrice(eth.price), 12, C.text, "bold"); addTxt(ethCard, signed(eth.change), 9, (eth.change||0)>=0?C.green:C.red, "semibold");
  mk.addSpacer(6);
  const cmCard = card(mk); cmCard.layoutVertically();
  addTxt(cmCard, "BESTÄTIGUNG", 9, C.muted, "semibold");
  const cms = (feed.crossMarkets||[]).slice(0,5);
  const cr = cmCard.addStack();
  for (const m of cms) { addTxt(cr, "●", 8, statusColor(m.status,m.score)); addTxt(cr, m.symbol, 7, C.muted); cr.addSpacer(4); }
  if (!cms.length) addTxt(cmCard, "wartet auf Morgenfeed", 8, C.muted);

  if (family === "medium") {
    widget.addSpacer(7);
    addTxt(widget, feed.newsSummary || "Morgenfeed noch nicht verfügbar.", 9, C.muted);
    Script.setWidget(widget); Script.complete(); return;
  }

  widget.addSpacer(7);

  // Indicators
  const body = widget.addStack();
  const indCard = card(body); indCard.layoutVertically();
  addTxt(indCard, "INDIKATOREN", 10, C.text, "bold"); indCard.addSpacer(3);
  const inds = (feed.indicators||[]).slice(0,7);
  if (!inds.length) addTxt(indCard, "Keine Indikatorwerte im Feed", 8, C.muted);
  for (const it of inds) {
    const r = indCard.addStack(); r.centerAlignContent();
    addTxt(r, it.label || it.key, 8, C.text, "semibold"); r.addSpacer();
    addTxt(r, Number.isFinite(n(it.score)) ? `${Math.round(n(it.score))}` : "—", 8, statusColor(it.status,n(it.score)), "bold");
    indCard.addSpacer(2);
  }

  body.addSpacer(7);
  const brief = card(body); brief.layoutVertically(); brief.size = new Size(150,0);
  addTxt(brief, "MORGEN-BIAS", 10, C.text, "bold"); brief.addSpacer(4);
  addTxt(brief, bias, 16, colorForScore(displayScore), "bold");
  brief.addSpacer(3);
  addTxt(brief, feed.newsSummary || "Feed wird morgens aktualisiert.", 8, C.muted);
  brief.addSpacer(4);
  const rs = (feed.topReasons||[]).slice(0,3);
  for (const x of rs) { const rr = brief.addStack(); addDot(rr, C.cyan, x); brief.addSpacer(2); }

  widget.addSpacer(5);
  const foot = widget.addStack(); foot.centerAlignContent();
  const generated = feed.generatedAt ? new Date(feed.generatedAt) : null;
  addTxt(foot, generated && !isNaN(generated) ? `Morgenfeed ${generated.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}` : "Morgenfeed noch nicht geschrieben", 7, C.muted);
  foot.addSpacer(); addTxt(foot, "Live-Refresh ~15m*", 7, C.muted);

  Script.setWidget(widget);
  if (!config.runsInWidget) await widget.presentLarge();
  Script.complete();
}

await main();
