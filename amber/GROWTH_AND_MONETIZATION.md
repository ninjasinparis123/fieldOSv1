# Amber – Nutzerwachstum und Finanzierung (Planstand 18.11.2026)

## Produktziel
Amber soll ein vertrauenswürdiges soziales Netzwerk für offene Fragen, Umfragen und konstruktive Diskussionen werden. Journal = Nachrichten als Gesprächseinstieg, nicht als Content-Farm. Nutzer dürfen keine politischen Meinungsdaten an Werbekunden verlieren.

## Launch-Reife / Blocker
- [x] Reaktionsfähige PWA-Prototypoberfläche
- [x] Journal und fünf initiale quellenbasierte Meldungen
- [x] Gratis-RSS-Pipeline für bis zu fünf neue Kurzmeldungen täglich
- [x] Thema des Tages, Mehrfachauswahl im lokalen Demo-Modus, Follow-up-Ranking
- [ ] Öffentliches, sicheres Google Login und serverseitige Abstimmungssperre (Supabase ist vorbereitet, aber nicht verbunden)
- [ ] Serverseitige Moderation, Berichte, Sperrung, Wiederherstellbarkeit und Datenschutzhinweise
- [ ] Domain amber.nautilak.com durch DNS-Verwaltung verbinden
- [ ] Nutzungsanalyse mit rechtlicher Prüfung und Einwilligungsentscheidungen wo erforderlich
- [ ] Transparente journalistische Kennzeichnung maschinell kuratierter Inhalte und Korrekturprozess

## Gratis-Validierungsrunde: 14 Tage
**Tage 1–3:** QA für Smartphone und Desktop, Lesbarkeit, Accessibility, Kommentarfunktionen und 30-sekündigen Ersteindruck; keine Werbung als fertiges Social Network.
**Tage 4–7:** Einladungen an 15–30 interessierte Testpersonen aus Philosophie, Wirtschaft, Gaming, Gaming-Communities und Wissenschaft. Nur im erlaubten Rahmen der jeweiligen Community-Regeln; kein Spam, keine automatischen DMs.
**Tage 8–14:** 3–5 Creator mit kleinen, thematisch gut passenden Communities um freiwilliges, ehrliches Produktfeedback bitten. Auf eine neutrale provokationsarme Frage verlinken. Reaktionen und Conversionqualität getrennt messen.

## Der beste Nutzer-Funnel
1. Creator stellt **eine konkrete offene Frage** in Kurzvideo, Stream, Newsletter oder Podcast, nicht eine allgemeine Web-App-Werbung.
2. UTM-Link führt direkt zur entsprechenden Amber-Frage.
3. Gast darf lesen; nur ein klarer CTA zur Teilnahme. In produktivem Zustand: Login und echte Stimme.
4. Danach sieht er **Ergebnis, differenzierte Perspektiven und die meistgewählte Folgefrage**.
5. Statt aggressiver Pushs: optionales Wochen-Recap, Themenwahl und eigene Folgefrage.

**Beispiel-KPIs:** Anteil Besucher, die innerhalb 30 Sekunden eine Frage öffnen; Anteil mit erster Antwort; Anteil, der nach 7 Tagen organisch zurückkehrt; qualifizierte Kommentare; Anteil durch Quellen korrekt informierter Leser; Meldungen/Moderationsfälle. Keine selbst erfundenen DAU-Zahlen.

## Werbeerlöse (später, mit Rechtsgrundlage und Qualitätsnachweis)
A) **Kontextbezogene Anzeigen** außerhalb politischer Abstimmungskarten. Bei Google AdSense gelten Qualitäts-, Originalitäts- und UGC-Policies. In EWR/UK/CH gelten zertifizierte CMP-/Consent-Anforderungen. Keine Personalisierung anhand politischer Überzeugungen oder anderer sensibler Daten.
B) **Eindeutig gekennzeichnete Sponsoring-Plätze** im Journal oder Wochenbrief – nach eigener Prüfung, nie getarnt als unabhängige redaktionelle Meinung.
C) **Thematisch passende Affiliate-Verweise** nur wenn relevant, z. B. Bücher, Bildungstools, Lernplattformen, jeweils transparent markiert.
D) **Premium-Werkzeuge für Organisationen** nur aus datenschutzkonformen, aggregierten und methodisch korrekt eingeordneten Erkenntnissen, niemals Verkauf von individuellen Meinungsprofilen.
E) **Freiwillige Mitgliedschaft** für werbefreies Lesen, Layoutoptionen, Export eigener Daten. Stimmen bleiben gleich gewichtet.

**Nur eine Rechenübung, keine Marktprognose:** Wenn der Seiten-RPM irgendwann zwischen 1 und 5 EUR läge, ergäben 10.000 monetarisierte Seitenaufrufe 10–50 EUR, 100.000 Aufrufe 100–500 EUR und 1.000.000 Aufrufe 1.000–5.000 EUR. Auszahlungsbedingungen, Consent, Anzeigenquote und Land können stark variieren. Keine Einnahmen vor Ad-Freigabe.

## Influencer-Auswahl statt Reichweiten-Wettrennen
- 3–5 Mikro-Creator je Vertikale: Wissenschaft/Philosophie, Zukunft/Tech, Wirtschaft, Gaming, Geschichte.
- Prüfung: deutschsprachig, viele *inhaltliche* Kommentare, thematische Passung, geringe Streit-Eskalation, keine Falschmeldungsroutine.
- Kooperationsidee: Creator kann eine eigene offene Folgefrage vorschlagen; Publikum stimmt nach denselben neutralen Regeln wie alle anderen ab.
- Creator erhalten keine Sondermacht beim Stimmengewicht. Keine Abstimmungen gegen Geld, kein Kauf von Stimmen.
- Pro Partner eindeutige URL mit UTM-Parametern; klar gekennzeichnete Werbung bei Gegenleistungen.
- Kein Budget für große YouTuber, bevor ein qualifizierter Pilot zeigt, dass Nutzer wirklich zurückkehren.

## Wichtige Quellen (öffentlich)
- Apple HIG Design Principles: https://developer.apple.com/design/human-interface-guidelines/design-principles/
- Apple Layout: https://developer.apple.com/design/human-interface-guidelines/layout
- AdSense Eligibility: https://support.google.com/adsense/answer/9724
- Google AdSense CMP: https://support.google.com/adsense/answer/13554116
- UGC Policy: https://support.google.com/adsense/answer/1355699
- DSA: https://eur-lex.europa.eu/eli/reg/2022/2065
- EU Political Advertising 2024/900: https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/democracy-eu-citizenship-anti-corruption/democracy-and-electoral-rights/transparency-and-targeting-political-advertising_en

**Reihenfolge:** Community-Sicherheit → reales Nutzungserlebnis → echte Bindung → Creator-Pilots → Anzeigen/Sponsorings.