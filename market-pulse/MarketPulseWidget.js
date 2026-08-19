// Market Pulse — Scriptable iOS Widget
// V2: Morning briefing feed + live BTC/ETH + live aggressive buyer/seller pressure
// Public data only. No API keys required.
// Informational market dashboard — not an automatic trade execution system.

const FEED_URL = "https://raw.githubusercontent.com/ninjasinparis123/fieldOSv1/main/market-pulse/data/market-pulse.json";
const BINANCE = "https://api.binance.com";
const REFRESH_MINUTES = 15;
const FLOW_BARS = 12; // 12 x 5m = approx. 60 minutes

const fm = FileManager.local();
const cacheDir = fm.joinPath(fm.documentsDirectory(), "market-pulse");
if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);
const cachePath = fm.joinPath(cacheDir, "feed.json");

const C = {
  bg: new Color("071018"),
  panel: new Color("0B1620"),
  panel2: new Color("0D1A25"),
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
function num(v, fallback = null) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}
function pct(v, digits = 0) {
  return Number.isFinite(v) ? `${v.toFixed(digits)}%` : "—";
}
function fmtPrice(v) {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return v.toLocaleString("de-DE", { maximumFractionDigits: 0 });
  if (v >= 10) return v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  return v.toLocaleString("de-DE", { maximumFractionDigits: 4 });
}
function signed(v) {
  if (!Number.isFinite(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function scoreColor(s) {
  if (!Number.isFinite(s)) return C.muted;
  if (s >= 65) return C.green;
  if (s <= 35) return C.red;
  return C.yellow;
}
function scoreBias(s, fallback = "NEUTRAL") {
  if (!Number.isFinite(s)) return fallback || "NEUTRAL";
  if (s >= 65) return "BUY";
  if (s <= 35) return "SHORT";
  return "NEUTRAL";
}
function statusColor(status, score = null) {
  const s = String(status || "").toLowerCase();
  if (s.includes("bull") || s.includes("buy") || s.includes("risk-on") || s.includes("positive") || s.includes("up")) return C.green;
  if (s.includes("bear") || s.includes("short") || s.includes("risk-off") || s.includes("negative") || s.includes("down")) return C.red;
  if (Number.isFinite(score)) return scoreColor(score);
  return C.yellow;
}
function freshness(generatedAt) {
  if (!generatedAt) return { label: "kein Morgenfeed", stale: true, ageMin: null };
  const d = new Date(generatedAt);
  if (isNaN(d)) return { label: "Feed-Zeit ungültig", stale: true, ageMin: null };
  const ageMin = Math.max(0, (Date.now() - d.getTime()) / 60000);
  if (ageMin < 90) return { label: `Feed ${Math.round(ageMin)}m alt`, stale: false, ageMin };
  if (ageMin < 24 * 60) return { label: `Feed ${Math.round(ageMin / 60)}h alt`, stale: false, ageMin };
  return { label: `Feed ${Math.round(ageMin / 1440)}d alt`, stale: true, ageMin };
}

async function loadJSON(url, timeout = 10) {
  const req = new Request(url);
  req.timeoutInterval = timeout;
  return await req.loadJSON();
}

async function loadFeed() {
  try {
    const data = await loadJSON(`${FEED_URL}?t=${Date.now()}`);
    if (!data || typeof data !== "object") throw new Error("Feed ist kein Objekt");
    fm.writeString(cachePath, JSON.stringify(data));
    return { data, source: "online" };
  } catch (e) {
    if (fm.fileExists(cachePath)) {
      try { return { data: JSON.parse(fm.readString(cachePath)), source: "cache" }; } catch (_) {}
    }
    return {
      source: "offline",
      data: {
        status: "offline",
        score: null,
        bias: "NEUTRAL",
        confidence: null,
        confidenceLabel: "OFFLINE",
        indicators: [],
        crossMarkets: [],
        moon: {},
        topReasons: [],
        newsSummary: "Keine Feed-Daten verfügbar."
      }
    };
  }
}

async function get24h(symbol) {
  try {
    const d = await loadJSON(`${BINANCE}/api/v3/ticker/24hr?symbol=${symbol}`);
    return { symbol, price: num(d.lastPrice), change: num(d.priceChangePercent) };
  } catch (_) {
    return { symbol, price: null, change: null };
  }
}

async function getAggressiveFlow(symbol = "BTCUSDT") {
  try {
    const kl = await loadJSON(`${BINANCE}/api/v3/klines?symbol=${symbol}&interval=5m&limit=${FLOW_BARS}`);
    let volume = 0;
    let takerBuyBase = 0;
    let weightedMove = 0;

    for (const k of kl) {
      const open = num(k[1], 0);
      const close = num(k[4], 0);
      const v = num(k[5], 0);
      const tb = num(k[9], 0);
      volume += v;
      takerBuyBase += tb;
      if (open > 0) weightedMove += ((close - open) / open) * v;
    }

    if (volume <= 0) return { buyer: null, seller: null, delta: null, impulse: null };
    const buyer = clamp((takerBuyBase / volume) * 100, 0, 100);
    const seller = 100 - buyer;
    const delta = buyer - seller;
    const impulse = (weightedMove / volume) * 100;
    return { buyer, seller, delta, impulse };
  } catch (_) {
    return { buyer: null, seller: null, delta: null, impulse: null };
  }
}

function approxMoon() {
  const synodic = 29.53058867;
  const epoch = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (Date.now() - epoch) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const phase = age / synodic;
  const illumination = ((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100;
  let name = "Neumond";
  if (phase < 0.03 || phase > 0.97) name = "Neumond";
  else if (phase < 0.22) name = "Zunehmende Sichel";
  else if (phase < 0.28) name = "Erstes Viertel";
  else if (phase < 0.47) name = "Zunehmender Mond";
  else if (phase < 0.53) name = "Vollmond";
  else if (phase < 0.72) name = "Abnehmender Mond";
  else if (phase < 0.78) name = "Letztes Viertel";
  else name = "Abnehmende Sichel";
  return { phase, age, illumination, name };
}

function drawMoon(phase, size = 72) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const pad = 3;
  const disk = new Rect(pad, pad, size - 2 * pad, size - 2 * pad);
  ctx.setFillColor(C.moonDark);
  ctx.fillEllipse(disk);

  const p = clamp(phase, 0, 1);
  const waxing = p <= 0.5;
  const half = size / 2;
  ctx.setFillColor(C.moonLight);
  if (waxing) ctx.fillEllipse(new Rect(half, pad, half - pad, size - 2 * pad));
  else ctx.fillEllipse(new Rect(pad, pad, half - pad, size - 2 * pad));

  const local = waxing ? p * 2 : (p - 0.5) * 2;
  const lightFrac = waxing ? local : 1 - local;
  const w = Math.max(2, (size - 2 * pad) * Math.abs(1 - 2 * lightFrac));
  const x = (size - w) / 2;
  ctx.setFillColor(lightFrac < 0.5 ? C.moonDark : C.moonLight);
  ctx.fillEllipse(new Rect(x, pad, w, size - 2 * pad));

  ctx.setStrokeColor(new Color("9AA8B2", 0.5));
  ctx.setLineWidth(1.1);
  ctx.strokeEllipse(disk);
  return ctx.getImage();
}

function drawGauge(score, size = new Size(360, 170)) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const cx = size.width / 2;
  const cy = size.height - 18;
  const radius = Math.min(size.width * 0.39, size.height * 0.82);
  const start = Math.PI;
  const end = 2 * Math.PI;

  function point(a, r) {
    return new Point(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  function strokeArc(a1, a2, r, color, width, steps = 80) {
    const path = new Path();
    path.move(point(a1, r));
    for (let i = 1; i <= steps; i++) {
      const a = a1 + (a2 - a1) * (i / steps);
      path.addLine(point(a, r));
    }
    ctx.addPath(path);
    ctx.setStrokeColor(color);
    ctx.setLineWidth(width);
    ctx.strokePath();
  }

  strokeArc(start, end, radius, new Color("26343F"), 13);
  strokeArc(start, start + (end - start) * 0.35, radius, C.red, 13);
  strokeArc(start + (end - start) * 0.35, start + (end - start) * 0.65, radius, C.yellow, 13);
  strokeArc(start + (end - start) * 0.65, end, radius, C.green, 13);

  for (let i = 0; i <= 20; i++) {
    const a = start + (end - start) * (i / 20);
    const p1 = point(a, radius - 12);
    const p2 = point(a, radius - (i % 5 === 0 ? 28 : 20));
    const tick = new Path();
    tick.move(p1);
    tick.addLine(p2);
    ctx.addPath(tick);
    ctx.setStrokeColor(new Color("D9E2E8", i % 5 === 0 ? 0.9 : 0.45));
    ctx.setLineWidth(i % 5 === 0 ? 2 : 1);
    ctx.strokePath();
  }

  const s = Number.isFinite(score) ? clamp(score, 0, 100) : 50;
  const a = start + (end - start) * (s / 100);
  const needle = new Path();
  needle.move(point(a, 8));
  needle.addLine(point(a, radius - 32));
  ctx.addPath(needle);
  ctx.setStrokeColor(scoreColor(s));
  ctx.setLineWidth(6);
  ctx.strokePath();

  ctx.setFillColor(new Color("DCE6ED"));
  ctx.fillEllipse(new Rect(cx - 8, cy - 8, 16, 16));
  ctx.setFillColor(C.bg);
  ctx.fillEllipse(new Rect(cx - 4, cy - 4, 8, 8));

  ctx.setTextAlignedCenter();
  ctx.setFont(Font.boldSystemFont(42));
  ctx.setTextColor(scoreColor(s));
  ctx.drawTextInRect(Number.isFinite(score) ? `${Math.round(score)}` : "—", new Rect(cx - 60, cy - radius + 50, 120, 55));
  ctx.setFont(Font.semiboldSystemFont(15));
  ctx.setTextColor(C.text);
  ctx.drawTextInRect(scoreBias(score), new Rect(cx - 70, cy - radius + 100, 140, 25));
  ctx.setFont(Font.systemFont(10));
  ctx.setTextColor(C.muted);
  ctx.drawTextInRect("SHORT", new Rect(12, cy - 18, 55, 18));
  ctx.drawTextInRect("NEUTRAL", new Rect(cx - 40, cy - 18, 80, 18));
  ctx.drawTextInRect("BUY", new Rect(size.width - 65, cy - 18, 50, 18));

  return ctx.getImage();
}

function addTxt(parent, text, size = 11, color = C.text, weight = "regular", lines = 1) {
  const t = parent.addText(String(text));
  t.textColor = color;
  t.font = weight === "bold"
    ? Font.boldSystemFont(size)
    : weight === "semibold"
      ? Font.semiboldSystemFont(size)
      : Font.systemFont(size);
  t.lineLimit = lines;
  t.minimumScaleFactor = 0.65;
  return t;
}

function card(parent, width = null) {
  const s = parent.addStack();
  s.backgroundColor = C.panel;
  s.cornerRadius = 11;
  s.setPadding(8, 8, 8, 8);
  if (width) s.size = new Size(width, 0);
  return s;
}

function addIndicatorRow(parent, item) {
  const row = parent.addStack();
  row.centerAlignContent();
  addTxt(row, item.label || item.key || "Indikator", 8, C.text, "semibold");
  row.addSpacer();
  const score = num(item.score);
  addTxt(row, Number.isFinite(score) ? `${Math.round(score)}` : "—", 8, statusColor(item.status, score), "bold");
}

function liveOverlay(baseScore, flow, btcChange) {
  // Morning score remains the anchor. Live overlay is intentionally capped to avoid
  // pretending a 60-minute flow window changes the whole macro regime.
  if (!Number.isFinite(baseScore)) return { score: null, adjustment: 0 };
  let adjustment = 0;
  if (Number.isFinite(flow?.buyer)) adjustment += clamp((flow.buyer - 50) * 0.08, -2.5, 2.5);
  if (Number.isFinite(flow?.impulse)) adjustment += clamp(flow.impulse * 0.8, -1.5, 1.5);
  if (Number.isFinite(btcChange)) adjustment += clamp(btcChange * 0.15, -1.5, 1.5);
  adjustment = clamp(adjustment, -4, 4);
  return { score: clamp(baseScore + adjustment, 0, 100), adjustment };
}

async function main() {
  const [{ data: feed, source: feedSource }, btc, eth, flow] = await Promise.all([
    loadFeed(),
    get24h("BTCUSDT"),
    get24h("ETHUSDT"),
    getAggressiveFlow("BTCUSDT")
  ]);

  const moonLocal = approxMoon();
  const moonPhase = Number.isFinite(num(feed?.moon?.phase)) ? num(feed.moon.phase) : moonLocal.phase;
  const moonName = feed?.moon?.phaseName || feed?.moon?.name || moonLocal.name;
  const moonIll = Number.isFinite(num(feed?.moon?.illumination)) ? num(feed.moon.illumination) : moonLocal.illumination;

  const morningScore = num(feed.score);
  const overlay = liveOverlay(morningScore, flow, btc.change);
  const displayScore = Number.isFinite(overlay.score) ? overlay.score : morningScore;
  const displayBias = scoreBias(displayScore, feed.bias);
  const fresh = freshness(feed.generatedAt);

  const widget = new ListWidget();
  widget.backgroundColor = C.bg;
  widget.setPadding(10, 10, 10, 10);
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_MINUTES * 60000);

  const family = config.widgetFamily || "large";

  const head = widget.addStack();
  head.centerAlignContent();
  addTxt(head, "MARKET PULSE", 13, C.text, "bold");
  head.addSpacer();
  const liveColor = feedSource === "online" ? C.green : feedSource === "cache" ? C.yellow : C.red;
  addTxt(head, feedSource === "online" ? "● LIVE" : feedSource === "cache" ? "● CACHE" : "● OFFLINE", 8, liveColor, "semibold");
  widget.addSpacer(7);

  if (family === "small") {
    const g = widget.addImage(drawGauge(displayScore, new Size(290, 135)));
    g.resizable = true;
    g.imageSize = new Size(145, 68);
    widget.addSpacer(4);

    const row = widget.addStack();
    row.centerAlignContent();
    const mi = row.addImage(drawMoon(moonPhase, 48));
    mi.imageSize = new Size(31, 31);
    row.addSpacer(7);
    const col = row.addStack();
    col.layoutVertically();
    addTxt(col, moonName, 8, C.text, "semibold");
    addTxt(col, `Käufer ${pct(flow.buyer)}`, 9, Number.isFinite(flow.buyer) && flow.buyer >= 50 ? C.green : C.red, "semibold");
    addTxt(col, fresh.label, 7, fresh.stale ? C.orange : C.muted);

    Script.setWidget(widget);
    if (!config.runsInWidget) await widget.presentSmall();
    Script.complete();
    return;
  }

  const top = widget.addStack();

  const moonCard = card(top, 88);
  moonCard.layoutVertically();
  addTxt(moonCard, "MOND", 9, C.muted, "semibold");
  moonCard.addSpacer(3);
  const moonImage = moonCard.addImage(drawMoon(moonPhase, 68));
  moonImage.imageSize = new Size(56, 56);
  moonImage.centerAlignImage();
  moonCard.addSpacer(3);
  addTxt(moonCard, moonName, 8, C.text, "semibold", 2);
  addTxt(moonCard, `${pct(moonIll)} beleuchtet`, 7, C.muted);

  top.addSpacer(7);

  const gaugeCard = card(top);
  gaugeCard.layoutVertically();
  const gaugeHead = gaugeCard.addStack();
  addTxt(gaugeHead, "MARKT-PEGEL", 9, C.muted, "semibold");
  gaugeHead.addSpacer();
  if (Number.isFinite(morningScore)) addTxt(gaugeHead, `Morgen ${Math.round(morningScore)}`, 7, C.muted);
  const gaugeImage = gaugeCard.addImage(drawGauge(displayScore));
  gaugeImage.resizable = true;
  gaugeImage.imageSize = new Size(210, 99);
  gaugeImage.centerAlignImage();
  const confRow = gaugeCard.addStack();
  confRow.centerAlignContent();
  addTxt(confRow, "Confidence ", 8, C.muted);
  const conf = num(feed.confidence);
  addTxt(confRow, Number.isFinite(conf) ? pct(conf) : (feed.confidenceLabel || "—"), 8, C.cyan, "semibold");
  confRow.addSpacer();
  if (Number.isFinite(overlay.adjustment) && overlay.adjustment !== 0) {
    addTxt(confRow, `Live ${overlay.adjustment >= 0 ? "+" : ""}${overlay.adjustment.toFixed(1)}`, 7, overlay.adjustment >= 0 ? C.green : C.red, "semibold");
  }

  top.addSpacer(7);

  const flowCard = card(top, 118);
  flowCard.layoutVertically();
  addTxt(flowCard, "WER DRÜCKT?", 9, C.muted, "semibold");
  flowCard.addSpacer(4);
  addTxt(flowCard, `KÄUFER ${pct(flow.buyer)}`, 14, C.green, "bold");
  addTxt(flowCard, `VERKÄUFER ${pct(flow.seller)}`, 11, C.red, "semibold");
  flowCard.addSpacer(4);

  const flowBar = flowCard.addStack();
  flowBar.size = new Size(96, 7);
  flowBar.cornerRadius = 4;
  flowBar.backgroundColor = C.red;
  const buyerBar = flowBar.addStack();
  buyerBar.backgroundColor = C.green;
  buyerBar.cornerRadius = 4;
  buyerBar.size = new Size(Number.isFinite(flow.buyer) ? 96 * flow.buyer / 100 : 48, 7);

  flowCard.addSpacer(4);
  const flowLabel = Number.isFinite(flow.delta)
    ? (flow.delta > 4 ? "Kaufdruck" : flow.delta < -4 ? "Verkaufsdruck" : "ausgeglichen")
    : "keine Livedaten";
  addTxt(flowCard, flowLabel, 8, Number.isFinite(flow.delta) ? (flow.delta > 4 ? C.green : flow.delta < -4 ? C.red : C.yellow) : C.muted, "semibold");
  addTxt(flowCard, "Taker-Volumen · ~60m", 7, C.muted);

  widget.addSpacer(7);

  const markets = widget.addStack();
  const btcCard = card(markets);
  btcCard.layoutVertically();
  addTxt(btcCard, "BTC/USDT", 8, C.muted, "semibold");
  addTxt(btcCard, fmtPrice(btc.price), 12, C.text, "bold");
  addTxt(btcCard, signed(btc.change), 8, Number.isFinite(btc.change) && btc.change >= 0 ? C.green : C.red, "semibold");

  markets.addSpacer(6);

  const ethCard = card(markets);
  ethCard.layoutVertically();
  addTxt(ethCard, "ETH/USDT", 8, C.muted, "semibold");
  addTxt(ethCard, fmtPrice(eth.price), 12, C.text, "bold");
  addTxt(ethCard, signed(eth.change), 8, Number.isFinite(eth.change) && eth.change >= 0 ? C.green : C.red, "semibold");

  markets.addSpacer(6);

  const confirmCard = card(markets);
  confirmCard.layoutVertically();
  addTxt(confirmCard, "BESTÄTIGUNG", 8, C.muted, "semibold");
  const cms = (feed.crossMarkets || []).slice(0, 6);
  if (!cms.length) {
    addTxt(confirmCard, "wartet auf Morgenfeed", 8, C.muted);
  } else {
    const row = confirmCard.addStack();
    for (const m of cms) {
      addTxt(row, "●", 8, statusColor(m.status, num(m.score)));
      addTxt(row, m.symbol || "?", 7, C.muted);
      row.addSpacer(3);
    }
  }

  if (family === "medium") {
    widget.addSpacer(6);
    const statusRow = widget.addStack();
    addTxt(statusRow, displayBias, 11, scoreColor(displayScore), "bold");
    statusRow.addSpacer();
    addTxt(statusRow, fresh.label, 8, fresh.stale ? C.orange : C.muted);
    widget.addSpacer(3);
    addTxt(widget, feed.newsSummary || "Morgenfeed noch nicht verfügbar.", 8, C.muted, "regular", 2);
    Script.setWidget(widget);
    if (!config.runsInWidget) await widget.presentMedium();
    Script.complete();
    return;
  }

  widget.addSpacer(7);

  const body = widget.addStack();

  const indCard = card(body);
  indCard.layoutVertically();
  addTxt(indCard, "INDIKATOREN", 10, C.text, "bold");
  indCard.addSpacer(3);
  const indicators = (feed.indicators || []).slice(0, 7);
  if (!indicators.length) addTxt(indCard, "Keine Indikatorwerte im Feed", 8, C.muted);
  for (const item of indicators) {
    addIndicatorRow(indCard, item);
    indCard.addSpacer(2);
  }

  body.addSpacer(7);

  const brief = card(body, 158);
  brief.layoutVertically();
  addTxt(brief, "MORGEN-BIAS", 10, C.text, "bold");
  brief.addSpacer(3);
  addTxt(brief, displayBias, 16, scoreColor(displayScore), "bold");
  addTxt(brief, fresh.label, 7, fresh.stale ? C.orange : C.muted);
  brief.addSpacer(3);
  addTxt(brief, feed.newsSummary || "Feed wird morgens aktualisiert.", 8, C.muted, "regular", 2);
  brief.addSpacer(4);
  const reasons = (feed.topReasons || []).slice(0, 3);
  for (const reason of reasons) {
    const rr = brief.addStack();
    addTxt(rr, "●", 7, C.cyan);
    rr.addSpacer(3);
    addTxt(rr, reason, 7, C.muted, "regular", 2);
    brief.addSpacer(2);
  }

  widget.addSpacer(5);

  const foot = widget.addStack();
  foot.centerAlignContent();
  addTxt(foot, "Mond/Langzyklen = Timing, kein Allein-Trigger", 7, C.muted);
  foot.addSpacer();
  addTxt(foot, `Refresh ≥ ${REFRESH_MINUTES}m*`, 7, C.muted);

  Script.setWidget(widget);
  if (!config.runsInWidget) await widget.presentLarge();
  Script.complete();
}

await main();
