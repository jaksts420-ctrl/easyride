(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/util.js
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === void 0 || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(node.dataset, v);
      else node.setAttribute(k, v);
    }
    children.flat().forEach((c) => c !== null && c !== void 0 && node.append(c.nodeType ? c : String(c)));
    return node;
  }
  function fmtClock(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function fmtClockSec(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  function fmtDate(date) {
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function fmtDateTime(date) {
    return `${fmtDate(date)} ${fmtClock(date)}`;
  }
  function fmtDuration(ms) {
    const s = Math.max(0, Math.round(ms / 1e3));
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h} h ${pad(m % 60)} min`;
  }
  function fmtCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1e3));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
  }
  function hash01(...nums) {
    let h = 2166136261 >>> 0;
    for (const n of nums) {
      let x = Math.floor(n * 1e3) | 0;
      h ^= x;
      h = Math.imul(h, 16777619) >>> 0;
    }
    return (h >>> 0) / 4294967296;
  }
  function haversine(a, b) {
    const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  }
  function eur(n) {
    return `€${Number(n).toFixed(2)}`;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function debounce(fn, ms = 200) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }
  function bus() {
    const map = /* @__PURE__ */ new Map();
    return {
      on(evt, fn) {
        if (!map.has(evt)) map.set(evt, /* @__PURE__ */ new Set());
        map.get(evt).add(fn);
        return () => map.get(evt).delete(fn);
      },
      emit(evt, payload) {
        (map.get(evt) || []).forEach((fn) => {
          try {
            fn(payload);
          } catch (e) {
            console.error(e);
          }
        });
        (map.get("*") || []).forEach((fn) => {
          try {
            fn({ evt, payload });
          } catch (e) {
            console.error(e);
          }
        });
      }
    };
  }
  var $, pad, R, toRad, events;
  var init_util = __esm({
    "js/util.js"() {
      $ = (sel, root = document) => root.querySelector(sel);
      pad = (n, w = 2) => String(Math.floor(n)).padStart(w, "0");
      R = 6371e3;
      toRad = (d) => d * Math.PI / 180;
      events = bus();
    }
  });

  // js/data.js
  function buildStopIndex(routes2 = ROUTES) {
    const byName = /* @__PURE__ */ new Map();
    routes2.forEach((r) => {
      r.stops.forEach(([name, lat, lon], idx) => {
        if (!byName.has(name)) byName.set(name, { name, lat, lon, idx: 0, routes: [] });
        const s = byName.get(name);
        s.routes.push(r.id);
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  function routeById(id) {
    return ROUTES.find((r) => r.id === id) || null;
  }
  function fareById(id) {
    return FARES.find((f) => f.id === id) || null;
  }
  function routeGeometry(route2) {
    const pts = route2.stops.map(([name, lat, lon]) => ({ name, lat, lon }));
    const R3 = 6371e3, toRad2 = (d) => d * Math.PI / 180;
    const cum = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const dLat = toRad2(b.lat - a.lat), dLon = toRad2(b.lon - a.lon);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad2(a.lat)) * Math.cos(toRad2(b.lat)) * Math.sin(dLon / 2) ** 2;
      total += 2 * R3 * Math.asin(Math.sqrt(h));
      cum.push(total);
    }
    return { pts, cum, total };
  }
  var OPERATOR, FARES, TOPUPS, ROUTES, ALERTS;
  var init_data = __esm({
    "js/data.js"() {
      OPERATOR = {
        id: "rigas-satiksme",
        name: "Rīgas satiksme",
        city: "Rīga",
        currency: "EUR",
        mode: "tram · trolleybus · bus · minibus",
        supportPhone: "+371 8000 1900",
        fineRange: [15, 30]
      };
      FARES = [
        { id: "t90", name: "90-minute ticket", price: 1.5, kind: "time", minutes: 90, desc: "Any tram, trolleybus or bus. Re-register on every vehicle you enter; last registration at minute 89.", popular: true },
        { id: "d1", name: "24-hour ticket", price: 5, kind: "time", minutes: 1440, desc: "Unlimited travel on all Rīgas satiksme routes for 24 hours from first registration." },
        { id: "d3", name: "3-day ticket", price: 8, kind: "time", minutes: 4320, desc: "72 hours from first registration." },
        { id: "d5", name: "5-day ticket", price: 10, kind: "time", minutes: 7200, desc: "120 hours from first registration." },
        { id: "m30", name: "Monthly ticket", price: 30, kind: "time", minutes: 43200, desc: "30 days from first registration, all public transport types. 50% discount for eligible groups." },
        { id: "nb115", name: "Night route ticket", price: 1.15, kind: "single", desc: "One trip on a night route. Bought from the driver it costs €2.00." },
        { id: "mb115", name: "Minibus ticket", price: 1.15, kind: "single", desc: "One trip on a Rīgas mikroautobusu satiksme minibus route." },
        { id: "b22", name: "Bus 22 (airport)", price: 2, kind: "single", desc: "Ticket sold on board route 22, card payment only. Prepaid tickets are also valid." },
        { id: "unified", name: "Riga unified ticket", price: 2, kind: "combo", desc: "Train ticket for zone A / Riga plus a 90-minute public transport ticket." }
      ];
      TOPUPS = [5, 10, 20, 50];
      ROUTES = [
        {
          id: "t1",
          mode: "tram",
          number: "1",
          color: "#f97316",
          name: "Imanta ↔ Jugla",
          headsigns: ["Jugla", "Imanta"],
          headway: { peak: 6, off: 12 },
          stops: [
            ["Imanta", 56.9565, 24.0345],
            ["Anniņmuiža", 56.9545, 24.0405],
            ["Dzirciema iela", 56.9528, 24.047],
            ["Botāniskais dārzs", 56.95, 24.0525],
            ["Slokas iela", 56.947, 24.058],
            ["Uzvaras parks", 56.9435, 24.069],
            ["Akmens tilts", 56.9412, 24.08],
            ["Nacionālā bibliotēka", 56.9408, 24.088],
            ["11. novembra krastmala", 56.9425, 24.0985],
            ["13. janvāra iela", 56.9428, 24.1075],
            ["Centrāltirgus", 56.9427, 24.115],
            ["Stacijas laukums", 56.9455, 24.122],
            ["Merķeļa iela", 56.9472, 24.1258],
            ["Brīvības piemineklis", 56.9508, 24.1185],
            ["Ģertrūdes iela", 56.9525, 24.1275],
            ["Gaisa tilts", 56.9575, 24.14],
            ["Zemitāni", 56.9603, 24.1575],
            ["Biķernieki", 56.965, 24.1745],
            ["Šmerlis", 56.969, 24.187],
            ["Jugla", 56.973, 24.2]
          ],
          note: "Replacement buses run on the Zemitāni section during track renewal works in this demo scenario."
        },
        {
          id: "t2",
          mode: "tram",
          number: "2",
          color: "#f97316",
          name: "Centrāltirgus ↔ Tapešu iela",
          headsigns: ["Tapešu iela", "Centrāltirgus"],
          headway: { peak: 8, off: 14 },
          stops: [
            ["Centrāltirgus", 56.9427, 24.115],
            ["Katoļu iela", 56.9398, 24.1265],
            ["Jēkabpils iela", 56.936, 24.136],
            ["Mazā Krasta iela", 56.9325, 24.145],
            ["Ķengaraga iela", 56.93, 24.152],
            ["Prūšu iela", 56.9282, 24.159],
            ["Rušonu iela", 56.9265, 24.1665],
            ["Dienvidu tilts", 56.9252, 24.1735],
            ["Tapešu iela", 56.9235, 24.181]
          ]
        },
        {
          id: "t5",
          mode: "tram",
          number: "5",
          color: "#f97316",
          name: "Iļģuciems ↔ Mīlgrāvis",
          headsigns: ["Mīlgrāvis", "Iļģuciems"],
          headway: { peak: 9, off: 15 },
          stops: [
            ["Iļģuciems", 56.9632, 24.0685],
            ["Buļļu iela", 56.9578, 24.0738],
            ["Kalnciema kvartāls", 56.9498, 24.0792],
            ["Āgenskalna tirgus", 56.9438, 24.0832],
            ["Akmens tilts", 56.9412, 24.0872],
            ["Nacionālā bibliotēka", 56.9408, 24.092],
            ["11. novembra krastmala", 56.9425, 24.0965],
            ["Eksporta iela", 56.95, 24.1035],
            ["Pētersalas iela", 56.963, 24.1075],
            ["Sarkandaugava", 56.9748, 24.1155],
            ["Rīnūžu iela", 56.9815, 24.1215],
            ["Mīlgrāvis", 56.9868, 24.129]
          ]
        },
        {
          id: "tb15",
          mode: "trolley",
          number: "15",
          color: "#a78bfa",
          name: "Latvijas Universitāte ↔ Višķu iela",
          headsigns: ["Višķu iela", "Latvijas Universitāte"],
          headway: { peak: 7, off: 13 },
          stops: [
            ["Latvijas Universitāte", 56.9506, 24.118],
            ["Nacionālā opera", 56.9485, 24.114],
            ["13. janvāra iela", 56.9428, 24.107],
            ["Centrāltirgus", 56.9427, 24.115],
            ["Katoļu iela", 56.9385, 24.1275],
            ["Maskavas forštate", 56.936, 24.133],
            ["Jēkabpils iela", 56.933, 24.14],
            ["Ķengaraga iela", 56.93, 24.148],
            ["Prūšu iela", 56.928, 24.155],
            ["Dienvidu tilts", 56.9252, 24.1685],
            ["Mazjumpravas iela", 56.9245, 24.1725],
            ["Višķu iela", 56.9225, 24.179]
          ]
        },
        {
          id: "tb9",
          mode: "trolley",
          number: "9",
          color: "#a78bfa",
          name: "Latvijas Universitāte ↔ Purvciems",
          headsigns: ["Purvciems", "Latvijas Universitāte"],
          headway: { peak: 8, off: 14 },
          stops: [
            ["Latvijas Universitāte", 56.9506, 24.118],
            ["Brīvības piemineklis", 56.9508, 24.114],
            ["Ģertrūdes iela", 56.9525, 24.1275],
            ["Tallinas iela", 56.9555, 24.136],
            ["Zemitāni", 56.9603, 24.1575],
            ["Vairoga iela", 56.958, 24.168],
            ["Dzelzavas iela", 56.955, 24.177],
            ["Purvciems", 56.9505, 24.184]
          ]
        },
        {
          id: "b22",
          mode: "bus",
          number: "22",
          color: "#38bdf8",
          name: "Abrenes iela ↔ Lidosta RIX",
          headsigns: ["Lidosta RIX", "Abrenes iela"],
          headway: { peak: 10, off: 20 },
          airport: true,
          stops: [
            ["Abrenes iela", 56.9458, 24.1305],
            ["Centrālā stacija", 56.945, 24.12],
            ["13. janvāra iela", 56.9428, 24.108],
            ["Nacionālā bibliotēka", 56.9408, 24.0915],
            ["Uzvaras parks", 56.9402, 24.079],
            ["Lielirbes iela", 56.935, 24.06],
            ["Ozolciema iela", 56.93, 24.042],
            ["Lidosta RIX", 56.9236, 23.9711]
          ],
          note: "Express service to the airport. On-board ticketing with card only; prepaid tickets valid."
        },
        {
          id: "b3",
          mode: "bus",
          number: "3",
          color: "#38bdf8",
          name: "Ziepniekkalns ↔ Pļavnieki",
          headsigns: ["Pļavnieki", "Ziepniekkalns"],
          headway: { peak: 11, off: 18 },
          stops: [
            ["Ziepniekkalns", 56.9255, 24.068],
            ["Torņakalns", 56.9295, 24.079],
            ["Uzvaras parks", 56.9435, 24.069],
            ["Akmens tilts", 56.9412, 24.0835],
            ["11. novembra krastmala", 56.9425, 24.096],
            ["Centrāltirgus", 56.9427, 24.115],
            ["Katoļu iela", 56.9398, 24.1265],
            ["Jēkabpils iela", 56.936, 24.136],
            ["Ķengaraga iela", 56.93, 24.152],
            ["Daugavpils iela", 56.9285, 24.166],
            ["Pļavnieki", 56.933, 24.196]
          ]
        }
      ];
      ALERTS = [
        {
          id: "a1",
          level: "warn",
          mode: "tram",
          route: "t1",
          title: "Tram 1 — works near Zemitāni",
          body: "Track renewal works. Expect 3–5 minute delays between Gaisa tilts and Biķernieki until 30 September.",
          at: "today"
        },
        {
          id: "a2",
          level: "info",
          mode: "bus",
          route: "b22",
          title: "Bus 22 — airport stop moved",
          body: "The Lidosta RIX stop has moved to pier P2 while the arrivals terminal forecourt is rebuilt.",
          at: "today"
        },
        {
          id: "a3",
          level: "info",
          mode: "tram",
          route: null,
          title: "Night routes: weekend frequency",
          body: "On Friday and Saturday nights, night routes run every 30 minutes instead of 60.",
          at: "yesterday"
        },
        {
          id: "a4",
          level: "bad",
          mode: "trolley",
          route: "tb9",
          title: "Trolleybus 9 — diversion",
          body: "Due to a road closure on Dzelzavas iela, trolleybus 9 is diverted via Vaidavas iela. Stops Purvciems and Dzelzavas iela are not served.",
          at: "2 days ago"
        }
      ];
    }
  });

  // js/crypto.js
  var crypto_exports = {};
  __export(crypto_exports, {
    beaconPayload: () => beaconPayload,
    cryptoAvailable: () => cryptoAvailable,
    hmac: () => hmac,
    issueTicketToken: () => issueTicketToken,
    randomNonce: () => randomNonce,
    sha256Hex: () => sha256Hex,
    signBeacon: () => signBeacon,
    timingSafeEqualStr: () => timingSafeEqualStr,
    verifyBeacon: () => verifyBeacon,
    verifyHmac: () => verifyHmac,
    verifyTicketToken: () => verifyTicketToken
  });
  function keyForUnit(unitId) {
    if (!UNIT_KEYS.has(unitId)) {
      let h = 2166136261;
      for (const ch of unitId) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619) >>> 0;
      }
      UNIT_KEYS.set(unitId, `pietura-demo-key-${h.toString(16)}`);
    }
    return UNIT_KEYS.get(unitId);
  }
  function toHex(buf) {
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function weakHmac(message, secret) {
    let h = 2654435769 ^ secret.length;
    const s = `${secret}|${message}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    let out = "";
    for (let i = 0; i < 4; i++) out += (Math.imul(h ^ i * 2654435761, 2246822519) >>> 0).toString(16).padStart(8, "0");
    return out;
  }
  async function hmac(message, secret) {
    if (!subtle) return `weak-${weakHmac(message, secret)}`;
    const key = await subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await subtle.sign("HMAC", key, enc.encode(message));
    return toHex(sig);
  }
  function timingSafeEqualStr(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
  async function verifyHmac(message, secret, signature) {
    if (typeof signature !== "string" || !signature || signature.length > 128) return false;
    const expected = await hmac(message, secret);
    return timingSafeEqualStr(expected, signature);
  }
  async function sha256Hex(text) {
    if (!subtle) return `weak-${weakHmac(text, "hash")}`;
    const buf = await subtle.digest("SHA-256", enc.encode(text));
    return toHex(buf);
  }
  function beaconPayload({ unitId, routeId, tripId: tripId2, dir, stopSeq, counter, timestamp, nonce }) {
    return `ER-BEACON/1|${unitId}|${routeId}|${tripId2}|${dir}|${stopSeq}|${counter}|${timestamp}|${nonce}`;
  }
  async function signBeacon(fields) {
    const payload = beaconPayload(fields);
    const signature = await hmac(payload, keyForUnit(fields.unitId));
    return { ...fields, payload, signature, algorithm: cryptoAvailable ? "HMAC-SHA256" : "weak-demo" };
  }
  async function verifyBeacon(beacon, seen = { nonces: /* @__PURE__ */ new Set(), counters: /* @__PURE__ */ new Map() }, now3 = Date.now()) {
    if (!beacon || typeof beacon.payload !== "string" || beacon.payload.length > 512) {
      return { ok: false, reason: "malformed" };
    }
    if (typeof beacon.unitId !== "string" || beacon.unitId.length > 64) {
      return { ok: false, reason: "malformed" };
    }
    const rebuilt = beaconPayload(beacon);
    if (rebuilt !== beacon.payload) return { ok: false, reason: "payload-mismatch" };
    const fresh = await verifyHmac(beacon.payload, keyForUnit(beacon.unitId), beacon.signature);
    if (!fresh) return { ok: false, reason: "bad-signature" };
    if (!Number.isFinite(beacon.timestamp) || !Number.isFinite(beacon.counter)) {
      return { ok: false, reason: "malformed" };
    }
    const age = Math.abs(now3 - beacon.timestamp);
    if (age > 12e4) return { ok: false, reason: "stale" };
    if (seen.nonces.has(beacon.nonce)) return { ok: false, reason: "replayed-nonce" };
    const last = seen.counters.get(beacon.unitId);
    if (last !== void 0 && beacon.counter <= last) return { ok: false, reason: "replayed-counter" };
    if (seen.nonces.size > 2e3) {
      const oldest = seen.nonces.values().next().value;
      if (oldest !== void 0) seen.nonces.delete(oldest);
    }
    return { ok: true, reason: "verified" };
  }
  function safeParseJson(str) {
    return JSON.parse(str, (k, v) => k === "__proto__" || k === "constructor" || k === "prototype" ? void 0 : v);
  }
  async function issueTicketToken(ticket, holder = "demo-passenger") {
    const safeHolder = String(holder || "demo-passenger").slice(0, 64);
    const body = {
      v: 1,
      iss: "easyride-demo",
      operator: "rigas-satiksme",
      t: String(ticket.id).slice(0, 64),
      p: String(ticket.fareId).slice(0, 32),
      f: Number(ticket.validFrom) || 0,
      x: Number(ticket.validTo) || 0,
      r: ticket.routeId ? String(ticket.routeId).slice(0, 32) : null,
      vh: ticket.vehicleId ? String(ticket.vehicleId).slice(0, 64) : null,
      h: safeHolder
    };
    const json = JSON.stringify(body);
    const sig = (await hmac(json, TICKET_SECRET)).slice(0, 32);
    return `ER1.${b64url(json)}.${sig}`;
  }
  async function verifyTicketToken(token, now3 = Date.now()) {
    if (typeof token !== "string" || token.length > 2048 || !token.startsWith("ER1.") && !token.startsWith("PIE1.")) {
      return { ok: false, reason: "not-an-easyride-token" };
    }
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "corrupt" };
    const [, body, sig] = parts;
    if (!body || !sig || sig.length !== 24 && sig.length !== 32) return { ok: false, reason: "bad-signature" };
    let json;
    try {
      json = unb64url(body);
    } catch {
      return { ok: false, reason: "corrupt" };
    }
    const fullMac = await hmac(json, TICKET_SECRET);
    const expect = fullMac.slice(0, sig.length);
    if (!timingSafeEqualStr(expect, sig)) return { ok: false, reason: "bad-signature" };
    let data;
    try {
      data = safeParseJson(json);
    } catch {
      return { ok: false, reason: "corrupt" };
    }
    if (!data || typeof data !== "object" || !Number.isFinite(data.f) || !Number.isFinite(data.x)) {
      return { ok: false, reason: "corrupt" };
    }
    const active = now3 >= data.f - 3e4 && now3 <= data.x + 3e4;
    return { ok: true, active, reason: active ? "valid" : now3 < data.f ? "not-yet-valid" : "expired", data };
  }
  function randomNonce() {
    const a = new Uint8Array(8);
    (globalThis.crypto || {}).getRandomValues?.(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("") || Math.random().toString(16).slice(2, 18);
  }
  var enc, UNIT_KEYS, subtle, cryptoAvailable, b64url, unb64url, TICKET_SECRET;
  var init_crypto = __esm({
    "js/crypto.js"() {
      enc = new TextEncoder();
      UNIT_KEYS = /* @__PURE__ */ new Map();
      subtle = globalThis.crypto?.subtle;
      cryptoAvailable = !!subtle;
      b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
      TICKET_SECRET = "pietura-demo-issuer-secret-2026";
    }
  });

  // js/store.js
  var store_exports = {};
  __export(store_exports, {
    FARES_LIST: () => FARES_LIST,
    activeTickets: () => activeTickets,
    addMethod: () => addMethod,
    currentTicket: () => currentTicket,
    defaultMethod: () => defaultMethod,
    endTrip: () => endTrip,
    expireTickets: () => expireTickets,
    lastRegistrationOf: () => lastRegistrationOf,
    logEvent: () => logEvent,
    makeReceipt: () => makeReceipt,
    markNotificationsRead: () => markNotificationsRead,
    notify: () => notify,
    now: () => now,
    openTrip: () => openTrip,
    planBoarding: () => planBoarding,
    purchase: () => purchase,
    registerBoarding: () => registerBoarding,
    resetAll: () => resetAll,
    save: () => save,
    setClock: () => setClock,
    setPref: () => setPref,
    setRole: () => setRole,
    spendSummary: () => spendSummary,
    state: () => state,
    storageAvailable: () => storageAvailable,
    todaySpend: () => todaySpend,
    toggleSavedStop: () => toggleSavedStop,
    topUp: () => topUp
  });
  function safeJsonParse(raw) {
    if (typeof raw !== "string" || raw.length > 1e6) return null;
    return JSON.parse(raw, (k, v) => FORBIDDEN_KEYS.has(k) ? void 0 : v);
  }
  function isEmbedContext() {
    try {
      return !!(window.__EASYRIDE_EMBED__ || /[?&]embed=1\b/.test(location.search));
    } catch {
      return false;
    }
  }
  function isTrustedMessageEvent(e) {
    try {
      if (!window.parent || window.parent === window) return false;
      if (e.source !== window.parent) return false;
      const selfOrigin = location.origin;
      if (selfOrigin && selfOrigin !== "null") return e.origin === selfOrigin;
      return e.origin === "null";
    } catch {
      return false;
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULTS();
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== "object") return DEFAULTS();
      const def = DEFAULTS();
      const validRole = parsed.role === "passenger" || parsed.role === "driver" ? parsed.role : null;
      return {
        ...def,
        onboarded: Boolean(parsed.onboarded),
        role: validRole,
        profile: parsed.profile && typeof parsed.profile === "object" ? { ...def.profile, ...parsed.profile } : def.profile,
        driver: { ...def.driver, ...parsed.driver && typeof parsed.driver === "object" ? parsed.driver : {} },
        prefs: {
          ...def.prefs,
          ...parsed.prefs && typeof parsed.prefs === "object" ? parsed.prefs : {},
          handsFree: { ...def.prefs.handsFree, ...parsed.prefs?.handsFree && typeof parsed.prefs.handsFree === "object" ? parsed.prefs.handsFree : {} }
        },
        wallet: parsed.wallet && typeof parsed.wallet === "object" && Number.isFinite(parsed.wallet.balance) ? { ...def.wallet, ...parsed.wallet, balance: Math.max(0, Math.min(1e4, Number(parsed.wallet.balance))) } : def.wallet,
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets.slice(0, 300) : [],
        trips: Array.isArray(parsed.trips) ? parsed.trips.slice(0, 300) : [],
        receipts: Array.isArray(parsed.receipts) ? parsed.receipts.slice(0, 300) : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications.slice(0, 100) : [],
        stats: parsed.stats && typeof parsed.stats === "object" ? { ...def.stats, ...parsed.stats } : def.stats
      };
    } catch {
      return DEFAULTS();
    }
  }
  function setRole(role) {
    state.role = role === "passenger" || role === "driver" ? role : null;
    save();
    events.emit("role", state.role);
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("persist failed", e);
    }
    try {
      if (isEmbedContext() && window.parent && window.parent !== window) {
        const targetOrigin = location.origin && location.origin !== "null" ? location.origin : "*";
        window.parent.postMessage({
          type: "easyride:sync",
          payload: {
            wallet: state.wallet,
            tickets: state.tickets,
            trips: state.trips,
            receipts: state.receipts,
            stats: state.stats
          }
        }, targetOrigin);
      }
    } catch {
    }
    events.emit("state", state);
  }
  function applyExternalSync(incoming) {
    if (!incoming || typeof incoming !== "object") return;
    const prevVeh = state.trips.find((x) => !x.alightAt)?.vehicleId || null;
    if (incoming.wallet && typeof incoming.wallet === "object" && Number.isFinite(incoming.wallet.balance)) {
      state.wallet = {
        ...state.wallet,
        balance: Math.max(0, Math.min(1e4, Number(incoming.wallet.balance))),
        autoTopUp: Boolean(incoming.wallet.autoTopUp)
      };
    }
    if (Array.isArray(incoming.tickets)) state.tickets = incoming.tickets.slice(0, 300);
    if (Array.isArray(incoming.trips)) state.trips = incoming.trips.slice(0, 300);
    if (Array.isArray(incoming.receipts)) state.receipts = incoming.receipts.slice(0, 300);
    if (incoming.stats && typeof incoming.stats === "object") {
      state.stats = {
        handsFreeBoardings: Math.max(0, Number(incoming.stats.handsFreeBoardings) || 0),
        manualBoardings: Math.max(0, Number(incoming.stats.manualBoardings) || 0),
        rejectedBeacons: Math.max(0, Number(incoming.stats.rejectedBeacons) || 0),
        spoofAttempts: Math.max(0, Number(incoming.stats.spoofAttempts) || 0),
        spend: Math.max(0, Number(incoming.stats.spend) || 0)
      };
    }
    const nextVeh = state.trips.find((x) => !x.alightAt)?.vehicleId || null;
    if (nextVeh && typeof nextVeh === "string" && nextVeh.length <= 64 && nextVeh !== prevVeh && state.role === "driver") {
      state.driver.vehicleId = nextVeh;
    }
    events.emit("state", state);
  }
  function resetAll() {
    localStorage.removeItem(KEY);
    Object.assign(state, DEFAULTS());
    save();
  }
  function setClock(fn) {
    clock = fn;
  }
  function activeTickets(t = now()) {
    return state.tickets.filter((tk) => tk.status === "active" && tk.validTo > t);
  }
  function currentTicket(t = now()) {
    return activeTickets(t).sort((a, b) => b.validTo - a.validTo)[0] || null;
  }
  function lastRegistrationOf(ticket) {
    if (!ticket?.registrations?.length) return null;
    return ticket.registrations[ticket.registrations.length - 1];
  }
  function todaySpend(t = now()) {
    const start = new Date(t);
    start.setHours(0, 0, 0, 0);
    return state.receipts.filter((r) => r.at >= start.getTime() && r.kind !== "refund").reduce((sum, r) => sum + r.total, 0);
  }
  function logEvent(level, msg, meta = {}) {
    const entry = { at: now(), level, msg, ...meta };
    state.events.unshift(entry);
    state.events = state.events.slice(0, 400);
    events.emit("event", entry);
    save();
    return entry;
  }
  function notify(title, body, level = "info") {
    state.notifications.unshift({ id: uid("ntf"), at: now(), title, body, level, read: false });
    state.notifications = state.notifications.slice(0, 60);
    events.emit("notification", { title, body, level });
    save();
  }
  function addMethod({ brand, last4, exp }) {
    const m = { id: uid("pm"), brand, last4, exp, isDefault: state.methods.length === 0 };
    state.methods.push(m);
    save();
    return m;
  }
  function defaultMethod() {
    return state.methods.find((m) => m.isDefault) || state.methods[0] || null;
  }
  async function makeReceipt({ kind, items, total, note }) {
    const id = `RS-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const method = defaultMethod();
    const r = {
      id,
      at: now(),
      kind,
      items,
      total,
      note: note || null,
      method: method ? `${method.brand} •••• ${method.last4}` : "Wallet balance",
      hash: (await sha256Hex(`${id}|${total}|${kind}`)).slice(0, 32),
      status: "paid"
    };
    state.receipts.unshift(r);
    state.receipts = state.receipts.slice(0, 200);
    save();
    return r;
  }
  async function topUp(amount) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (!state.methods.length) await autoProvisionMethod();
    state.wallet.balance = +(state.wallet.balance + amount).toFixed(2);
    const r = await makeReceipt({ kind: "topup", items: [{ label: "Wallet top-up", qty: 1, price: amount }], total: amount });
    logEvent("ok", `Wallet topped up by ${eur(amount)} — receipt ${r.id}`);
    save();
    return r;
  }
  async function autoProvisionMethod() {
    addMethod({ brand: "Visa", last4: "4242", exp: "12/28" });
  }
  async function purchase(fareId, qty = 1) {
    const fare = fareById(fareId);
    if (!fare) throw new Error("Unknown fare");
    const total = +(fare.price * qty).toFixed(2);
    if (!state.methods.length) await autoProvisionMethod();
    const receipt2 = await makeReceipt({
      kind: "purchase",
      items: [{ label: fare.name, qty, price: fare.price }],
      total,
      note: `${qty} × ${fare.name}`
    });
    const created = [];
    for (let i = 0; i < qty; i++) {
      const ticket = {
        id: uid("tk"),
        fareId,
        price: fare.price,
        purchasedAt: now(),
        validFrom: null,
        validTo: null,
        status: "unused",
        registrations: [],
        receiptId: receipt2.id
      };
      ticket.token = await issueTicketToken({ ...ticket, validFrom: now(), validTo: now() + fare.minutes * 6e4 });
      state.tickets.unshift(ticket);
      created.push(ticket);
    }
    logEvent("ok", `Purchased ${qty} × ${fare.name} for ${eur(total)} — receipt ${receipt2.id}`);
    notify("Ticket purchase complete", `${qty} × ${fare.name} · ${eur(total)} · receipt ${receipt2.id}`, "ok");
    save();
    return { receipt: receipt2, tickets: created };
  }
  function expireTickets(t = now()) {
    let changed = false;
    for (const tk of state.tickets) {
      if (tk.status === "active" && tk.validTo <= t) {
        tk.status = "expired";
        changed = true;
      }
    }
    if (changed) save();
  }
  function planBoarding(t = now()) {
    const prefs = state.prefs.handsFree;
    const current2 = currentTicket(t);
    if (current2) {
      const fare2 = fareById(current2.fareId);
      const last = lastRegistrationOf(current2);
      const needsReRegister = fare2?.id === "t90";
      if (needsReRegister && last) {
        const since = (t - last.at) / 6e4;
        if (since < 89) return { ticket: current2, action: "transfer", reason: `90-minute ticket is valid for ${(89 - since).toFixed(0)} more minutes — no new ticket needed`, cost: 0 };
        if (since < 90) return { ticket: current2, action: "transfer", reason: "last registration still inside the 90-minute window", cost: 0 };
      }
      if (needsReRegister && !last) return { ticket: current2, action: "reuse", reason: "first registration of this ticket", cost: 0 };
      if (!needsReRegister) return { ticket: current2, action: "reuse", reason: `${fare2?.name} is already active`, cost: 0 };
    }
    const unused = state.tickets.find((tk) => tk.status === "unused" && tk.fareId !== "nb115" && tk.fareId !== "mb115");
    if (unused) return { ticket: unused, action: "use-unused", reason: "using a ticket already in the wallet", cost: 0 };
    if (!prefs.autoBuy) return { ticket: null, action: "blocked", reason: "hands-free auto-buy is switched off and the wallet has no ticket", cost: 0 };
    const spent = todaySpend(t);
    const money = prefs.autoBuyProduct === "none";
    if (money) return { ticket: null, action: "blocked", reason: "auto-buy set to “never buy” in settings", cost: 0 };
    let product = prefs.autoBuyProduct;
    if (product === "smart") {
      const boardingsToday = state.trips.filter((tr) => sameDay(tr.boardAt, t)).length + 1;
      product = boardingsToday >= 3 ? "d1" : "t90";
    }
    const fare = fareById(product) || fareById("t90");
    if (spent + fare.price > prefs.dailyCap) {
      return { ticket: null, action: "blocked", reason: `daily hands-free spending limit of ${eur(prefs.dailyCap)} reached`, cost: fare.price };
    }
    if (state.wallet.balance + 1e-4 < fare.price) {
      return { ticket: null, action: "blocked", reason: `wallet balance ${eur(state.wallet.balance)} is not enough for a ${fare.name} (${eur(fare.price)})`, cost: fare.price };
    }
    return { ticket: null, action: "buy", product: fare.id, reason: `auto-buying a ${fare.name}`, cost: fare.price };
  }
  async function registerBoarding({ routeId, direction, stopName, vehicleId, unitId, method = "hands-free", evidence = [], t = now() }) {
    const plan = planBoarding(t);
    let ticket = plan.ticket;
    let charged = 0;
    let product = null;
    if (plan.action === "blocked") {
      logEvent("warn", `Boarding not registered: ${plan.reason}`, { routeId, vehicleId });
      notify("Boarding needs your attention", plan.reason, "warn");
      return { ok: false, reason: plan.reason, action: "blocked" };
    }
    if (plan.action === "buy") {
      const res = await purchase(plan.product, 1);
      ticket = res.tickets[0];
      charged = plan.cost;
      product = plan.product;
    }
    if (!ticket) return { ok: false, reason: "no ticket available", action: "blocked" };
    const fare = fareById(ticket.fareId);
    const firstUse = !ticket.validFrom;
    if (firstUse) {
      ticket.validFrom = t;
      ticket.validTo = t + fare.minutes * 6e4;
      ticket.status = "active";
    } else if (ticket.status === "unused") {
      ticket.status = "active";
    }
    ticket.registrations.push({
      at: t,
      routeId,
      direction,
      stopName,
      vehicleId,
      unitId,
      method,
      firstOfTicket: firstUse,
      evidence
    });
    ticket.token = await issueTicketToken(ticket, state.profile.holderId);
    const trip = {
      id: uid("tr"),
      ticketId: ticket.id,
      fareId: ticket.fareId,
      fareName: fare.name,
      routeId,
      direction,
      vehicleId,
      unitId,
      boardAt: t,
      boardStop: stopName,
      boardMethod: method,
      boardEvidence: evidence,
      alightAt: null,
      alightStop: null,
      charged
    };
    state.trips.unshift(trip);
    state.trips = state.trips.slice(0, 300);
    if (method === "hands-free") state.stats.handsFreeBoardings++;
    else state.stats.manualBoardings++;
    state.stats.spend = +(state.stats.spend + charged).toFixed(2);
    logEvent("ok", `Boarding registered on route ${routeId} (${method}) — ${plan.action}${charged ? `, charged ${eur(charged)}` : ", no charge"}`, { routeId, vehicleId });
    save();
    events.emit("boarding", { trip, ticket, action: plan.action, charged, reason: plan.reason });
    return { ok: true, trip, ticket, action: plan.action, charged, reason: plan.reason, product };
  }
  function endTrip(tripId2, { stopName, t = now() } = {}) {
    const trip = state.trips.find((x) => x.id === tripId2);
    if (!trip || trip.alightAt) return null;
    trip.alightAt = t;
    trip.alightStop = stopName || null;
    save();
    events.emit("alight", trip);
    return trip;
  }
  function openTrip() {
    return state.trips.find((x) => !x.alightAt) || null;
  }
  function setPref(path, value) {
    const parts = path.split(".");
    let node = state.prefs;
    for (const p of parts.slice(0, -1)) node = node[p];
    node[parts.at(-1)] = value;
    save();
  }
  function toggleSavedStop(name) {
    const list = state.prefs.savedStops;
    const i = list.indexOf(name);
    if (i >= 0) list.splice(i, 1);
    else list.push(name);
    save();
    return i < 0;
  }
  function markNotificationsRead() {
    state.notifications.forEach((n) => {
      n.read = true;
    });
    save();
  }
  function spendSummary() {
    const byDay = /* @__PURE__ */ new Map();
    for (const r of state.receipts) {
      const d = new Date(r.at).toDateString();
      byDay.set(d, +((byDay.get(d) || 0) + (r.kind === "refund" ? -r.total : r.total)).toFixed(2));
    }
    return [...byDay.entries()].slice(0, 7);
  }
  var KEY, DEFAULTS, storageAvailable, FORBIDDEN_KEYS, state, clock, now, sameDay, FARES_LIST;
  var init_store = __esm({
    "js/store.js"() {
      init_util();
      init_data();
      init_crypto();
      KEY = "pietura.state.v1";
      DEFAULTS = () => ({
        version: 1,
        role: null,
        // null (choose at start) | 'passenger' | 'driver'
        onboarded: false,
        driver: { vehicleId: null },
        profile: { holderId: "LV-DEMO-8842", name: "Demo passenger" },
        prefs: {
          handsFree: {
            enabled: true,
            mode: "ping",
            // silent | ping | confirm
            autoBuy: true,
            autoBuyProduct: "smart",
            // smart | t90 | d1 | none
            dailyCap: 12,
            sensors: { ble: true, gps: true, nfc: false },
            rssiThreshold: -78,
            // dBm — how close the phone must be to the unit
            dwellMs: 2500,
            // beacon must be seen this long before boarding counts
            cooldownMs: 45e3,
            // ignore re-boarding of the same unit within this window
            requireSecondSource: true
            // require BLE + GPS to agree
          },
          notifications: true,
          ticketAlertBeforeMs: 5 * 6e4,
          savedStops: ["Centrāltirgus", "Stacijas laukums"],
          lastRoute: "t1"
        },
        wallet: { balance: 12 },
        methods: [],
        tickets: [],
        trips: [],
        receipts: [],
        notifications: [],
        events: [],
        stats: { handsFreeBoardings: 0, manualBoardings: 0, rejectedBeacons: 0, spoofAttempts: 0, spend: 0 }
      });
      storageAvailable = (() => {
        try {
          localStorage.setItem("pietura.probe", "1");
          localStorage.removeItem("pietura.probe");
          return true;
        } catch {
          return false;
        }
      })();
      FORBIDDEN_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
      state = load();
      try {
        window.addEventListener("storage", (e) => {
          if (e.key !== KEY || !e.newValue) return;
          try {
            applyExternalSync(safeJsonParse(e.newValue));
          } catch {
          }
        });
        window.addEventListener("message", (e) => {
          if (!isEmbedContext() || !isTrustedMessageEvent(e)) return;
          if (e.data?.type === "easyride:sync-apply") applyExternalSync(e.data.payload);
        });
      } catch {
      }
      clock = () => Date.now();
      now = () => clock();
      sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
      FARES_LIST = FARES;
    }
  });

  // js/sim.js
  var sim_exports = {};
  __export(sim_exports, {
    beaconFor: () => beaconFor,
    departuresForRoute: () => departuresForRoute,
    departuresForStop: () => departuresForStop,
    fleetStats: () => fleetStats,
    getScale: () => getScale,
    invalidateFleetCache: () => invalidateFleetCache,
    jumpTo: () => jumpTo,
    nearestVehicle: () => nearestVehicle,
    now: () => now2,
    onTick: () => onTick,
    orderedStopsFor: () => orderedStopsFor,
    resetBeacons: () => resetBeacons,
    routesWithLiveVehicles: () => routesWithLiveVehicles,
    setScale: () => setScale,
    stopScheduleFor: () => stopScheduleFor,
    tick: () => tick,
    tripId: () => tripId,
    unitIdFor: () => unitIdFor,
    vehicleById: () => vehicleById,
    vehicles: () => vehicles,
    vehiclesOnRoute: () => vehiclesOnRoute
  });
  function geom(route2) {
    if (!geomCache.has(route2.id)) geomCache.set(route2.id, routeGeometry(route2));
    return geomCache.get(route2.id);
  }
  function profile(route2, dir = 0) {
    const key = `${route2.id}:${dir}`;
    if (profile._c?.[key]) return profile._c[key];
    const g = geom(route2);
    const n = g.pts.length;
    const dist = [];
    for (let i = 0; i < n; i++) {
      dist.push(dir === 0 ? g.cum[i] : g.total - g.cum[n - 1 - i]);
    }
    const arrive = [0], depart = [0];
    for (let i = 1; i < n; i++) {
      const seg = (dist[i] - dist[i - 1]) / CRUISE;
      arrive.push(depart[i - 1] + seg);
      depart.push(arrive[i] + DWELL * (0.8 + 0.4 * hash01(route2.id.length, i, dir)));
    }
    profile._c = profile._c || {};
    profile._c[key] = { arrive, depart, dist, duration: arrive[n - 1], g };
    return profile._c[key];
  }
  function headwayAt(route2, sec) {
    const peak = PEAK.some(([a, b]) => sec >= a && sec <= b);
    return (peak ? route2.headway.peak : route2.headway.off) * 60;
  }
  function schedule(route2) {
    if (schedule._c?.[route2.id]) return schedule._c[route2.id];
    const out = { 0: [], 1: [] };
    for (const dir of [0, 1]) {
      let t = SERVICE_DAY.start + Math.round(hash01(route2.id.charCodeAt(1), dir) * 300);
      while (t < SERVICE_DAY.end) {
        out[dir].push(t);
        t += headwayAt(route2, t) * (0.94 + 0.12 * hash01(route2.id.length, dir, t));
      }
    }
    schedule._c = schedule._c || {};
    schedule._c[route2.id] = out;
    return out;
  }
  function tripId(routeId, dir, sched) {
    return `${routeId}-${dir}-${pad(Math.floor(sched / 60), 4)}`;
  }
  function unitIdFor(routeId, dir, sched) {
    const slot = Math.floor(sched % 86400 / 3600);
    const n = Math.abs(Math.round(hash01(routeId.charCodeAt(0), dir, slot) * 900) + 100);
    return `ACU-${routeId.toUpperCase()}-${pad(n, 4)}`;
  }
  function orderedStopsFor(route2, dir = 0) {
    return dir === 0 ? route2.stops : [...route2.stops].reverse();
  }
  function positionAt(route2, dir, elapsed) {
    const p = profile(route2, dir);
    const stops = orderedStopsFor(route2, dir);
    const n = p.arrive.length;
    if (elapsed <= 0) return { distance: 0, stopIdx: 0, nextIdx: 1, dwelling: true, atStop: true, nextStop: stops[1] };
    if (elapsed >= p.arrive[n - 1]) return { distance: p.dist[n - 1], stopIdx: n - 1, nextIdx: null, dwelling: true, atStop: true, nextStop: null, finished: true };
    for (let i = 0; i < n - 1; i++) {
      const dep = p.depart[i], arr = p.arrive[i + 1];
      if (elapsed >= dep && elapsed < arr) {
        const f = (elapsed - dep) / Math.max(1e-6, arr - dep);
        return { distance: p.dist[i] + (p.dist[i + 1] - p.dist[i]) * f, stopIdx: i, nextIdx: i + 1, dwelling: false, atStop: false };
      }
      const nextDep = p.depart[i + 1];
      if (i + 1 <= n - 1 && elapsed >= arr && elapsed < nextDep) {
        return { distance: p.dist[i + 1], stopIdx: i + 1, nextIdx: i + 2 <= n - 1 ? i + 2 : null, dwelling: true, atStop: true };
      }
    }
    return { distance: p.dist[n - 1], stopIdx: n - 1, nextIdx: null, dwelling: true, atStop: true };
  }
  function latLonAt(route2, dir, distance) {
    const g = geom(route2);
    const d = dir === 0 ? distance : g.total - distance;
    let i = g.cum.findIndex((c) => c >= d);
    if (i <= 0) i = 1;
    const f = (d - g.cum[i - 1]) / Math.max(1e-6, g.cum[i] - g.cum[i - 1]);
    const a = g.pts[i - 1], b = g.pts[i];
    const off = dir === 0 ? 35e-5 : -35e-5;
    return { lat: a.lat + (b.lat - a.lat) * f + off * (b.lon - a.lon) * 8, lon: a.lon + (b.lon - a.lon) * f - off * (b.lat - a.lat) * 8 };
  }
  function now2() {
    return simTime;
  }
  function setScale(s) {
    advance();
    scale = s;
  }
  function getScale() {
    return scale;
  }
  function advance() {
    const real = performance.now();
    simTime += (real - lastReal) * scale;
    lastReal = real;
  }
  function tick() {
    advance();
    listeners.forEach((fn) => fn(simTime));
    return simTime;
  }
  function onTick(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function jumpTo(hoursFromNow, minutes = 0) {
    const d = /* @__PURE__ */ new Date();
    d.setHours(d.getHours() + hoursFromNow, d.getMinutes() + minutes, 0, 0);
    const delta = d.getTime() - simTime;
    simTime += delta;
    listeners.forEach((fn) => fn(simTime));
  }
  function secondOfDay(t = simTime) {
    const d = new Date(t);
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }
  function delayFor(route2, dir, sched, day) {
    const r = hash01(route2.id.length * 7, dir * 13, sched / 60, day.length + day.charCodeAt(0));
    const r2 = hash01(sched / 7, dir + 1, route2.id.charCodeAt(0), day.charCodeAt(2));
    if (r2 > 0.86) return Math.round(30 + r * MAX_DELAY);
    return Math.round(r * 75);
  }
  function invalidateFleetCache() {
    fleetCache.at = 0;
  }
  function baseOccupancyPct(route2, dir, dep, stopIdx, day, sod) {
    const n = Math.max(2, route2.stops.length - 1);
    const arch = Math.sin(Math.min(1, Math.max(0.08, (stopIdx + 0.5) / n)) * Math.PI);
    const peak = PEAK.some(([a, b]) => sod >= a && sod <= b) ? 16 : 0;
    const seed = hash01(route2.id.length, dep, dir, day.length);
    return Math.max(8, Math.min(96, Math.round(12 + seed * 32 + arch * 34 + peak)));
  }
  function vehicles() {
    const day = dayKey();
    if (fleetCache.day === day && Math.abs(fleetCache.at - simTime) < 250) return fleetCache.vehicles;
    const sod = secondOfDay();
    const out = [];
    for (const route2 of ROUTES) {
      const sched = schedule(route2);
      for (const dir of [0, 1]) {
        const p = profile(route2, dir);
        const stops = orderedStopsFor(route2, dir);
        for (const dep of sched[dir]) {
          const delay = delayFor(route2, dir, dep, day);
          const elapsed = sod - (dep + delay);
          if (elapsed < 0 || elapsed > p.duration + 60) continue;
          const pos = positionAt(route2, dir, elapsed);
          const ll = latLonAt(route2, dir, pos.distance);
          const v = {
            id: `${route2.id}-${dir}-${dep}`,
            unitId: unitIdFor(route2.id, dir, dep),
            routeId: route2.id,
            route: route2,
            dir,
            headsign: route2.headsigns[dir],
            tripId: tripId(route2.id, dir, dep),
            schedDepart: dep,
            delay,
            lat: ll.lat,
            lon: ll.lon,
            distance: pos.distance,
            totalDistance: p.g.total,
            progress: pos.distance / Math.max(1, p.g.total),
            stopIdx: pos.stopIdx,
            nextIdx: pos.nextIdx,
            orderedStops: stops,
            currentStop: stops[pos.stopIdx]?.[0] || stops[0][0],
            dwelling: pos.dwelling,
            finished: !!pos.finished,
            speed: pos.dwelling ? 0 : CRUISE * 3.6,
            occupancy: baseOccupancyPct(route2, dir, dep, pos.stopIdx, day, sod)
          };
          const nextStop = pos.nextIdx != null ? stops[pos.nextIdx] : null;
          v.nextStop = nextStop ? nextStop[0] : null;
          if (nextStop) {
            const dn = nextStop[1] - v.lat, de = nextStop[2] - v.lon;
            const m = Math.hypot(dn * 111320, de * 111320 * Math.cos(v.lat * Math.PI / 180));
            v.nextStopDistM = m;
            v.etaNextStopSec = m / CRUISE;
          } else {
            v.nextStopDistM = 0;
            v.etaNextStopSec = 0;
          }
          out.push(v);
        }
      }
    }
    fleetCache = { day, at: simTime, vehicles: out };
    return out;
  }
  function stopScheduleFor(vehicle, t = simTime) {
    if (!vehicle) return [];
    const p = profile(vehicle.route, vehicle.dir);
    const stops = orderedStopsFor(vehicle.route, vehicle.dir);
    const sod = secondOfDay(t);
    const midnight = t - sod * 1e3;
    return stops.map(([name, lat, lon], idx) => {
      const schedSec = vehicle.schedDepart + p.arrive[idx];
      const expSec = schedSec + vehicle.delay;
      let status = "upcoming";
      if (idx < vehicle.stopIdx) status = "passed";
      else if (idx === vehicle.stopIdx && vehicle.dwelling) status = "current";
      else if (idx === vehicle.stopIdx && !vehicle.dwelling) status = "passed";
      else if (idx === vehicle.nextIdx) status = "next";
      return {
        idx,
        name,
        lat,
        lon,
        distM: Math.round(p.dist[idx]),
        schedMs: midnight + schedSec * 1e3,
        expectedMs: midnight + expSec * 1e3,
        inSec: Math.round(expSec - sod),
        status
      };
    });
  }
  function vehicleById(id) {
    return vehicles().find((v) => v.id === id) || null;
  }
  function nearestVehicle(lat, lon, maxMetres = 200) {
    let best = null, bestD = Infinity;
    for (const v of vehicles()) {
      const d = haversine({ lat, lon }, { lat: v.lat, lon: v.lon });
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best && bestD <= maxMetres ? { vehicle: best, distance: bestD } : null;
  }
  function vehiclesOnRoute(routeId) {
    return vehicles().filter((v) => v.routeId === routeId);
  }
  function departuresForStop(stopName, withinMin = 60, t = simTime) {
    const result = [];
    const nowSec = secondOfDay(t);
    for (const route2 of ROUTES) {
      const sched = schedule(route2);
      route2.stops.forEach(([name], idx) => {
        if (name !== stopName) return;
        for (const dir of [0, 1]) {
          const p = profile(route2, dir);
          for (const dep of sched[dir]) {
            const stopIdx = dir === 0 ? idx : route2.stops.length - 1 - idx;
            const arr = p.arrive[stopIdx];
            const at = dep + delayFor(route2, dir, dep, dayKey(t)) + arr;
            const inSec = at - nowSec;
            if (inSec < -30 || inSec > withinMin * 60) continue;
            result.push({
              routeId: route2.id,
              route: route2,
              dir,
              headsign: route2.headsigns[dir],
              stopName,
              stopIdx,
              schedIn: dep - nowSec + arr,
              inSec,
              delay: delayFor(route2, dir, dep, dayKey(t)),
              vehicleId: `${route2.id}-${dir}-${dep}`,
              occupancy: baseOccupancyPct(route2, dir, dep, stopIdx, dayKey(t), nowSec)
            });
          }
        }
      });
    }
    return result.sort((a, b) => a.inSec - b.inSec).slice(0, 60);
  }
  function departuresForRoute(routeId, dir = 0, withinMin = 45, t = simTime) {
    const route2 = routeById(routeId);
    if (!route2) return [];
    const p = profile(route2), sched = schedule(route2);
    const nowSec = secondOfDay(t);
    const list = [];
    for (const dep of sched[dir]) {
      const inSec = dep + delayFor(route2, dir, dep, dayKey(t)) - nowSec;
      if (inSec < -20 || inSec > withinMin * 60) continue;
      list.push({ routeId, dir, headsign: route2.headsigns[dir], inSec, schedIn: dep - nowSec, delay: delayFor(route2, dir, dep, dayKey(t)) });
    }
    return list.slice(0, 12);
  }
  async function beaconFor(vehicle, { spoof = false, replay = false } = {}) {
    const key = vehicle.id;
    let st = beaconState.get(key);
    const counter = Math.floor((simTime - secondOfDay(0) * 1e3) / 1e3) + Math.floor(hash01(key.length) * 1e3);
    if (!st || st.counter !== counter) {
      const fields = {
        unitId: vehicle.unitId,
        routeId: vehicle.routeId,
        tripId: vehicle.tripId,
        dir: vehicle.dir,
        stopSeq: vehicle.stopIdx,
        counter,
        timestamp: vehicle.spoofTs ?? simTime,
        nonce: randomNonce()
      };
      st = { counter, fields, signed: await signBeacon(fields) };
      beaconState.set(key, st);
    }
    if (replay && st.signed) return st.signed;
    if (spoof) {
      const fake = { ...st.fields, unitId: st.fields.unitId, signature: "deadbeef".repeat(8), algorithm: "HMAC-SHA256" };
      const enemy = await signBeacon({ ...st.fields, unitId: `${st.fields.unitId}-CLONE` });
      return { ...fake, signature: enemy.signature, payload: st.signed.payload, spoofed: true };
    }
    return st.signed;
  }
  function resetBeacons() {
    beaconState.clear();
  }
  function fleetStats() {
    const v = vehicles();
    return { total: v.length, delayed: v.filter((x) => x.delay > 90).length, dwelling: v.filter((x) => x.dwelling).length };
  }
  function routesWithLiveVehicles() {
    const v = vehicles();
    return ROUTES.map((r) => ({ route: r, live: v.filter((x) => x.routeId === r.id).length }));
  }
  var SERVICE_DAY, PEAK, CRUISE, DWELL, MAX_DELAY, geomCache, scale, lastReal, simTime, listeners, dayKey, fleetCache, beaconState;
  var init_sim = __esm({
    "js/sim.js"() {
      init_data();
      init_util();
      init_crypto();
      SERVICE_DAY = { start: 5 * 3600 + 30 * 60, end: 23 * 3600 + 15 * 60 };
      PEAK = [[7 * 3600, 9.5 * 3600], [16.5 * 3600, 19 * 3600]];
      CRUISE = 6.4;
      DWELL = 19;
      MAX_DELAY = 260;
      geomCache = /* @__PURE__ */ new Map();
      scale = 1;
      lastReal = performance.now();
      simTime = (() => {
        const d = /* @__PURE__ */ new Date();
        const sod = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        if (sod < SERVICE_DAY.start + 600 || sod > SERVICE_DAY.end - 900) {
          d.setHours(9, 30, 0, 0);
        }
        return d.getTime();
      })();
      listeners = /* @__PURE__ */ new Set();
      dayKey = (t = simTime) => new Date(t).toDateString();
      fleetCache = { day: null, at: 0, vehicles: [] };
      beaconState = /* @__PURE__ */ new Map();
    }
  });

  // js/ui.js
  function toast({ title, body = "", kind = "info", timeout = 4600 }) {
    const host = $("#toasts");
    const node = el(
      "div",
      { class: `toast ${kind === "ok" ? "good" : kind}` },
      el("b", { text: title }),
      body ? el("p", { text: body }) : null
    );
    node.addEventListener("click", () => node.remove());
    host.append(node);
    setTimeout(() => {
      node.style.pointerEvents = "none";
      node.style.opacity = "0";
      node.style.transition = "opacity .3s";
      setTimeout(() => node.remove(), 320);
    }, timeout);
    return node;
  }
  function openSheet(render, { onClose } = {}) {
    const sheet = $("#sheet"), backdrop = $("#sheet-backdrop");
    sheet.innerHTML = "";
    sheet.append(el("div", { class: "sheet-grab" }));
    const body = el("div");
    sheet.append(body);
    body.append(render({ close }));
    sheet.hidden = false;
    backdrop.hidden = false;
    sheetCloser = () => {
      sheet.hidden = true;
      backdrop.hidden = true;
      sheet.innerHTML = "";
      onClose?.();
    };
    return { close };
  }
  function closeSheet() {
    sheetCloser?.();
    sheetCloser = null;
  }
  function qrSvg(text, { size = 150, cell = 4 } = {}) {
    try {
      const qr = window.qrcode(0, "M");
      qr.addData(text);
      qr.make();
      const count = qr.getModuleCount();
      const px = Math.max(2, Math.round(size / (count + 4)));
      const tag = qr.createSvgTag({ cellSize: px, margin: 2, scalable: true });
      return tag.replace("<svg", `<svg style="width:${size}px;height:${size}px"`);
    } catch (e) {
      console.warn("qr failed", e);
      return `<div class="tiny faint">QR unavailable</div>`;
    }
  }
  function modeChip(route2, large = false) {
    return el("span", { class: `mode-chip mode-${route2.mode} ${large ? "lg" : ""}`, text: route2.number });
  }
  function pill(text, cls = "grey") {
    return el("span", { class: `pill ${cls}`, text });
  }
  function kv(label, value) {
    return el("div", { class: "kv" }, el("span", { text: label }), el("span", { class: "mono", text: value }));
  }
  function sectionTitle(title, action) {
    return el("div", { class: "sec-title" }, el("h2", { text: title }), action || null);
  }
  function emptyState(text, sub = "") {
    return el("div", { class: "empty" }, el("p", { text }), sub ? el("p", { class: "small", text: sub }) : null);
  }
  function departureRow(dep, { onClick } = {}) {
    const mins = dep.inSec / 60;
    const late = dep.delay > 60;
    const time = mins <= 0.5 ? "now" : `${Math.max(1, Math.round(mins))} min`;
    const node = el(
      "button",
      { class: "item", onclick: () => onClick?.(dep) },
      modeChip(dep.route),
      el(
        "div",
        { class: "grow" },
        el("div", { class: "t", text: `→ ${dep.headsign}` }),
        el("div", { class: "s", text: [dep.stopName, late ? `+${Math.round(dep.delay / 60)} min delay` : null, dep.occupancy > 70 ? "busy" : null].filter(Boolean).join(" · ") })
      ),
      el("div", { class: "r" }, el("div", { class: `big-time ${late ? "late" : ""}`, text: time }), el("div", { class: "tiny faint mono", text: fmtClock(new Date(now2() + dep.inSec * 1e3)) }))
    );
    return node;
  }
  function ticketCard(ticket, { showQr = true, now: now3 = now2() } = {}) {
    const fare = fareById(ticket.fareId);
    const active = ticket.status === "active" && ticket.validTo > now3;
    const wrap = el("div", { class: `live-ticket ${active ? "" : "expired"}` });
    const last = ticket.registrations[ticket.registrations.length - 1];
    const route2 = last ? vehicles().find((v) => v.routeId === last.routeId)?.route : null;
    wrap.append(
      el(
        "div",
        { class: "lt-top" },
        el(
          "div",
          {},
          el("h3", { text: fare ? fare.name : ticket.fareId }),
          el("div", { class: "lt-meta", text: active ? last ? `Registered ${fmtClock(new Date(last.at))} · ${last.stopName}${route2 ? ` · route ${route2.number}` : ""}` : "Not registered yet — it starts on your first boarding" : ticket.validTo ? `Expired ${fmtDateTime(new Date(ticket.validTo))}` : "Unused" })
        ),
        el(
          "div",
          { class: "center" },
          el("div", { class: "countdown", dataset: { countdownTo: ticket.validTo || 0 } }, active ? fmtCountdown(ticket.validTo - now3) : "—"),
          el("div", { class: "tiny", text: active ? "left on this ticket" : "" })
        )
      )
    );
    if (active && showQr && ticket.token) {
      wrap.append(el(
        "div",
        { class: "row", style: "gap:14px;margin-top:12px;align-items:flex-start" },
        el("div", { class: "qr-wrap", html: qrSvg(ticket.token) }),
        el(
          "div",
          { class: "grow" },
          el("div", { class: "tiny", text: "Valid until" }),
          el("div", { class: "mono", text: fmtDateTime(new Date(ticket.validTo)) }),
          el("div", { class: "tiny", style: "margin-top:8px", text: `Ticket ${ticket.id}` }),
          el("div", { class: "tiny", text: `Receipt ${ticket.receiptId || "—"}` }),
          el("div", { class: "tiny faint", style: "margin-top:8px", text: `Signed token: ${(ticket.token || "").slice(0, 28)}…` })
        )
      ));
    }
    if (last) {
      wrap.append(el(
        "div",
        { class: "sensor-strip" },
        el("span", { html: svg(ICON.signal, 15) }),
        el("span", { text: last.method === "hands-free" ? `Registered by ${(last.evidence || []).map((e) => e.source).join(" + ") || "the onboard sensor"} · unit ${last.unitId || "—"}` : `Registered manually${last.unitId ? ` · unit ${last.unitId}` : ""}` })
      ));
    }
    return wrap;
  }
  function tickCountdowns(root = document, now3 = now2()) {
    root.querySelectorAll("[data-countdown-to]").forEach((node) => {
      const to = +node.dataset.countdownTo;
      if (!to) return;
      const left = to - now3;
      node.textContent = fmtCountdown(left);
      if (left <= 0) node.closest(".live-ticket")?.classList.add("expired");
    });
  }
  function evidenceTimeline(list) {
    return el("div", { class: "timeline" }, list.map((e) => el(
      "div",
      { class: "tl" },
      el("div", { class: "t", style: "font-size:13px", text: `${e.source} — ${e.detail}` }),
      el("div", { class: "s tiny faint", text: Object.entries(e).filter(([k]) => !["source", "detail"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ") })
    )));
  }
  function drawTripTrace(canvas, trip) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const route2 = vehicles().find((v) => v.routeId === trip.routeId)?.route || null;
    const routeObj = route2 || null;
    if (!routeObj) return;
    const lats = routeObj.stops.map((s2) => s2[1]), lons = routeObj.stops.map((s2) => s2[2]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const pad2 = 14;
    const sx = (w - pad2 * 2) / Math.max(1e-6, maxLon - minLon);
    const sy = (h - pad2 * 2) / Math.max(1e-6, maxLat - minLat);
    const s = Math.min(sx, sy);
    const X = (lon) => pad2 + (lon - minLon) * s + (w - pad2 * 2 - (maxLon - minLon) * s) / 2;
    const Y = (lat) => h - pad2 - (lat - minLat) * s - (h - pad2 * 2 - (maxLat - minLat) * s) / 2;
    ctx.strokeStyle = "#22304d";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    routeObj.stops.forEach(([, lat, lon], i) => i ? ctx.lineTo(X(lon), Y(lat)) : ctx.moveTo(X(lon), Y(lat)));
    ctx.stroke();
    const bi = trip.routeStops?.boardIdx ?? 0;
    const ai = trip.alightIdx ?? routeObj.stops.length - 1;
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = bi; i <= ai; i++) {
      const [, lat, lon] = routeObj.stops[i];
      i === bi ? ctx.moveTo(X(lon), Y(lat)) : ctx.lineTo(X(lon), Y(lat));
    }
    ctx.stroke();
    const drawDot = (idx, color) => {
      const [, lat, lon] = routeObj.stops[idx] || [];
      if (lat === void 0) return;
      ctx.beginPath();
      ctx.arc(X(lon), Y(lat), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#060b14";
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    drawDot(bi, "#22d3ee");
    drawDot(ai, "#fbbf24");
  }
  var ICON, svg, sheetCloser;
  var init_ui = __esm({
    "js/ui.js"() {
      init_util();
      init_store();
      init_sim();
      init_data();
      ICON = {
        boarding: '<path d="M5 12h9M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
        ticket: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5v-1Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v8" stroke="currentColor" stroke-width="1.7" stroke-dasharray="2 2"/>',
        signal: '<path d="M12 13.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor"/><path d="M8.6 16.4a4.8 4.8 0 0 1 0-6.8M15.4 9.6a4.8 4.8 0 0 1 0 6.8M6 19a8.5 8.5 0 0 1 0-12M18 7a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
        check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
        cross: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
        clock: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3.2 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
      };
      svg = (paths, size = 18) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${paths}</svg>`;
      sheetCloser = null;
      document.addEventListener("click", (e) => {
        if (e.target.id === "sheet-backdrop") closeSheet();
      });
    }
  });

  // js/detection.js
  function rssiFor(distance) {
    return Math.round(Math.max(-99, -59 - 20 * Math.log10(Math.max(1, distance))));
  }
  var DetectionEngine, detection;
  var init_detection = __esm({
    "js/detection.js"() {
      init_util();
      init_sim();
      init_store();
      init_crypto();
      DetectionEngine = class {
        constructor() {
          this.status = "idle";
          this.range = 120;
          this.position = { lat: 56.9455, lon: 24.1085, source: "simulated" };
          this.candidate = null;
          this.active = null;
          this.seen = { nonces: /* @__PURE__ */ new Set(), counters: /* @__PURE__ */ new Map() };
          this.consumed = { nonces: /* @__PURE__ */ new Set() };
          this.pendingRetire = [];
          this.lastPayload = null;
          this.busy = false;
          this.lastUnit = { unitId: null, at: 0 };
          this.lastRejection = null;
          this.pendingConfirm = null;
          this.following = null;
          this.timer = null;
          this.running = false;
          onTick(() => this.step());
        }
        /* ---------------- lifecycle ---------------- */
        start() {
          if (this.running) return;
          this.running = true;
          this.timer = setInterval(() => this.step(), 400);
          logEvent("info", `Hands-free service started — BLE ${state.prefs.handsFree.sensors.ble ? "on" : "off"}, GPS ${state.prefs.handsFree.sensors.gps ? "on" : "off"}, crypto ${cryptoAvailable ? "WebCrypto HMAC-SHA256" : "demo fallback"}`);
        }
        stop() {
          this.running = false;
          clearInterval(this.timer);
        }
        setRange(m) {
          this.range = m;
          events.emit("detection", this.snapshot());
        }
        setPosition(lat, lon, source = "simulated") {
          this.position = { lat, lon, source };
          events.emit("detection", this.snapshot());
        }
        /* ---------------- demo helpers (a real build gets these from the OS) ---------------- */
        followVehicle(vehicleId) {
          this.following = vehicleId;
          const v = vehicleById(vehicleId);
          if (v) this.setPosition(v.lat, v.lon, "onboard");
        }
        stopFollow() {
          this.following = null;
        }
        /** Teleport the passenger next to a vehicle — "walking up to the door". */
        walkTo(vehicleId) {
          const v = vehicleById(vehicleId);
          if (!v) return;
          const jitter = () => (Math.random() - 0.5) * 4e-4;
          this.setPosition(v.lat + jitter(), v.lon + jitter(), "on-foot");
        }
        /* ---------------- core loop ---------------- */
        async step() {
          if (this.busy) return;
          this.busy = true;
          try {
            await this._step();
          } finally {
            this.busy = false;
          }
        }
        async _step() {
          const t = now2();
          const hf = state.prefs.handsFree;
          if (this.following) {
            const v = vehicleById(this.following);
            if (v) this.position = { lat: v.lat, lon: v.lon, source: "onboard" };
            if (!v && this.status === "onboard") this.alight("vehicle left the network");
          }
          let best = null, bestD = Infinity;
          for (const v of vehicles()) {
            const d = haversine(this.position, { lat: v.lat, lon: v.lon });
            if (d < bestD) {
              bestD = d;
              best = v;
            }
          }
          if (this.status === "onboard") {
            const v = this.active?.vehicle;
            const alive = v ? !!vehicleById(v.id) : false;
            if (alive) {
              const fresh = vehicleById(v.id);
              this.active.vehicle = fresh;
              this.active.lastSeen = t;
              events.emit("detection", this.snapshot(best ? { distance: bestD, rssi: rssiFor(bestD) } : null));
            }
            if (this.active && !alive) {
              this.alight("reached the terminus");
            }
            return;
          }
          if (!hf.enabled || !this.running) {
            this.clearCandidate();
            events.emit("detection", this.snapshot(best ? { distance: bestD, rssi: rssiFor(bestD) } : null));
            return;
          }
          if (!best || bestD > this.range) {
            this.lastPayload = null;
            this.clearCandidate();
            events.emit("detection", this.snapshot(best ? { distance: bestD, rssi: rssiFor(bestD) } : null));
            return;
          }
          const beacon = await beaconFor(best);
          let verdict = { ok: true, reason: "verified" };
          if (beacon.payload !== this.lastPayload) {
            verdict = await verifyBeacon(beacon, this.seen, t);
            if (!verdict.ok) {
              if (["bad-signature", "replayed-nonce", "replayed-counter", "payload-mismatch"].includes(verdict.reason)) {
                this.lastRejection = { at: t, unitId: best.unitId, reason: verdict.reason, vehicleId: best.id };
                state.stats.rejectedBeacons++;
                logEvent("err", `Beacon from ${best.unitId} rejected: ${verdict.reason} — no ticket registered`, { routeId: best.routeId });
              }
              this.clearCandidate();
              events.emit("detection", this.snapshot({ distance: bestD, rssi: rssiFor(bestD) }));
              return;
            }
            this.lastPayload = beacon.payload;
            this.seen.nonces.add(beacon.nonce);
            this.seen.counters.set(beacon.unitId, beacon.counter);
            this.pendingRetire.push({ nonce: beacon.nonce, unitId: beacon.unitId, counter: beacon.counter, at: t });
            this.pendingRetire = this.pendingRetire.filter((p) => t - p.at < 200);
            if (this.pendingRetire.length > 60) {
              const oldest = this.pendingRetire.shift();
              this.consumed.nonces.add(oldest.nonce);
            }
          }
          const rssi = rssiFor(bestD);
          const withinSecondSource = bestD <= Math.max(60, this.range * 0.5);
          const secondOk = !hf.requireSecondSource || hf.sensors.gps && this.position.source === "onboard" || withinSecondSource;
          if (this.consumed.nonces.has(beacon.nonce)) {
            this.lastRejection = { at: t, unitId: best.unitId, reason: "replayed-nonce", vehicleId: best.id };
            state.stats.rejectedBeacons++;
            logEvent("err", `Replayed beacon from ${best.unitId} rejected — a captured broadcast cannot be replayed to register a second ticket`, { routeId: best.routeId });
            this.clearCandidate();
            events.emit("detection", this.snapshot({ distance: bestD, rssi: rssiFor(bestD) }));
            return;
          }
          if (!this.candidate || this.candidate.vehicle.id !== best.id) {
            this.candidate = { vehicle: best, since: t, rssi, distance: bestD };
            this.status = "candidate";
            logEvent("info", `Boarding candidate: ${best.route.number} → ${best.headsign} (${best.unitId}), rssi ${rssi} dBm, ${Math.round(bestD)} m`);
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk }));
            return;
          }
          this.candidate.distance = bestD;
          this.candidate.rssi = rssi;
          const dwell = t - this.candidate.since;
          if (rssi < hf.rssiThreshold) {
            this.status = "candidate";
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk, note: "signal too weak — move closer to the door" }));
            return;
          }
          if (!secondOk) {
            this.status = "candidate";
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk, note: "waiting for GPS to confirm you are at the vehicle" }));
            return;
          }
          if (dwell < hf.dwellMs) {
            this.status = "verifying";
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk, dwell }));
            return;
          }
          if (this.lastUnit.unitId === best.unitId && t - this.lastUnit.at < hf.cooldownMs) {
            this.status = "candidate";
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk, note: "already registered on this vehicle moments ago" }));
            return;
          }
          if (hf.mode === "confirm") {
            this.status = "awaiting-confirm";
            this.pendingConfirm = { vehicle: best, distance: bestD, rssi, beacon };
            events.emit("detection", this.snapshot({ distance: bestD, rssi, secondOk, needsConfirm: true }));
            return;
          }
          await this.board(best, { beacon, rssi, distance: bestD, dwell });
        }
        async board(vehicle, { beacon, rssi, distance, dwell }) {
          const evidence = [
            { source: "BLE", detail: `signed beacon ${beacon.algorithm}`, unitId: vehicle.unitId, rssi, tripId: vehicle.tripId, counter: beacon.counter },
            { source: "GPS", detail: `${Math.round(distance)} m from the transponder, inside the doorway zone`, lat: +this.position.lat.toFixed(5), lon: +this.position.lon.toFixed(5) }
          ].filter((e) => e.source === "BLE" ? state.prefs.handsFree.sensors.ble : state.prefs.handsFree.sensors.gps);
          evidence.push({ source: "dwell", detail: `held ${(dwell / 1e3).toFixed(1)} s ≥ ${(state.prefs.handsFree.dwellMs / 1e3).toFixed(1)} s` });
          const stopName = vehicle.route.stops[vehicle.stopIdx]?.[0] || "—";
          const res = await registerBoarding({
            routeId: vehicle.routeId,
            direction: vehicle.dir,
            stopName,
            vehicleId: vehicle.id,
            unitId: vehicle.unitId,
            method: "hands-free",
            evidence,
            t: now2()
          });
          this.lastUnit = { unitId: vehicle.unitId, at: now2() };
          if (res.ok) {
            this.active = { vehicle, trip: res.trip, since: now2(), lastSeen: now2() };
            this.status = "onboard";
            this.clearCandidate();
            const fareName = res.ticket ? res.ticket.fareId : "";
            const msg = res.charged ? `Ticket registered automatically on ${vehicle.route.number} · ${fareName} · ${"€" + res.charged.toFixed(2)}` : `Ticket registered automatically on ${vehicle.route.number} — no charge (${res.reason})`;
            notify("Boarded hands-free", `${msg}. Boarded at ${stopName}, ${fmtClockSec(new Date(now2()))}.`, "ok");
          } else {
            this.status = "idle";
            this.clearCandidate();
            notify("Could not register a ticket", res.reason, "bad");
          }
          events.emit("detection", this.snapshot({ distance, rssi }));
        }
        async confirmBoarding() {
          if (!this.pendingConfirm) return;
          const { vehicle, distance, rssi, beacon } = this.pendingConfirm;
          this.pendingConfirm = null;
          await this.board(vehicle, { beacon, rssi, distance, dwell: now2() - (this.candidate?.since || now2()) });
        }
        declineBoarding(reason = "declined by passenger") {
          if (this.pendingConfirm) {
            logEvent("warn", `Boarding declined: ${reason}`);
            this.pendingConfirm = null;
          }
          this.status = "idle";
          this.clearCandidate();
          events.emit("detection", this.snapshot());
        }
        alight(reason = "left the vehicle") {
          const trip = openTrip();
          if (trip) endTrip(trip.id, { stopName: this.active ? this.currentStopName() : null, t: now2() });
          logEvent("info", `Trip ended automatically — ${reason}`);
          events.emit("alight-log", { reason });
          this.active = null;
          this.status = "idle";
          this.following = null;
          events.emit("detection", this.snapshot());
        }
        currentStopName() {
          const v = vehicleById(this.active?.vehicle?.id);
          return v ? v.route.stops[v.stopIdx]?.[0] : null;
        }
        clearCandidate() {
          this.candidate = null;
          if (this.status !== "onboard" && this.status !== "awaiting-confirm") this.status = "idle";
        }
        snapshot(extra = {}) {
          return {
            status: this.status,
            position: this.position,
            vehicle: this.candidate?.vehicle || this.active?.vehicle || null,
            candidateSince: this.candidate?.since || null,
            active: this.active ? { vehicle: this.active.vehicle, trip: this.active.trip, since: this.active.since } : null,
            lastRejection: this.lastRejection,
            ...extra
          };
        }
      };
      detection = new DetectionEngine();
    }
  });

  // js/payments.js
  function detectBrand(number) {
    const n = number.replace(/\D/g, "");
    if (/^4/.test(n)) return "Visa";
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
    if (/^3[47]/.test(n)) return "Amex";
    if (/^6(?:011|5)/.test(n)) return "Discover";
    return "Card";
  }
  function luhnValid(number) {
    const n = number.replace(/\D/g, "");
    if (n.length < 12) return false;
    let sum = 0, dbl = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = +n[i];
      if (dbl) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }
  function validateCard({ number, exp, cvc, name }) {
    const errors = {};
    const digits = (number || "").replace(/\D/g, "");
    if (!digits) errors.number = "Enter the card number";
    else if (!luhnValid(digits)) errors.number = "This card number does not pass the Luhn check";
    if (!/^\d{2}\/\d{2}$/.test(exp || "")) errors.exp = "Use MM/YY";
    else {
      const [mm, yy] = exp.split("/").map(Number);
      if (mm < 1 || mm > 12) errors.exp = "Month must be 01–12";
      else {
        const end = new Date(2e3 + yy, mm, 0, 23, 59, 59);
        if (end.getTime() < Date.now()) errors.exp = "Card has expired";
      }
    }
    if (!/^\d{3,4}$/.test(cvc || "")) errors.cvc = "CVC must be 3–4 digits";
    if (name !== void 0 && (!name || name.trim().length < 2)) errors.name = "Enter the name on the card";
    return { ok: Object.keys(errors).length === 0, errors, brand: detectBrand(digits), last4: digits.slice(-4) };
  }
  async function charge({ amount, method, methodId = method?.id, idempotencyKey, description = "EasyRide ticket purchase", forceDecline = null, randomFailure = false }) {
    if (processed.has(idempotencyKey)) return { ...processed.get(idempotencyKey), idempotent: true };
    await wait(420 + Math.random() * 380);
    let declined = forceDecline;
    if (!declined && amount > 200) declined = "amount_limit";
    if (!declined && method?.last4 && /0000$/.test(method.last4)) declined = "card_declined";
    if (!declined && randomFailure && Math.random() < 0.02) declined = "issuer_unavailable";
    const result = declined ? { ok: false, error: declined, message: declineMessage(declined), amount } : { ok: true, authCode: `A${++sequence}${Math.random().toString(36).slice(2, 6).toUpperCase()}`, amount, description, at: Date.now(), ref: uid("psp") };
    if (result.ok) processed.set(idempotencyKey, result);
    return result;
  }
  async function refund({ amount, reference, idempotencyKey = uid("rf") }) {
    if (processed.has(idempotencyKey)) return { ...processed.get(idempotencyKey), idempotent: true };
    await wait(300);
    const res = { ok: true, amount, reference, ref: uid("psp"), at: Date.now() };
    processed.set(idempotencyKey, res);
    return res;
  }
  function mask(method) {
    return `${method.brand} •••• ${method.last4}`;
  }
  function declineMessage(code) {
    switch (code) {
      case "amount_limit":
        return "Above the demo limit of €200 per transaction.";
      case "card_declined":
        return "The issuer declined this card (demo rule: any card ending 0000 is declined).";
      case "issuer_unavailable":
        return "The issuer could not be reached. Please try again.";
      default:
        return "Payment was declined.";
    }
  }
  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  var DEMO_NOTICE, processed, sequence, TEST_CARDS;
  var init_payments = __esm({
    "js/payments.js"() {
      init_util();
      DEMO_NOTICE = "DemoPSP — no real payment network is contacted. Card numbers are checked with the Luhn algorithm only and never stored.";
      processed = /* @__PURE__ */ new Map();
      sequence = 1e3;
      TEST_CARDS = [
        { label: "Visa (approved)", number: "4242 4242 4242 4242", exp: "12/28", cvc: "123" },
        { label: "Mastercard (approved)", number: "5555 5555 5555 4444", exp: "09/27", cvc: "321" },
        { label: "Declined card", number: "4000 0000 0000 0000", exp: "01/27", cvc: "999" }
      ];
    }
  });

  // js/map.js
  function createMap(canvas, { interactive = true, showPassenger = true, driverVehicleId = null, focusRouteId = null } = {}) {
    const ctx = canvas.getContext("2d");
    const view = { lat: 56.949, lon: 24.11, zoom: 13 };
    let followId = null;
    let selected = null;
    let hoverPt = null;
    let drvVehId = driverVehicleId;
    let focusRoute = focusRouteId;
    let w = 1, h = 1, dpr = 1;
    const handlers = { select: [], tap: [] };
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const worldPx = (z = view.zoom) => TILE * 2 ** z;
    function project(lat, lon) {
      const s = worldPx();
      const x = (lon + 180) / 360 * s;
      const y = (0.5 - merc(lat) / (2 * Math.PI)) * s;
      const cx = (view.lon + 180) / 360 * s;
      const cy = (0.5 - merc(view.lat) / (2 * Math.PI)) * s;
      return { x: w / 2 + (x - cx), y: h / 2 + (y - cy) };
    }
    function unproject(px, py) {
      const s = worldPx();
      const cx = (view.lon + 180) / 360 * s;
      const cy = (0.5 - merc(view.lat) / (2 * Math.PI)) * s;
      const x = cx + (px - w / 2), y = cy + (py - h / 2);
      return { lon: x / s * 360 - 180, lat: 180 / Math.PI * (2 * Math.atan(Math.exp((0.5 - y / s) * 2 * Math.PI)) - Math.PI / 2) };
    }
    const metresPerPixel = () => Math.cos(view.lat * Math.PI / 180) * 2 * Math.PI * R2 / worldPx();
    function drawRiver() {
      ctx.save();
      ctx.strokeStyle = "#0d2338";
      ctx.lineWidth = Math.max(6, 700 / metresPerPixel());
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      DAUGAVA.forEach(([lat, lon], i) => {
        const p = project(lat, lon);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }
    function drawGrid() {
      const step = view.zoom >= 14 ? 5e-3 : view.zoom >= 12 ? 0.02 : 0.05;
      ctx.save();
      ctx.strokeStyle = "#ffffff08";
      ctx.lineWidth = 1;
      const tl = unproject(0, 0), br = unproject(w, h);
      for (let lat = Math.floor(br.lat / step) * step; lat < tl.lat + step; lat += step) {
        const a = project(lat, tl.lon), b = project(lat, br.lon);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let lon = Math.floor(tl.lon / step) * step; lon < br.lon + step; lon += step) {
        const a = project(tl.lat, lon), b = project(br.lat, lon);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    function drawRoutes() {
      const drvVeh = drvVehId ? vehicleById(drvVehId) : null;
      const highlightRouteId = drvVeh?.routeId || focusRoute;
      ROUTES.forEach((route2) => {
        if (drvVeh && route2.id === drvVeh.routeId) return;
        const pts = route2.stops.map(([, lat, lon]) => project(lat, lon));
        ctx.save();
        ctx.strokeStyle = route2.color;
        if (highlightRouteId) ctx.globalAlpha = route2.id === highlightRouteId ? 0.92 : 0.14;
        else ctx.globalAlpha = selected && selected.kind === "route" && selected.id !== route2.id ? 0.18 : 0.55;
        ctx.lineWidth = highlightRouteId && route2.id === highlightRouteId ? 4.8 : 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
      });
      if (drvVeh) {
        const stops = drvVeh.orderedStops || drvVeh.route.stops;
        const pts = stops.map(([, lat, lon]) => project(lat, lon));
        const busPt = project(drvVeh.lat, drvVeh.lon);
        const splitIdx = Math.min(drvVeh.stopIdx, pts.length - 1);
        ctx.save();
        ctx.strokeStyle = drvVeh.route.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i <= splitIdx; i++) {
          i ? ctx.lineTo(pts[i].x, pts[i].y) : ctx.moveTo(pts[i].x, pts[i].y);
        }
        ctx.lineTo(busPt.x, busPt.y);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = drvVeh.route.color;
        ctx.shadowColor = drvVeh.route.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.96;
        ctx.lineWidth = 5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(busPt.x, busPt.y);
        for (let i = splitIdx + 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    function drawStops() {
      const drvVeh = drvVehId ? vehicleById(drvVehId) : null;
      const highlightRouteId = drvVeh?.routeId || focusRoute;
      const showLabels = view.zoom >= 13;
      ROUTES.forEach((route2) => {
        if (highlightRouteId && route2.id !== highlightRouteId) return;
        const stops = drvVeh && route2.id === drvVeh.routeId ? drvVeh.orderedStops || route2.stops : route2.stops;
        stops.forEach(([name, lat, lon], idx) => {
          const p = project(lat, lon);
          if (p.x < -40 || p.y < -40 || p.x > w + 40 || p.y > h + 40) return;
          const isNext = drvVeh && route2.id === drvVeh.routeId && idx === drvVeh.nextIdx;
          const isPassed = drvVeh && route2.id === drvVeh.routeId && idx < drvVeh.stopIdx;
          ctx.save();
          if (isNext) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8 + 2 * Math.sin(performance.now() / 320), 0, Math.PI * 2);
            ctx.strokeStyle = "#4ade8099";
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, isNext ? 4.4 : 3, 0, Math.PI * 2);
          ctx.fillStyle = isNext ? "#4ade80" : "#0b1220";
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = isPassed ? "#6b7ba088" : route2.color;
          ctx.stroke();
          if (isNext || highlightRouteId || showLabels && (idx % 2 === 0 || stops.length < 10)) {
            ctx.font = isNext ? "600 11px system-ui, sans-serif" : "10px system-ui, sans-serif";
            ctx.fillStyle = isNext ? "#86efac" : isPassed ? "#6b7ba0" : "#cbd5e1";
            ctx.fillText(isNext ? `▶ ${name}` : name, p.x + 7, p.y + 3.5);
          }
          ctx.restore();
        });
      });
    }
    function drawVehicles() {
      const vlist = vehicles();
      let driverTarget = null;
      for (const v of vlist) {
        if (drvVehId && v.id === drvVehId) {
          driverTarget = v;
          continue;
        }
        const p = project(v.lat, v.lon);
        if (p.x < -30 || p.y < -30 || p.x > w + 30 || p.y > h + 30) continue;
        const isSel = selected?.kind === "vehicle" && selected.id === v.id;
        const size = isSel ? 11 : 8;
        ctx.save();
        ctx.translate(p.x, p.y);
        if (drvVehId && v.routeId !== driverTarget?.routeId) ctx.globalAlpha = 0.35;
        ctx.fillStyle = v.route.color;
        ctx.strokeStyle = isSel ? "#e8eefc" : "#0a1220";
        ctx.lineWidth = isSel ? 2.4 : 1.6;
        ctx.beginPath();
        if (v.route.mode === "tram") {
          ctx.roundRect(-size, -size * 0.72, size * 2, size * 1.44, 3);
        } else {
          ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
        if (isSel) {
          ctx.fillStyle = "#06131c";
          ctx.font = "700 9px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(v.route.number, 0, 0.5);
        }
        if (v.delay > 150) {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(size, -size * 0.8, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (driverTarget) {
        const p = project(driverTarget.lat, driverTarget.lon);
        ctx.save();
        ctx.translate(p.x, p.y);
        const pulse = 18 + 3 * Math.sin(performance.now() / 360);
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.fillStyle = "#4ade8022";
        ctx.fill();
        ctx.strokeStyle = "#4ade8088";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = driverTarget.route.color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-13, -10, 26, 20, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#06131c";
        ctx.font = "800 10.5px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(driverTarget.route.number, 0, 0.5);
        const tag = `OUR BUS · ${driverTarget.route.number}`;
        ctx.font = "700 9.5px system-ui, sans-serif";
        const tw = ctx.measureText(tag).width + 12;
        ctx.fillStyle = "#0b1220ee";
        ctx.strokeStyle = "#4ade80aa";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -30, tw, 16, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#86efac";
        ctx.fillText(tag, 0, -21.5);
        ctx.restore();
      }
    }
    function drawPassenger() {
      if (!showPassenger) return;
      const pos = window.__pietura_detection?.position;
      const range = window.__pietura_detection?.range;
      if (!pos) return;
      const p = project(pos.lat, pos.lon);
      if (range) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, range / metresPerPixel(), 0, Math.PI * 2);
        ctx.fillStyle = "#22d3ee12";
        ctx.fill();
        ctx.strokeStyle = "#22d3ee55";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.fill();
      ctx.strokeStyle = "#06202b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11 + 2 * Math.sin(performance.now() / 400), 0, Math.PI * 2);
      ctx.strokeStyle = "#22d3ee66";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
    function drawAttribution() {
      ctx.save();
      ctx.font = "9.5px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff40";
      ctx.fillText(`${metresPerPixel() < 1 ? metresPerPixel().toFixed(1) + " m/px" : Math.round(metresPerPixel()) + " m/px"} · sample network data`, 8, h - 8);
      ctx.restore();
    }
    function render(t = 0) {
      if (followId) {
        const v = vehicleById(followId);
        if (v) {
          view.lat = v.lat;
          view.lon = v.lon;
        }
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#060b14";
      ctx.fillRect(0, 0, w, h);
      drawGrid();
      drawRiver();
      drawRoutes();
      drawStops();
      drawVehicles();
      drawPassenger();
      drawAttribution();
      if (hoverPt) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(hoverPt.x, hoverPt.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff30";
        ctx.stroke();
        ctx.restore();
      }
      void t;
    }
    function hitTest(px, py) {
      let best = null, bestD = 24;
      for (const v of vehicles()) {
        const p = project(v.lat, v.lon);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bestD) {
          bestD = d;
          best = { kind: "vehicle", id: v.id, vehicle: v };
        }
      }
      if (best) return best;
      bestD = 16;
      for (const route2 of ROUTES) {
        for (let i = 0; i < route2.stops.length; i++) {
          const [name, lat, lon] = route2.stops[i];
          const p = project(lat, lon);
          const d = Math.hypot(p.x - px, p.y - py);
          if (d < bestD) {
            bestD = d;
            best = { kind: "stop", routeId: route2.id, idx: i, name, lat, lon };
          }
        }
      }
      return best;
    }
    if (interactive) {
      let dragging = false, moved = false, last = null;
      const pointers = /* @__PURE__ */ new Map();
      canvas.addEventListener("pointerdown", (e) => {
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
        if (pointers.size === 1) {
          dragging = true;
          moved = false;
          last = { x: e.offsetX, y: e.offsetY };
        }
      });
      canvas.addEventListener("pointermove", (e) => {
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (canvas._pinch) view.zoom = clamp(view.zoom + Math.log2(dist / canvas._pinch) / 2, 11, 16);
          canvas._pinch = dist;
          moved = true;
          return;
        }
        if (dragging && last) {
          const dx = e.offsetX - last.x, dy = e.offsetY - last.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) {
            moved = true;
            followId = null;
          }
          const s = worldPx();
          const cx = (view.lon + 180) / 360 * s, cy = (0.5 - merc(view.lat) / (2 * Math.PI)) * s;
          const nx = cx - dx, ny = cy - dy;
          view.lon = nx / s * 360 - 180;
          view.lat = 180 / Math.PI * (2 * Math.atan(Math.exp((0.5 - ny / s) * 2 * Math.PI)) - Math.PI / 2);
          last = { x: e.offsetX, y: e.offsetY };
        }
        hoverPt = { x: e.offsetX, y: e.offsetY };
      });
      canvas.addEventListener("pointerup", (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) canvas._pinch = null;
        if (pointers.size === 0) {
          dragging = false;
          if (!moved) {
            const hit = hitTest(e.offsetX, e.offsetY);
            if (hit) {
              selected = hit;
              handlers.select.forEach((fn) => fn(hit));
            } else handlers.tap.forEach((fn) => fn(unproject(e.offsetX, e.offsetY)));
          }
        }
      });
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const before = unproject(e.offsetX, e.offsetY);
        view.zoom = clamp(view.zoom - Math.sign(e.deltaY) * 0.35, 11, 16);
        const after = unproject(e.offsetX, e.offsetY);
        view.lat += before.lat - after.lat;
        view.lon += before.lon - after.lon;
      }, { passive: false });
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return {
      render,
      resize,
      get view() {
        return view;
      },
      setCenter(lat, lon, zoom) {
        view.lat = lat;
        view.lon = lon;
        if (zoom) view.zoom = zoom;
      },
      follow(id) {
        followId = id;
      },
      get following() {
        return followId;
      },
      setDriverFocus(vehicleId, routeId = null) {
        drvVehId = vehicleId;
        focusRoute = routeId;
      },
      select(hit) {
        selected = hit;
      },
      fitRoute(route2, pad2 = 28) {
        const lats = route2.stops.map((s) => s[1]), lons = route2.stops.map((s) => s[2]);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLon = Math.min(...lons), maxLon = Math.max(...lons);
        view.lat = (minLat + maxLat) / 2;
        view.lon = (minLon + maxLon) / 2;
        for (let z = 16; z >= 10; z -= 0.1) {
          view.zoom = z;
          const a = project(minLat, minLon), b = project(maxLat, maxLon);
          if (Math.abs(b.x - a.x) < w - pad2 * 2 && Math.abs(b.y - a.y) < h - pad2 * 2) break;
        }
        return view.zoom;
      },
      on(evt, fn) {
        handlers[evt]?.push(fn);
      },
      destroy() {
        ro.disconnect();
      }
    };
  }
  var TILE, R2, merc, DAUGAVA;
  var init_map = __esm({
    "js/map.js"() {
      init_data();
      init_sim();
      init_util();
      TILE = 256;
      R2 = 6378137;
      merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
      DAUGAVA = [
        [56.89, 24.14],
        [56.902, 24.13],
        [56.915, 24.115],
        [56.925, 24.105],
        [56.933, 24.098],
        [56.94, 24.095],
        [56.947, 24.097],
        [56.955, 24.1],
        [56.965, 24.103],
        [56.974, 24.108],
        [56.983, 24.118],
        [56.992, 24.132]
      ];
    }
  });

  // js/driver.js
  var driver_exports = {};
  __export(driver_exports, {
    addDemoPassenger: () => addDemoPassenger,
    alightDemoPassengers: () => alightDemoPassengers,
    cabinFor: () => cabinFor,
    crowdingFor: () => crowdingFor,
    garageNumberFor: () => garageNumberFor,
    getDriverVehicle: () => getDriverVehicle,
    setDriverVehicle: () => setDriverVehicle,
    simulateStopBoarding: () => simulateStopBoarding,
    specsFor: () => specsFor
  });
  function overlayFor(vehicle) {
    if (!vehicleOverlay.has(vehicle.id)) {
      const h = hash01(vehicle.id.length, vehicle.schedDepart, vehicle.dir + 3);
      const seedFeed = [];
      const stops = vehicle.orderedStops || vehicle.route.stops;
      const maxSeedIdx = Math.max(0, Math.min(vehicle.stopIdx, stops.length - 1));
      for (let i = Math.max(0, maxSeedIdx - 2); i <= maxSeedIdx; i++) {
        const stopName = stops[i]?.[0] || stops[0][0];
        const b = 1 + Math.round(hash01(i + 1, vehicle.schedDepart) * 4);
        const agoMs = (maxSeedIdx - i) * 14e4 + 25e3;
        seedFeed.unshift({
          id: uid("df"),
          at: now2() - agoMs,
          kind: "easyride",
          stopName,
          title: `+${b} EasyRide ticket${b > 1 ? "s" : ""} auto-registered`,
          detail: `Stop ${stopName} · BLE beacon ${vehicle.unitId} verified`
        });
      }
      vehicleOverlay.set(vehicle.id, {
        easyRideDelta: 0,
        validatorDelta: 0,
        unregDelta: 0,
        lastBoarded: 2 + Math.round(h * 4),
        lastAlighted: Math.round(h * 2),
        lastStopIdx: vehicle.stopIdx,
        verifying: [],
        // { id, resolvesAt, stopName, holder, fare }
        feed: seedFeed
      });
    }
    return vehicleOverlay.get(vehicle.id);
  }
  function specsFor(vehicle) {
    return SPECS[vehicle.routeId] || SPECS[vehicle.route.mode] || SPECS.bus;
  }
  function garageNumberFor(vehicle) {
    const sp = specsFor(vehicle);
    const num = 10 + Math.round(hash01(vehicle.unitId.length, vehicle.schedDepart / 60, vehicle.dir) * 88);
    return `${sp.garagePrefix}${String(num).padStart(2, "0")}`;
  }
  function crowdingFor(pct) {
    if (pct <= 35) return { id: "low", label: "Low crowding", short: "Plenty of seats", cls: "green", hex: "#4ade80" };
    if (pct <= 65) return { id: "moderate", label: "Moderate", short: "Seats available", cls: "blue", hex: "#38bdf8" };
    if (pct <= 85) return { id: "busy", label: "Busy", short: "Standing room", cls: "amber", hex: "#fbbf24" };
    return { id: "crowded", label: "Very crowded", short: "Near capacity", cls: "red", hex: "#f87171" };
  }
  function getDriverVehicle() {
    const list = vehicles();
    if (!list.length) return null;
    const savedId = state.driver?.vehicleId;
    if (savedId) {
      const found = list.find((v) => v.id === savedId);
      if (found) return found;
    }
    const activePassengerVehId = detection.active?.vehicle?.id || state.trips.find((tr) => !tr.alightAt)?.vehicleId;
    if (activePassengerVehId) {
      const pv = list.find((v) => v.id === activePassengerVehId);
      if (pv) {
        setDriverVehicle(pv.id, { silent: true });
        return pv;
      }
    }
    const buses = list.filter((v) => v.route.mode === "bus" && !v.finished);
    const midBus = buses.find((v) => v.progress >= 0.18 && v.progress <= 0.78) || buses[0] || list.find((v) => v.progress >= 0.2 && v.progress <= 0.8) || list[0];
    if (midBus) setDriverVehicle(midBus.id, { silent: true });
    return midBus;
  }
  function setDriverVehicle(vehicleId, { silent = false } = {}) {
    state.driver = state.driver || {};
    state.driver.vehicleId = vehicleId;
    save();
    if (!silent) events.emit("driver-change", { vehicleId });
  }
  function flushVerifying(vehicle, ov, nowMs = now2()) {
    if (!ov.verifying.length) return;
    const remaining = [];
    let changed = false;
    for (const item of ov.verifying) {
      if (nowMs >= item.resolvesAt) {
        ov.easyRideDelta += 1;
        ov.feed.unshift({
          id: uid("df"),
          at: nowMs,
          kind: "easyride",
          stopName: item.stopName,
          title: `EasyRide ticket registered (${item.fare})`,
          detail: `Holder ${item.holder} · BLE dwell verified on ${vehicle.unitId}`
        });
        changed = true;
      } else {
        remaining.push(item);
      }
    }
    ov.verifying = remaining;
    ov.feed = ov.feed.slice(0, 30);
    if (changed) events.emit("driver-telemetry", { vehicleId: vehicle.id });
  }
  function cabinFor(vehicle) {
    if (!vehicle) return null;
    const nowMs = now2();
    const sp = specsFor(vehicle);
    const ov = overlayFor(vehicle);
    if (vehicle.stopIdx !== ov.lastStopIdx) {
      const stops = vehicle.orderedStops || vehicle.route.stops;
      const stopName = stops[vehicle.stopIdx]?.[0] || vehicle.currentStop;
      const boarded = 1 + Math.round(hash01(vehicle.stopIdx + 5, vehicle.schedDepart) * 4);
      const alighted = Math.round(hash01(vehicle.stopIdx + 11, vehicle.dir + 1) * 3);
      ov.lastBoarded = boarded;
      ov.lastAlighted = alighted;
      ov.lastStopIdx = vehicle.stopIdx;
      ov.feed.unshift({
        id: uid("df"),
        at: nowMs,
        kind: "stop",
        stopName,
        title: `Stop ${stopName} · +${boarded} boarded, −${alighted} alighted`,
        detail: `${Math.max(1, boarded - 1)} via EasyRide BLE · ${boarded > 1 ? "1 via card validator" : "doors closed"}`
      });
      ov.feed = ov.feed.slice(0, 30);
    }
    flushVerifying(vehicle, ov, nowMs);
    const basePax = Math.max(4, Math.round(vehicle.occupancy / 100 * sp.capacity));
    const splitSeed = 0.58 + 0.16 * hash01(vehicle.id.length, vehicle.stopIdx + 2);
    let baseEasyRide = Math.round(basePax * splitSeed);
    const baseUnreg = basePax >= 18 && hash01(vehicle.schedDepart, vehicle.stopIdx + 7) > 0.45 ? 1 : 0;
    let baseValidator = Math.max(0, basePax - baseEasyRide - baseUnreg);
    const userTrips = state.trips.filter((tr) => !tr.alightAt && tr.vehicleId === vehicle.id);
    const userEasyRide = userTrips.filter((tr) => tr.boardMethod === "hands-free").length;
    const userManual = userTrips.length - userEasyRide;
    const verifyingCount = ov.verifying.length;
    const easyRideCount = Math.max(0, baseEasyRide + ov.easyRideDelta + userEasyRide);
    const validatorCount = Math.max(0, baseValidator + ov.validatorDelta + userManual);
    const unregisteredCount = Math.max(0, baseUnreg + ov.unregDelta);
    const registeredTotal = easyRideCount + validatorCount;
    const onBoard = registeredTotal + unregisteredCount + verifyingCount;
    const seated = Math.min(sp.seats, onBoard);
    const standing = Math.max(0, onBoard - sp.seats);
    const crowdingPct = clamp(Math.round(onBoard / sp.capacity * 100), 0, 120);
    const crowding = crowdingFor(crowdingPct);
    const compliancePct = onBoard > 0 ? Math.round(registeredTotal / onBoard * 100) : 100;
    const zFront = clamp(Math.round(crowdingPct * (0.92 + 0.2 * hash01(vehicle.stopIdx + 1, 3))), 0, 100);
    const zMid = clamp(Math.round(crowdingPct * (1.08 + 0.16 * hash01(vehicle.stopIdx + 2, 7))), 0, 100);
    const zRear = clamp(Math.round(crowdingPct * (0.82 + 0.22 * hash01(vehicle.stopIdx + 3, 11))), 0, 100);
    const combinedFeed = [
      ...userTrips.map((tr) => ({
        id: `user-${tr.id}`,
        at: tr.boardAt,
        kind: "you",
        stopName: tr.boardStop,
        title: `YOU (${state.profile.holderId}) · ${tr.fareName}`,
        detail: `${tr.boardMethod === "hands-free" ? "Hands-free BLE" : "Manual"} registration at ${tr.boardStop}`
      })),
      ...ov.feed
    ].slice(0, 16);
    return {
      specs: sp,
      garageNo: garageNumberFor(vehicle),
      onBoard,
      seated,
      standing,
      capacity: sp.capacity,
      registeredTotal,
      easyRideCount,
      validatorCount,
      verifyingCount,
      unregisteredCount,
      compliancePct,
      crowdingPct,
      crowding,
      easyRideDevices: easyRideCount + verifyingCount,
      lastBoarded: ov.lastBoarded,
      lastAlighted: ov.lastAlighted,
      zones: [
        { id: "front", label: "Front door", pct: zFront, crowding: crowdingFor(zFront) },
        { id: "mid", label: "Mid cabin", pct: zMid, crowding: crowdingFor(zMid) },
        { id: "rear", label: "Rear cabin", pct: zRear, crowding: crowdingFor(zRear) }
      ],
      feed: combinedFeed
    };
  }
  function simulateStopBoarding(vehicle, count = 3) {
    if (!vehicle) return;
    const ov = overlayFor(vehicle);
    const nowMs = now2();
    const stopName = vehicle.currentStop || vehicle.orderedStops?.[vehicle.stopIdx]?.[0] || "Current stop";
    ov.lastBoarded = count;
    ov.lastAlighted = 0;
    for (let i = 0; i < count; i++) {
      const code = Math.floor(1e3 + Math.random() * 8999);
      const fare = SAMPLE_FARES[(i + Math.floor(Math.random() * SAMPLE_FARES.length)) % SAMPLE_FARES.length];
      ov.verifying.push({
        id: uid("ver"),
        resolvesAt: nowMs + 1100 + i * 450,
        stopName,
        holder: `LV-ER-${code}`,
        fare
      });
    }
    ov.feed.unshift({
      id: uid("df"),
      at: nowMs,
      kind: "door",
      stopName,
      title: `Doors opened at ${stopName} · +${count} stepped on board`,
      detail: `APC door beam counted +${count} · scanning EasyRide BLE tokens…`
    });
    ov.feed = ov.feed.slice(0, 30);
    events.emit("driver-telemetry", { vehicleId: vehicle.id });
    setTimeout(() => {
      flushVerifying(vehicle, ov, now2() + 2500);
    }, 1800);
  }
  function addDemoPassenger(vehicle, kind = "easyride") {
    if (!vehicle) return;
    const ov = overlayFor(vehicle);
    const nowMs = now2();
    const stopName = vehicle.currentStop || "En route";
    const code = Math.floor(1e3 + Math.random() * 8999);
    if (kind === "easyride") {
      ov.easyRideDelta += 1;
      ov.lastBoarded = 1;
      ov.feed.unshift({
        id: uid("df"),
        at: nowMs,
        kind: "easyride",
        stopName,
        title: `+1 EasyRide ticket registered (90-min ticket)`,
        detail: `Holder LV-ER-${code} · auto-registered via ${vehicle.unitId}`
      });
    } else if (kind === "validator") {
      ov.validatorDelta += 1;
      ov.lastBoarded = 1;
      ov.feed.unshift({
        id: uid("df"),
        at: nowMs,
        kind: "validator",
        stopName,
        title: `+1 cabin validator tap (e-talons)`,
        detail: `Card validated at front reader · ${stopName}`
      });
    } else {
      ov.unregDelta += 1;
      ov.lastBoarded = 1;
      ov.feed.unshift({
        id: uid("df"),
        at: nowMs,
        kind: "warn",
        stopName,
        title: `+1 passenger boarded — no ticket registered yet`,
        detail: `Door counter +1 at ${stopName} · no BLE token or card tap detected`
      });
    }
    ov.feed = ov.feed.slice(0, 30);
    events.emit("driver-telemetry", { vehicleId: vehicle.id });
  }
  function alightDemoPassengers(vehicle, count = 2) {
    if (!vehicle) return;
    const ov = overlayFor(vehicle);
    const cab = cabinFor(vehicle);
    const actual = Math.min(count, Math.max(0, cab.onBoard - 1));
    if (actual <= 0) return;
    let rem = actual;
    while (rem > 0 && cab.unregisteredCount + ov.unregDelta > 0 && ov.unregDelta > 0) {
      ov.unregDelta -= 1;
      rem -= 1;
    }
    while (rem > 0) {
      ov.easyRideDelta -= 1;
      rem -= 1;
    }
    ov.lastBoarded = 0;
    ov.lastAlighted = actual;
    ov.feed.unshift({
      id: uid("df"),
      at: now2(),
      kind: "stop",
      stopName: vehicle.currentStop || "Stop",
      title: `−${actual} passenger${actual > 1 ? "s" : ""} alighted`,
      detail: `APC exit count updated · cabin occupancy recalculated`
    });
    ov.feed = ov.feed.slice(0, 30);
    events.emit("driver-telemetry", { vehicleId: vehicle.id });
  }
  var SPECS, SAMPLE_FARES, vehicleOverlay;
  var init_driver = __esm({
    "js/driver.js"() {
      init_sim();
      init_store();
      init_detection();
      init_util();
      SPECS = {
        b22: { model: "Solaris Urbino 18 Electric", garagePrefix: "RS-78", seats: 42, standing: 48, capacity: 90, doors: 4 },
        b3: { model: "Solaris Urbino 12 Electric", garagePrefix: "RS-64", seats: 32, standing: 48, capacity: 80, doors: 3 },
        bus: { model: "Solaris Urbino 12 Electric", garagePrefix: "RS-61", seats: 32, standing: 48, capacity: 80, doors: 3 },
        trolley: { model: "Škoda 27Tr Solaris", garagePrefix: "RS-29", seats: 38, standing: 52, capacity: 90, doors: 4 },
        tram: { model: "Škoda 15T ForCity Riga", garagePrefix: "RS-51", seats: 60, standing: 70, capacity: 130, doors: 6 }
      };
      SAMPLE_FARES = ["90-min ticket", "Monthly pass", "24-hour ticket", "90-min (transfer)", "5-day ticket"];
      vehicleOverlay = /* @__PURE__ */ new Map();
      onTick(() => {
        const v = state.driver?.vehicleId ? vehicleById(state.driver.vehicleId) : null;
        if (v && vehicleOverlay.has(v.id)) flushVerifying(v, vehicleOverlay.get(v.id), now2());
      });
    }
  });

  // js/driver-screens.js
  function modeLabel(mode) {
    return mode === "trolley" ? "Trolleybus" : mode === "tram" ? "Tram" : "Bus";
  }
  function openBusPickerSheet(onPicked) {
    openSheet(({ close: close2 }) => {
      const all = vehicles().slice().sort((a, b) => {
        const order = { bus: 0, trolley: 1, tram: 2 };
        return (order[a.route.mode] ?? 3) - (order[b.route.mode] ?? 3) || a.route.number.localeCompare(b.route.number, void 0, { numeric: true });
      });
      const current2 = getDriverVehicle();
      const box = el(
        "div",
        {},
        el("h3", { text: "Select vehicle to drive" }),
        el("div", { class: "small muted", text: "Buses are listed first, followed by trolleybuses and trams currently in service." })
      );
      const list = el("div", { class: "list", style: "margin-top:10px" });
      all.forEach((v) => {
        const cab = cabinFor(v);
        const isCur = current2?.id === v.id;
        list.append(el(
          "button",
          {
            class: "item",
            style: isCur ? "border-color:var(--acc);background:#4ade8012" : "",
            onclick: () => {
              setDriverVehicle(v.id);
              close2();
              toast({ title: `Now driving ${modeLabel(v.route.mode)} ${v.route.number}`, body: `→ ${v.headsign} · ${cab.onBoard} on board`, kind: "ok" });
              onPicked?.(v);
            }
          },
          modeChip(v.route),
          el(
            "div",
            { class: "grow" },
            el("div", { class: "t", text: `${modeLabel(v.route.mode)} ${v.route.number} → ${v.headsign}` }),
            el("div", { class: "s", text: `${v.dwelling ? `At ${v.currentStop}` : `Next: ${v.nextStop || "terminus"}`} · ${cab.garageNo}` })
          ),
          el(
            "div",
            { class: "r" },
            pill(`${cab.onBoard}/${cab.capacity} pax`, cab.crowding.cls),
            el("div", { class: "tiny faint", style: "margin-top:2px", text: `${cab.crowdingPct}% full` })
          )
        ));
      });
      box.append(list);
      return box;
    });
  }
  function makeDriverVehicleBar(onSwitch) {
    const wrap = el("div", { class: "card drv-veh-bar" });
    const topLeft = el("div", { class: "row grow", style: "gap:10px;min-width:0" });
    const switchBtn = el("button", {
      class: "btn ghost sm",
      text: "Switch bus ▾",
      onclick: () => openBusPickerSheet(onSwitch)
    });
    const statusRow = el("div", { class: "row", style: "gap:6px;margin-top:10px;flex-wrap:wrap" });
    wrap.append(el("div", { class: "row between", style: "gap:8px" }, topLeft, switchBtn), statusRow);
    const update = (v, cab) => {
      if (!v) return;
      topLeft.innerHTML = "";
      topLeft.append(
        modeChip(v.route, true),
        el(
          "div",
          { class: "grow", style: "min-width:0" },
          el("div", { style: "font-weight:700;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis", text: `${modeLabel(v.route.mode)} ${v.route.number} → ${v.headsign}` }),
          el("div", { class: "tiny muted", style: "white-space:nowrap;overflow:hidden;text-overflow:ellipsis", text: `${v.route.name} · ${cab.garageNo} · ${v.unitId}` })
        )
      );
      statusRow.innerHTML = "";
      const delayMin = Math.round(v.delay / 60);
      statusRow.append(
        pill(v.delay > 90 ? `+${delayMin} min late` : "On schedule", v.delay > 90 ? "amber" : "green"),
        pill(v.dwelling ? "At stop · doors open" : `${Math.round(v.speed)} km/h · moving`, v.dwelling ? "blue" : "grey"),
        pill(`BLE unit active`, "green")
      );
    };
    return { node: wrap, update };
  }
  function makeNextStopHud() {
    const card = el("div", { class: "drv-next-hud" });
    const update = (v) => {
      if (!v) return;
      const stops = v.orderedStops || v.route.stops;
      const pct = Math.round(clampPct(v.progress * 100));
      const etaTxt = v.dwelling ? "Doors open" : v.nextStop ? `${fmtDuration((v.etaNextStopSec || 0) * 1e3)} · ${Math.round(v.nextStopDistM || 0)} m` : "Terminus";
      card.innerHTML = "";
      card.append(
        el(
          "div",
          { class: "row between", style: "align-items:flex-start" },
          el(
            "div",
            { class: "grow" },
            el("div", { class: "drv-eyebrow", text: v.dwelling ? `AT STOP · STOP ${v.stopIdx + 1} OF ${stops.length}` : `NEXT STOP · STOP ${Math.min(stops.length, (v.nextIdx ?? v.stopIdx) + 1)} OF ${stops.length}` }),
            el("div", { class: "drv-stop-name", text: v.dwelling ? v.currentStop : v.nextStop || v.currentStop }),
            el("div", { class: "tiny muted", style: "margin-top:2px", text: v.dwelling ? v.nextStop ? `Then → ${v.nextStop}` : "Final stop on this trip" : `Departed ${v.currentStop} · heading to ${v.headsign}` })
          ),
          el(
            "div",
            { class: "r" },
            el("div", { class: "drv-eta", text: etaTxt }),
            el("div", { class: "tiny muted mono", text: `${(v.distance / 1e3).toFixed(1)} / ${(v.totalDistance / 1e3).toFixed(1)} km` })
          )
        ),
        el("div", { class: "progress", style: "margin-top:10px" }, el("i", { style: `width:${pct}%` }))
      );
    };
    return { node: card, update };
  }
  function clampPct(x) {
    return Math.max(0, Math.min(100, x));
  }
  var DRV_ICON, startScreen, driverCockpit, driverMap, driverRoute, driverTickets;
  var init_driver_screens = __esm({
    "js/driver-screens.js"() {
      init_util();
      init_data();
      init_sim();
      init_store();
      init_store();
      init_map();
      init_ui();
      init_driver();
      DRV_ICON = {
        passenger: '<circle cx="12" cy="7.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18.5 6.5a4.5 4.5 0 0 1 0 5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        driver: '<rect x="4" y="4.5" width="16" height="14" rx="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 11.5h16M8.5 18.5v2M15.5 18.5v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="15" r="1.2" fill="currentColor"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/>',
        users: '<circle cx="9" cy="8.5" r="2.8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.8 18.5a5.3 5.3 0 0 1 10.4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.5" cy="9.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15.5 18.5a4.4 4.4 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
        swap: '<path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
      };
      startScreen = {
        title: "EasyRide",
        sub: "Rīga · hands-free public transport",
        tab: null,
        role: "neutral",
        render() {
          const node = el("div", { class: "role-start" });
          const hero = el(
            "div",
            { class: "role-hero" },
            el("div", { class: "badge-hf", html: `${svg(ICON.signal, 14)} <span>EasyRide · Rīgas satiksme demo</span>` }),
            el("h2", { text: "Choose what you want to see" }),
            el("p", { text: "Experience EasyRide from either side — as a passenger taking public transport, or through the bus driver’s live cabin display." })
          );
          const passengerCard = el(
            "button",
            {
              class: "role-card role-passenger",
              id: "choose-passenger",
              onclick: () => {
                setRole("passenger");
                location.hash = state.onboarded ? "#/home" : "#/onboarding";
              }
            },
            el(
              "div",
              { class: "role-card-top" },
              el("div", { class: "role-icon passenger-ico", html: svg(DRV_ICON.passenger, 26) }),
              el(
                "div",
                { class: "grow" },
                el("div", { class: "role-eyebrow", text: "PASSENGER APP" }),
                el("h3", { text: "I’m taking public transport" })
              ),
              el("span", { class: "role-arrow", text: "→" })
            ),
            el("p", { class: "role-desc", text: "Live Riga timetables & map, ticket store, and automatic hands-free BLE ticket registration the moment you step on board." }),
            el(
              "div",
              { class: "role-tags" },
              pill("Live departures", "green"),
              pill("Buy tickets", "blue"),
              pill("Hands-free boarding", "grey")
            )
          );
          const driverCard = el(
            "button",
            {
              class: "role-card role-driver",
              id: "choose-driver",
              onclick: () => {
                setRole("driver");
                location.hash = "#/driver";
              }
            },
            el(
              "div",
              { class: "role-card-top" },
              el("div", { class: "role-icon driver-ico", html: svg(DRV_ICON.driver, 26) }),
              el(
                "div",
                { class: "grow" },
                el("div", { class: "role-eyebrow", text: "CABIN CONSOLE" }),
                el("h3", { text: "I’m the bus driver" })
              ),
              el("span", { class: "role-arrow", text: "→" })
            ),
            el("p", { class: "role-desc", text: "See how many people are on board, how many tickets are registered, where your bus is on the map, your bus route, and live crowding." }),
            el(
              "div",
              { class: "role-tags" },
              pill("People on board", "blue"),
              pill("Tickets registered", "green"),
              pill("Map, route & crowding", "amber")
            )
          );
          const fleetLine = el("div", { class: "card tight", style: "margin-top:14px" });
          const updateFleet = () => {
            const f = fleetStats();
            const buses = vehicles().filter((v) => v.route.mode === "bus").length;
            fleetLine.innerHTML = "";
            fleetLine.append(
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("div", { style: "font-weight:600;font-size:13px", text: `${f.total} vehicles live across Riga (${buses} buses)` }),
                  el("div", { class: "tiny muted", text: "Switch between Passenger and Driver anytime from the top bar — both share the same live fleet." })
                ),
                pill("live sim", "green")
              )
            );
          };
          node.append(hero, passengerCard, driverCard, fleetLine);
          updateFleet();
          let last = 0;
          return {
            node,
            tick() {
              const t = performance.now();
              if (t - last > 1500) {
                last = t;
                updateFleet();
              }
            }
          };
        }
      };
      driverCockpit = {
        title: "Driver Console",
        sub: "EasyRide · live cabin telemetry",
        tab: "d-cockpit",
        role: "driver",
        render() {
          const node = el("div", { class: "drv-screen" });
          let map = null;
          let following = true;
          const vehBar = makeDriverVehicleBar((picked) => {
            if (map && picked) {
              map.setDriverFocus(picked.id, picked.routeId);
              following = true;
              map.follow(picked.id);
              map.setCenter(picked.lat, picked.lon, 14.1);
            }
            refreshAll(true);
          });
          const nextHud = makeNextStopHud();
          const kpiGrid = el("div", { class: "drv-kpi-grid" });
          const paxBox = el("div", { class: "card drv-kpi" });
          const tixBox = el("div", { class: "card drv-kpi" });
          kpiGrid.append(paxBox, tixBox);
          const crowdCard = el("div", { class: "card drv-crowd-card" });
          const mapCanvas = el("canvas", { style: "height:245px;width:100%" });
          const followBtn = el("button", {
            class: "map-chip on",
            text: "Following our bus",
            onclick: () => {
              const v = getDriverVehicle();
              if (!v || !map) return;
              following = true;
              map.follow(v.id);
              map.setCenter(v.lat, v.lon, 14.1);
              followBtn.classList.add("on");
              followBtn.textContent = "Following our bus";
            }
          });
          const fitBtn = el("button", {
            class: "map-chip",
            text: "Full route",
            onclick: () => {
              const v = getDriverVehicle();
              if (!v || !map) return;
              following = false;
              map.follow(null);
              map.fitRoute(v.route, 26);
              followBtn.classList.remove("on");
              followBtn.textContent = "Recenter on bus";
            }
          });
          const gpsChip = el("span", { class: "map-chip mono" });
          const mapWrap = el("div", { class: "map-wrap" }, mapCanvas, el("div", { class: "map-overlay" }, followBtn, fitBtn, gpsChip));
          const routeMeta = el("div", { class: "small muted", style: "margin:-4px 2px 8px" });
          const stopsCard = el("div", { class: "card tight drv-stops-card" });
          const demoCard = el("div", { class: "card" });
          const speedSeg = el("div", { class: "seg" });
          [1, 4, 20, 60].forEach((sc) => {
            const b = el("button", {
              class: getScale() === sc ? "on" : "",
              text: `${sc}×`,
              onclick: () => {
                setScale(sc);
                [...speedSeg.children].forEach((c) => c.classList.toggle("on", c === b));
                document.querySelectorAll("#timescale button").forEach((x) => x.classList.toggle("on", +x.dataset.scale === sc));
                toast({ title: `Simulation speed ${sc}×`, kind: "info" });
              }
            });
            speedSeg.append(b);
          });
          const btnDoorBoard = el("button", {
            class: "btn sm",
            text: "Simulate stop boarding (+3)",
            onclick: () => {
              const v = getDriverVehicle();
              simulateStopBoarding(v, 3);
              toast({ title: "+3 passengers stepped on board", body: "APC counted +3 · EasyRide BLE beacons verifying…", kind: "ok" });
              refreshAll(true);
            }
          });
          const btnAddEr = el("button", {
            class: "btn ghost sm",
            text: "+1 EasyRide ticket",
            onclick: () => {
              const v = getDriverVehicle();
              addDemoPassenger(v, "easyride");
              refreshAll(true);
            }
          });
          const btnAddUnreg = el("button", {
            class: "btn ghost sm",
            text: "+1 Unregistered",
            onclick: () => {
              const v = getDriverVehicle();
              addDemoPassenger(v, "unregistered");
              toast({ title: "Unregistered boarding detected", body: "Passenger counted at door without BLE ticket or card tap.", kind: "warn" });
              refreshAll(true);
            }
          });
          const btnAlight = el("button", {
            class: "btn ghost sm",
            text: "−2 Alight",
            onclick: () => {
              const v = getDriverVehicle();
              alightDemoPassengers(v, 2);
              refreshAll(true);
            }
          });
          const feedHost = el("div", { class: "list", style: "margin-top:10px" });
          demoCard.append(
            el(
              "div",
              { class: "row between" },
              el("div", { style: "font-weight:650;font-size:13.5px", text: "Cabin simulator & live boarding feed" }),
              speedSeg
            ),
            el("div", { class: "tiny muted", style: "margin-top:4px", text: "Test doors opening, hands-free BLE registrations, or speed up the bus along its route." }),
            el("div", { class: "row", style: "gap:7px;margin-top:10px;flex-wrap:wrap" }, btnDoorBoard, btnAddEr, btnAddUnreg, btnAlight),
            feedHost
          );
          node.append(
            vehBar.node,
            nextHud.node,
            kpiGrid,
            crowdCard,
            sectionTitle("Where we are on the map", el("button", { class: "btn-ghost-inline", text: "Full map →", onclick: () => {
              location.hash = "#/driver-map";
            } })),
            mapWrap,
            sectionTitle("Our bus route & stops", el("button", { class: "btn-ghost-inline", text: "Schedule →", onclick: () => {
              location.hash = "#/driver-route";
            } })),
            routeMeta,
            stopsCard,
            sectionTitle("Live registrations & demo controls"),
            demoCard
          );
          let lastUiUpdate = 0;
          let lastStopSig = "";
          const refreshAll = (force = false) => {
            const nowPerf = performance.now();
            if (!force && nowPerf - lastUiUpdate < 380) return;
            lastUiUpdate = nowPerf;
            const v = getDriverVehicle();
            if (!v) return;
            const cab = cabinFor(v);
            if (map) {
              map.setDriverFocus(v.id, v.routeId);
              if (following && map.following !== v.id) map.follow(v.id);
            }
            vehBar.update(v, cab);
            nextHud.update(v);
            gpsChip.textContent = `${v.lat.toFixed(4)}, ${v.lon.toFixed(4)}`;
            paxBox.innerHTML = "";
            paxBox.append(
              el("div", { class: "drv-eyebrow", text: "PEOPLE ON BOARD" }),
              el(
                "div",
                { class: "drv-big-num" },
                el("span", { text: String(cab.onBoard) }),
                el("span", { class: "drv-big-sub", text: ` / ${cab.capacity}` })
              ),
              el("div", { class: "tiny muted", style: "margin-top:4px", text: `${cab.seated} seated · ${cab.standing} standing` }),
              el(
                "div",
                { style: "margin-top:8px" },
                pill(`Last stop: +${cab.lastBoarded} on · −${cab.lastAlighted} off`, "blue")
              )
            );
            tixBox.innerHTML = "";
            tixBox.append(
              el("div", { class: "drv-eyebrow", text: "TICKETS REGISTERED" }),
              el(
                "div",
                { class: "drv-big-num" },
                el("span", { style: "color:var(--acc)", text: String(cab.registeredTotal) }),
                el("span", { class: "drv-big-sub", text: ` / ${cab.onBoard} (${cab.compliancePct}%)` })
              ),
              el(
                "div",
                { class: "drv-tix-lines" },
                el("div", {}, el("span", { class: "dot-sm ok" }), `${cab.easyRideCount} EasyRide (BLE)`),
                el("div", {}, el("span", { class: "dot-sm blue" }), `${cab.validatorCount} Card / QR tap`),
                cab.verifyingCount > 0 ? el("div", { style: "color:var(--acc2)" }, el("span", { class: "dot-sm pulse" }), `${cab.verifyingCount} verifying BLE…`) : null,
                el(
                  "div",
                  { style: cab.unregisteredCount > 0 ? "color:var(--warn);font-weight:600" : "color:var(--txt3)" },
                  el("span", { class: `dot-sm ${cab.unregisteredCount > 0 ? "warn" : "ok"}` }),
                  cab.unregisteredCount > 0 ? `${cab.unregisteredCount} unregistered` : "0 unregistered ✓"
                )
              )
            );
            crowdCard.innerHTML = "";
            crowdCard.append(
              el(
                "div",
                { class: "row between", style: "flex-wrap:wrap;gap:6px" },
                el(
                  "div",
                  {},
                  el("div", { class: "drv-eyebrow", text: "BUS CROWDING (EASYRIDE APP)" }),
                  el("div", { style: "font-weight:700;font-size:16px;margin-top:2px", text: `${cab.crowdingPct}% full · ${cab.crowding.label}` })
                ),
                pill(cab.crowding.short, cab.crowding.cls)
              ),
              el(
                "div",
                { class: "drv-meter", style: "margin-top:10px" },
                el("div", { class: "drv-meter-fill", style: `width:${clampPct(cab.crowdingPct)}%;background:${cab.crowding.hex}` }),
                el("i", { class: "tick", style: "left:35%" }),
                el("i", { class: "tick", style: "left:65%" }),
                el("i", { class: "tick", style: "left:85%" })
              ),
              el(
                "div",
                { class: "row between tiny faint", style: "margin-top:4px" },
                el("span", { text: "0% Empty" }),
                el("span", { text: "35% Seats" }),
                el("span", { text: "65% Busy" }),
                el("span", { text: "100% Cap" })
              ),
              el(
                "div",
                { class: "drv-zones", style: "margin-top:12px" },
                cab.zones.map((z) => el(
                  "div",
                  { class: "drv-zone" },
                  el(
                    "div",
                    { class: "row between tiny" },
                    el("span", { class: "muted", text: z.label }),
                    el("b", { style: `color:${z.crowding.hex}`, text: `${z.pct}%` })
                  ),
                  el(
                    "div",
                    { class: "progress", style: "margin-top:5px;height:6px" },
                    el("i", { style: `width:${z.pct}%;background:${z.crowding.hex}` })
                  )
                ))
              ),
              el(
                "div",
                { class: "sensor-strip", style: "margin-top:10px" },
                el("span", { html: svg(ICON.signal, 15) }),
                el("span", { text: `${cab.easyRideDevices} active EasyRide phones on board + APC door sensors · waiting passengers see “${cab.crowding.short} (${cab.crowdingPct}%)” in the app.` })
              )
            );
            const sched = stopScheduleFor(v);
            const stopSig = `${v.id}|${v.stopIdx}|${v.dwelling}|${Math.floor(now2() / 15e3)}`;
            if (force || stopSig !== lastStopSig) {
              lastStopSig = stopSig;
              routeMeta.textContent = `${modeLabel(v.route.mode)} ${v.route.number} · ${v.orderedStops[0][0]} → ${v.headsign} (${sched.length} stops)`;
              stopsCard.innerHTML = "";
              sched.forEach((st) => {
                const isFocus = st.status === "current" || st.status === "next";
                stopsCard.append(el(
                  "div",
                  {
                    class: `stopline ${st.status === "passed" ? "passed" : ""} ${isFocus ? "next" : ""}`
                  },
                  el("div", { class: "stop-dot", style: isFocus ? "background:var(--acc);box-shadow:0 0 0 4px #4ade8033" : "" }),
                  el(
                    "div",
                    { class: "grow" },
                    el("div", { class: "t", style: "font-size:13.5px", text: `${st.idx + 1}. ${st.name}` }),
                    el("div", { class: "tiny muted", text: st.status === "current" ? "Our bus is at this stop (doors open)" : st.status === "next" ? `Next stop · arriving in ${st.inSec <= 20 ? "moments" : fmtDuration(st.inSec * 1e3)}` : st.status === "passed" ? "Passed ✓" : `Expected ${fmtClock(new Date(st.expectedMs))}` })
                  ),
                  st.status === "current" ? pill("AT STOP", "green") : st.status === "next" ? pill("NEXT", "blue") : el("div", { class: "tiny mono faint", text: fmtClock(new Date(st.expectedMs)) })
                ));
              });
            }
            feedHost.innerHTML = "";
            cab.feed.slice(0, 6).forEach((f) => {
              const badgeCls = f.kind === "you" ? "green" : f.kind === "warn" ? "amber" : f.kind === "easyride" ? "green" : "blue";
              const badgeTxt = f.kind === "you" ? "YOU" : f.kind === "warn" ? "UNREG" : f.kind === "easyride" ? "BLE" : "DOOR";
              feedHost.append(el(
                "div",
                { class: "drv-feed-row" },
                pill(badgeTxt, badgeCls),
                el(
                  "div",
                  { class: "grow", style: "min-width:0" },
                  el("div", { style: "font-weight:600;font-size:12.5px", text: f.title }),
                  el("div", { class: "tiny muted", text: f.detail })
                ),
                el("div", { class: "tiny mono faint", text: fmtClock(new Date(f.at)) })
              ));
            });
          };
          const unsubTelemetry = events.on("driver-telemetry", () => refreshAll(true));
          return {
            node,
            init() {
              const v = getDriverVehicle();
              map = createMap(mapCanvas, {
                interactive: true,
                showPassenger: false,
                driverVehicleId: v?.id || null,
                focusRouteId: v?.routeId || null
              });
              if (v) {
                map.setCenter(v.lat, v.lon, 14.1);
                map.follow(v.id);
              }
              mapCanvas.addEventListener("pointerdown", () => {
                setTimeout(() => {
                  if (!map.following) {
                    following = false;
                    followBtn.classList.remove("on");
                    followBtn.textContent = "Recenter on bus";
                  }
                }, 120);
              });
              refreshAll(true);
            },
            tick() {
              refreshAll(false);
              map?.render();
            },
            destroy() {
              unsubTelemetry();
              map?.destroy();
            }
          };
        }
      };
      driverMap = {
        title: "Driver Map",
        sub: "Live bus position & route ahead",
        tab: "d-map",
        role: "driver",
        render() {
          const node = el("div", { class: "drv-screen" });
          let map = null;
          const vehBar = makeDriverVehicleBar((picked) => {
            if (map && picked) {
              map.setDriverFocus(picked.id, picked.routeId);
              map.follow(picked.id);
              map.setCenter(picked.lat, picked.lon, 14.2);
            }
            refresh(true);
          });
          const nextHud = makeNextStopHud();
          const canvas = el("canvas", { style: "height:54vh;width:100%" });
          const recenter = el("button", {
            class: "map-chip on",
            text: "Follow our bus",
            onclick: () => {
              const v = getDriverVehicle();
              if (v && map) {
                map.follow(v.id);
                map.setCenter(v.lat, v.lon, 14.3);
              }
            }
          });
          const fitRouteBtn = el("button", {
            class: "map-chip",
            text: "Fit entire route",
            onclick: () => {
              const v = getDriverVehicle();
              if (v && map) {
                map.follow(null);
                map.fitRoute(v.route, 28);
              }
            }
          });
          const wrap = el("div", { class: "map-wrap tall" }, canvas, el("div", { class: "map-overlay" }, recenter, fitRouteBtn));
          const linePeers = el("div", { class: "list" });
          node.append(vehBar.node, nextHud.node, wrap, sectionTitle("Other vehicles on our route"), linePeers);
          let last = 0;
          const refresh = (force = false) => {
            const nowPerf = performance.now();
            if (!force && nowPerf - last < 500) return;
            last = nowPerf;
            const v = getDriverVehicle();
            if (!v) return;
            const cab = cabinFor(v);
            vehBar.update(v, cab);
            nextHud.update(v);
            map?.setDriverFocus(v.id, v.routeId);
            recenter.classList.toggle("on", map?.following === v.id);
            const peers = vehiclesOnRoute(v.routeId).filter((x) => x.id !== v.id);
            linePeers.innerHTML = "";
            if (!peers.length) linePeers.append(emptyState("No other vehicles currently on this route"));
            peers.forEach((p) => {
              const pc = cabinFor(p);
              linePeers.append(el(
                "button",
                {
                  class: "item",
                  onclick: () => {
                    setDriverVehicle(p.id);
                    map?.follow(p.id);
                    refresh(true);
                  }
                },
                modeChip(p.route),
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", text: `→ ${p.headsign} (${pc.garageNo})` }),
                  el("div", { class: "s", text: p.dwelling ? `At ${p.currentStop}` : `Next: ${p.nextStop}` })
                ),
                el(
                  "div",
                  { class: "r" },
                  pill(`${pc.onBoard} pax · ${pc.crowdingPct}%`, pc.crowding.cls)
                )
              ));
            });
          };
          return {
            node,
            init() {
              const v = getDriverVehicle();
              map = createMap(canvas, { interactive: true, showPassenger: false, driverVehicleId: v?.id, focusRouteId: v?.routeId });
              if (v) {
                map.setCenter(v.lat, v.lon, 14.2);
                map.follow(v.id);
              }
              refresh(true);
            },
            tick() {
              refresh(false);
              map?.render();
            },
            destroy() {
              map?.destroy();
            }
          };
        }
      };
      driverRoute = {
        title: "Our Bus Route",
        sub: "Stop-by-stop schedule & line alerts",
        tab: "d-route",
        role: "driver",
        render() {
          const node = el("div", { class: "drv-screen" });
          const vehBar = makeDriverVehicleBar(() => refresh(true));
          const nextHud = makeNextStopHud();
          const summary = el("div", { class: "card" });
          const stopsHost = el("div", { class: "card tight" });
          const alertsHost = el("div", { class: "list" });
          node.append(vehBar.node, nextHud.node, summary, sectionTitle("All stops on this trip"), stopsHost, sectionTitle("Route notices"), alertsHost);
          let last = 0;
          const refresh = (force = false) => {
            const nowPerf = performance.now();
            if (!force && nowPerf - last < 500) return;
            last = nowPerf;
            const v = getDriverVehicle();
            if (!v) return;
            const cab = cabinFor(v);
            vehBar.update(v, cab);
            nextHud.update(v);
            const sched = stopScheduleFor(v);
            summary.innerHTML = "";
            summary.append(
              kv("Route", `${modeLabel(v.route.mode)} ${v.route.number} · ${v.route.name}`),
              kv("Current direction", `→ ${v.headsign}`),
              kv("Trip ID", v.tripId),
              kv("Total distance", `${(v.totalDistance / 1e3).toFixed(1)} km (${sched.length} stops)`),
              kv("Schedule adherence", v.delay > 90 ? `+${Math.round(v.delay / 60)} min behind schedule` : `On time (+${v.delay} s)`),
              kv("Expected at terminus", sched.length ? fmtClock(new Date(sched[sched.length - 1].expectedMs)) : "—")
            );
            stopsHost.innerHTML = "";
            sched.forEach((st) => {
              const isFocus = st.status === "current" || st.status === "next";
              stopsHost.append(el(
                "div",
                { class: `stopline ${st.status === "passed" ? "passed" : ""} ${isFocus ? "next" : ""}` },
                el("div", { class: "stop-dot" }),
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", style: "font-size:13.5px", text: `${st.idx + 1}. ${st.name}` }),
                  el("div", { class: "tiny muted", text: `${(st.distM / 1e3).toFixed(1)} km from origin · sched ${fmtClock(new Date(st.schedMs))}` })
                ),
                el(
                  "div",
                  { class: "r" },
                  st.status === "current" ? pill("AT STOP", "green") : st.status === "next" ? pill(`in ${Math.max(1, Math.round(st.inSec / 60))} min`, "blue") : st.status === "passed" ? pill("passed", "grey") : el("div", { class: "mono small", text: fmtClock(new Date(st.expectedMs)) })
                )
              ));
            });
            const relAlerts = ALERTS.filter((a) => !a.route || a.route === v.routeId);
            alertsHost.innerHTML = "";
            relAlerts.forEach((a) => alertsHost.append(el(
              "div",
              { class: "card tight" },
              el("div", { style: "font-weight:600;font-size:13.5px", text: a.title }),
              el("div", { class: "tiny muted", style: "margin-top:3px", text: a.body })
            )));
          };
          return { node, init: () => refresh(true), tick: () => refresh(false) };
        }
      };
      driverTickets = {
        title: "Passengers & Tickets",
        sub: "Registered tickets & cabin crowding",
        tab: "d-tickets",
        role: "driver",
        render() {
          const node = el("div", { class: "drv-screen" });
          const vehBar = makeDriverVehicleBar(() => refresh(true));
          const breakdown = el("div", { class: "card" });
          const feedHost = el("div", { class: "list" });
          const actions = el(
            "div",
            { class: "card" },
            el("div", { style: "font-weight:650;font-size:13.5px", text: "Simulate passenger activity" }),
            el(
              "div",
              { class: "row", style: "gap:8px;margin-top:10px;flex-wrap:wrap" },
              el("button", { class: "btn sm", text: "Simulate stop boarding (+3)", onclick: () => {
                simulateStopBoarding(getDriverVehicle(), 3);
                refresh(true);
              } }),
              el("button", { class: "btn ghost sm", text: "+1 EasyRide BLE", onclick: () => {
                addDemoPassenger(getDriverVehicle(), "easyride");
                refresh(true);
              } }),
              el("button", { class: "btn ghost sm", text: "+1 Card tap", onclick: () => {
                addDemoPassenger(getDriverVehicle(), "validator");
                refresh(true);
              } }),
              el("button", { class: "btn ghost sm", text: "+1 Unregistered", onclick: () => {
                addDemoPassenger(getDriverVehicle(), "unregistered");
                refresh(true);
              } }),
              el("button", { class: "btn ghost sm", text: "−2 Alight", onclick: () => {
                alightDemoPassengers(getDriverVehicle(), 2);
                refresh(true);
              } })
            )
          );
          node.append(vehBar.node, breakdown, actions, sectionTitle("Cabin registration feed"), feedHost);
          let last = 0;
          const refresh = (force = false) => {
            const nowPerf = performance.now();
            if (!force && nowPerf - last < 450) return;
            last = nowPerf;
            const v = getDriverVehicle();
            if (!v) return;
            const cab = cabinFor(v);
            vehBar.update(v, cab);
            breakdown.innerHTML = "";
            breakdown.append(
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("div", { style: "font-weight:700;font-size:18px", text: `${cab.registeredTotal} of ${cab.onBoard} tickets registered` }),
                  el("div", { class: "small muted", text: `Compliance ${cab.compliancePct}% · Bus crowding ${cab.crowdingPct}% (${cab.crowding.label})` })
                ),
                pill(`${cab.compliancePct}% valid`, cab.unregisteredCount > 0 ? "amber" : "green")
              ),
              el("hr", { class: "sep" }),
              kv("People on board (APC + BLE)", `${cab.onBoard} / ${cab.capacity} (${cab.seated} seated, ${cab.standing} standing)`),
              kv("Registered via EasyRide app (BLE)", `${cab.easyRideCount} passengers`),
              kv("Registered via cabin validator", `${cab.validatorCount} passengers`),
              kv("Verifying BLE dwell right now", `${cab.verifyingCount} phone(s)`),
              kv("Unregistered passengers", `${cab.unregisteredCount}`),
              kv("Vehicle onboard beacon", `${v.unitId} · 1 Hz HMAC-SHA256`),
              kv("Model", cab.specs.model)
            );
            feedHost.innerHTML = "";
            cab.feed.forEach((f) => {
              const cls = f.kind === "you" ? "green" : f.kind === "warn" ? "amber" : f.kind === "easyride" ? "green" : "blue";
              feedHost.append(el(
                "div",
                { class: "card tight" },
                el(
                  "div",
                  { class: "row between" },
                  el("div", { style: "font-weight:600;font-size:13px", text: f.title }),
                  pill(fmtClock(new Date(f.at)), cls)
                ),
                el("div", { class: "tiny muted", style: "margin-top:3px", text: f.detail })
              ));
            });
          };
          const unsub = events.on("driver-telemetry", () => refresh(true));
          return { node, init: () => refresh(true), tick: () => refresh(false), destroy: unsub };
        }
      };
    }
  });

  // js/screens.js
  function routeHead(route2) {
    return el(
      "div",
      { class: "row", style: "gap:12px" },
      modeChip(route2, true),
      el(
        "div",
        { class: "grow" },
        el("h2", { style: "font-size:17px", text: route2.name }),
        el("div", { class: "small muted", text: `${route2.mode === "trolley" ? "trolleybus" : route2.mode} ${route2.number} · ${OPERATOR.name}` })
      )
    );
  }
  function hfStatusLine() {
    const hf = state.prefs.handsFree;
    const d = detection.snapshot();
    if (!hf.enabled) return { cls: "grey", text: "Hands-free paused" };
    if (d.status === "onboard") return { cls: "green", text: "On board — ticket active" };
    if (d.status === "awaiting-confirm") return { cls: "amber", text: "Boarding detected — confirm" };
    if (d.status === "candidate" || d.status === "verifying") return { cls: "amber", text: "Sensor in range — listening" };
    return { cls: "blue", text: "Hands-free armed" };
  }
  function nearestVehicleToUser() {
    let best = null, bd = Infinity;
    for (const v of vehicles()) {
      const d = haversine(detection.position, v);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  }
  function alertRow(a) {
    const route2 = a.route ? routeById(a.route) : null;
    return el(
      "div",
      { class: "card tight" },
      el(
        "div",
        { class: "row", style: "gap:10px" },
        route2 ? modeChip(route2) : el("span", { class: "mode-chip mode-train", text: "ALL" }),
        el(
          "div",
          { class: "grow" },
          el("div", { class: "t", style: "font-weight:600;font-size:13.5px", text: a.title }),
          el("div", { class: "tiny muted", text: a.body })
        ),
        pill(a.level === "bad" ? "disruption" : a.level === "warn" ? "delay" : "info", a.level === "bad" ? "red" : a.level === "warn" ? "amber" : "blue")
      )
    );
  }
  function openVehicleSheet(vehicleId) {
    let vehicle = vehicleById(vehicleId);
    if (!vehicle) return toast({ title: "Vehicle no longer in service", kind: "warn" });
    const d = detection.snapshot();
    const distance = haversine(detection.position, vehicle);
    const inside = d.active?.vehicle?.id === vehicle.id;
    openSheet(({ close: close2 }) => {
      const box = el("div", { class: "vehicle-sheet" });
      const body = el("div");
      const refresh = () => {
        vehicle = vehicleById(vehicleId) || vehicle;
        const cab = cabinFor(vehicle);
        body.innerHTML = "";
        const stopName = vehicle.currentStop || vehicle.orderedStops?.[vehicle.stopIdx]?.[0] || vehicle.route.stops[vehicle.stopIdx]?.[0];
        body.append(
          el(
            "div",
            { class: "row between" },
            el(
              "div",
              {},
              el("div", { class: "tiny muted", text: `${vehicle.route.mode === "trolley" ? "trolleybus" : vehicle.route.mode} ${vehicle.route.number} · ${OPERATOR.name}` }),
              el("div", { style: "font-weight:650", font: "15px", text: `→ ${vehicle.headsign}` })
            ),
            pill(vehicle.delay > 90 ? `+${Math.round(vehicle.delay / 60)} min` : "on time", vehicle.delay > 90 ? "amber" : "green")
          ),
          el("div", { style: "height:8px" }),
          kv("Vehicle", vehicle.id),
          kv("Onboard unit", vehicle.unitId),
          kv("Trip", vehicle.tripId),
          kv("Now", vehicle.dwelling ? `at ${stopName}` : `between ${stopName} and ${vehicle.nextStop}`),
          kv("Next stop", vehicle.nextStop || "terminus"),
          kv("Distance from you", `${Math.round(distance)} m`),
          kv("Crowding (EasyRide)", cab ? `${cab.crowdingPct}% · ${cab.crowding.short} (${cab.onBoard}/${cab.capacity})` : `${vehicle.occupancy}%`),
          kv("Beacon", `BLE 5 · 1 Hz · signed (HMAC-SHA256)`),
          el(
            "div",
            { class: "row", style: "gap:8px;margin-top:12px;flex-wrap:wrap" },
            inside ? el("button", { class: "btn sm", text: "You are on board — open ticket", onclick: () => {
              close2();
              location.hash = "#/tickets";
            } }) : el("button", { class: "btn sm", text: "Walk up and board (simulate)", onclick: async () => {
              detection.walkTo(vehicleId);
              detection.followVehicle(vehicleId);
              toast({ title: `Approaching unit ${vehicle.unitId}`, body: "Hold the phone near the door — the sensor needs a few seconds of steady signal.", kind: "info" });
              close2();
            } }),
            el("button", { class: "btn ghost sm", text: "Follow on map", onclick: () => {
              close2();
              location.hash = "#/map";
              setTimeout(() => events.emit("focus-stop", { lat: vehicle.lat, lon: vehicle.lon }), 80);
            } }),
            el("button", { class: "btn ghost sm", text: "Board without hands-free (manual)", onclick: async () => {
              const res = await registerBoarding({ routeId: vehicle.routeId, direction: vehicle.dir, stopName: stopName || vehicle.route.stops[0][0], vehicleId: vehicle.id, unitId: vehicle.unitId, method: "manual", evidence: [{ source: "manual", detail: "passenger tapped “board” in the app" }], t: now2() });
              close2();
              toast({ title: res.ok ? "Ticket registered manually" : "Could not register", body: res.ok ? `${res.reason}` : res.reason, kind: res.ok ? "ok" : "bad" });
            } }),
            el("button", { class: "btn ghost sm", text: "See driver cabin view", onclick: () => {
              setDriverVehicle(vehicle.id);
              setRole("driver");
              close2();
              location.hash = "#/driver";
            } })
          ),
          el("div", { class: "tiny faint", style: "margin-top:10px", text: "Sensors are simulated in this demo build. See docs/architecture.md for the real BLE/GPS design and for what the operator must install." })
        );
      };
      const timer = setInterval(refresh, 700);
      const wrap = el("div", {}, el("h3", { text: "Vehicle" }), body);
      wrap.addEventListener("pietura:close", () => clearInterval(timer));
      refresh();
      return wrap;
    }, { onClose: () => {
    } });
  }
  function openTopUp() {
    openSheet(({ close: close2 }) => {
      const box = el(
        "div",
        {},
        el("h3", { text: "Top up wallet" }),
        el("div", { class: "small muted", text: `Credit is charged to ${mask(defaultMethod() || { brand: "Visa", last4: "4242" })} and can be used for automatic ticket purchases.` })
      );
      let amount = 10;
      const seg = el("div", { class: "seg", style: "margin:12px 0" });
      TOPUPS.forEach((v) => {
        seg.append(el("button", {
          class: v === 10 ? "on" : "",
          text: eur(v),
          onclick: () => {
            amount = v;
            [...seg.children].forEach((c) => c.classList.toggle("on", c.textContent === eur(v)));
          }
        }));
      });
      const status = el("div", { class: "small", style: "margin-top:8px" });
      const btn = el("button", { class: "btn", text: `Top up ${eur(amount)}` });
      btn.onclick = async () => {
        btn.disabled = true;
        status.textContent = "Contacting DemoPSP…";
        const idem = `topup-${Date.now()}-${amount}`;
        const res = await charge({ amount, method: defaultMethod(), idempotencyKey: idem, description: "Wallet top-up" });
        if (!res.ok) {
          status.textContent = res.message;
          btn.disabled = false;
          return;
        }
        const r = await topUp(amount);
        close2();
        toast({ title: "Wallet topped up", body: `${eur(amount)} added · auth ${res.authCode} · receipt ${r.id}`, kind: "ok" });
      };
      box.append(seg, btn, status);
      return box;
    });
  }
  var STOPS, stopByName, home, routes, routeScreen, stopScreen, mapScreen, tickets, checkout, wallet, receipt, trips, tripScreen, validator, alerts, account, settings, privacy, about, onboarding, screens;
  var init_screens = __esm({
    "js/screens.js"() {
      init_util();
      init_data();
      init_sim();
      init_detection();
      init_store();
      init_store();
      init_payments();
      init_map();
      init_ui();
      init_crypto();
      init_driver();
      init_driver_screens();
      STOPS = buildStopIndex();
      stopByName = (name) => STOPS.find((s) => s.name === name);
      home = {
        title: "EasyRide",
        sub: "Rīga · hands-free tickets",
        tab: "home",
        render() {
          const node = el("div");
          const head = el(
            "div",
            { class: "hero" },
            el("h2", { text: "Where are you heading?" }),
            el("p", { text: "Timetables, live vehicles and tickets that register themselves when you step on board." })
          );
          node.append(head);
          const hfCard = el("div", { class: "card" });
          const hfBody = el("div");
          hfCard.append(hfBody);
          const onboard = el("div", { class: "boarded-banner", hidden: true });
          const ticketHost = el("div");
          const nearTitle = sectionTitle("Departures near you", el("button", { class: "btn-ghost-inline", text: "All routes", onclick: () => location.hash = "#/routes" }));
          const nearStopLine = el("div", { class: "small muted", style: "margin:-4px 2px 8px" });
          const nearHost = el("div", { class: "list" });
          const quick = el(
            "div",
            { class: "quick" },
            el("button", { onclick: () => location.hash = "#/tickets" }, el("b", { text: "Buy a ticket" }), el("span", { text: "90-minute, day, 3/5-day, monthly" })),
            el("button", { onclick: () => location.hash = "#/map" }, el("b", { text: "Live map" }), el("span", { text: "Vehicles, delays, your stop" })),
            el("button", { onclick: () => location.hash = "#/trips" }, el("b", { text: "My trips" }), el("span", { text: "History, receipts, evidence" })),
            el("button", { onclick: () => location.hash = "#/validator" }, el("b", { text: "Inspector mode" }), el("span", { text: "Scan and validate tickets" }))
          );
          const alertsHost = el("div", { class: "list" });
          node.append(
            hfCard,
            onboard,
            ticketHost,
            nearTitle,
            nearStopLine,
            nearHost,
            sectionTitle("Quick actions"),
            quick,
            sectionTitle("Service alerts", el("button", { class: "btn-ghost-inline", text: "All", onclick: () => location.hash = "#/alerts" })),
            alertsHost
          );
          const nearestStop = () => {
            const pos = detection.position;
            let best = null, bd = Infinity;
            for (const s of STOPS) {
              const d = haversine(pos, s);
              if (d < bd) {
                bd = d;
                best = s;
              }
            }
            return { stop: best, distance: bd };
          };
          const refreshNear = () => {
            const { stop, distance } = nearestStop();
            if (!stop) return;
            nearStopLine.textContent = `${stop.name} · ${Math.round(distance)} m away · ${stop.routes.length} route${stop.routes.length > 1 ? "s" : ""}`;
            const deps = departuresForStop(stop.name, 45).slice(0, 5);
            nearHost.innerHTML = "";
            if (!deps.length) {
              nearHost.append(emptyState("No departures in the next 45 minutes", "Night service runs 23:30–05:30 on selected routes."));
              return;
            }
            deps.forEach((d) => nearHost.append(departureRow(d, { onClick: () => openVehicleSheet(d.vehicleId) })));
          };
          const renderTicket = () => {
            expireTickets(now2());
            const tk = currentTicket(now2());
            ticketHost.innerHTML = "";
            if (tk) {
              ticketHost.append(el(
                "div",
                { class: "row between", style: "margin:0 2px 8px" },
                el("div", { class: "badge-hf", html: `${svg(ICON.check, 14)} <span>Active ticket</span>` }),
                el("button", { class: "btn-ghost-inline", text: "Tickets & wallet →", onclick: () => location.hash = "#/tickets" })
              ));
              const card = ticketCard(tk);
              card.style.cursor = "pointer";
              card.addEventListener("click", () => location.hash = "#/tickets");
              ticketHost.append(card);
            }
          };
          const renderHf = () => {
            const hf = state.prefs.handsFree;
            const st = hfStatusLine();
            const d = detection.snapshot();
            hfBody.innerHTML = "";
            hfBody.append(
              el(
                "div",
                { class: "row between" },
                el("div", { class: "row", style: "gap:10px" }, el("span", { html: svg(ICON.signal, 20) }), el(
                  "div",
                  {},
                  el("div", { style: "font-weight:650", text: "Hands-free boarding" }),
                  el("div", { class: "tiny muted", text: hf.enabled ? `auto-buy ${hf.autoBuyProduct === "smart" ? "smart fare" : hf.autoBuyProduct} · cap ${eur(hf.dailyCap)}/day` : "paused — tickets must be registered manually" })
                )),
                el("span", { class: `pill ${st.cls}`, text: st.text })
              ),
              el(
                "div",
                { class: "sensor-strip" },
                el("span", { html: svg(ICON.signal, 15) }),
                el("span", { class: "grow", text: d.vehicle ? `${d.vehicle.unitId} · ${d.vehicle.route.number} → ${d.vehicle.headsign} · ${d.distance != null ? Math.round(d.distance) + " m" : "searching"}${d.rssi != null ? ` · ${d.rssi} dBm` : ""}` : `scanning for onboard units within ${detection.range} m…` })
              ),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:10px;flex-wrap:wrap" },
                el("button", { class: "btn ghost sm", text: hf.enabled ? "Pause hands-free" : "Arm hands-free", onclick: () => {
                  setPref("handsFree.enabled", !hf.enabled);
                  renderHf();
                  toast({ title: hf.enabled ? "Hands-free paused" : "Hands-free armed", body: hf.enabled ? "You will have to register tickets yourself." : "Tickets will register automatically when you board.", kind: hf.enabled ? "warn" : "ok" });
                } }),
                el("button", { class: "btn ghost sm", text: "Settings", onclick: () => location.hash = "#/settings" }),
                el("button", { class: "btn ghost sm", text: "Walk to nearest vehicle (demo)", onclick: () => {
                  const v = nearestVehicleToUser();
                  if (!v) return toast({ title: "No vehicles nearby", body: "Try the live map or move the clock forward.", kind: "warn" });
                  detection.walkTo(v.id);
                  toast({ title: `Approaching ${v.route.number} → ${v.headsign}`, body: `Unit ${v.unitId}. The sensor should register you within a few seconds.`, kind: "info" });
                } })
              )
            );
          };
          const renderOnboard = () => {
            const d = detection.snapshot();
            onboard.hidden = !d.active;
            if (!d.active) return;
            const v = d.active.vehicle;
            onboard.innerHTML = "";
            onboard.append(
              el("h4", {}, el("span", { html: svg(ICON.check, 16) }), ` On board ${v.route.number} → ${v.headsign}`),
              el("p", { text: `Ticket registered automatically at ${fmtClock(new Date(d.active.since))} · unit ${v.unitId} · next stop ${d.vehicle?.nextStop || v.nextStop || "—"}` }),
              el("p", { class: "tiny", text: "Tap to open the live map." })
            );
            onboard.onclick = () => location.hash = "#/map";
          };
          const refreshAlerts = () => {
            alertsHost.innerHTML = "";
            ALERTS.slice(0, 3).forEach((a) => alertsHost.append(alertRow(a)));
          };
          return {
            node,
            tick() {
              tickCountdowns(node, now2());
              refreshNear();
              renderHf();
              renderOnboard();
            },
            init() {
              renderTicket();
              refreshAlerts();
            }
          };
        }
      };
      routes = {
        title: "Routes",
        sub: "Rīgas satiksme · sample network",
        tab: "routes",
        render() {
          let filter = "all";
          let query = "";
          const node = el("div");
          const search = el(
            "div",
            { class: "search" },
            el("span", { html: svg('<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', 18) }),
            el("input", { placeholder: "Search route number, street or terminus…", oninput: (e) => {
              query = e.target.value.toLowerCase();
              draw();
            } })
          );
          const chips = el(
            "div",
            { class: "row", style: "gap:6px;margin:10px 0;flex-wrap:wrap" },
            ...[["all", "All"], ["tram", "Trams"], ["trolley", "Trolleybuses"], ["bus", "Buses"]].map(([id, label]) => el("button", { class: `btn ghost sm ${id === "all" ? "on" : ""}`, text: label, dataset: { f: id }, onclick: (e) => {
              filter = id;
              [...chips.children].forEach((c) => c.classList.toggle("on", c.dataset.f === id));
              draw();
            } }))
          );
          const list = el("div", { class: "list" });
          node.append(el("div", { class: "card tight" }, search, chips), sectionTitle("Sample network", pill("illustrative data", "grey")), list);
          const draw = () => {
            const items = ROUTES.filter((r) => (filter === "all" || r.mode === filter) && (!query || `${r.number} ${r.name} ${r.stops.map((s) => s[0]).join(" ")}`.toLowerCase().includes(query)));
            list.innerHTML = "";
            if (!items.length) return list.append(emptyState("No routes match that search"));
            items.forEach((r) => {
              const deps = departuresForRoute(r.id, 0, 45).slice(0, 1);
              const next = deps[0];
              const live = vehiclesOnRoute(r.id).length;
              list.append(el(
                "button",
                { class: "item", onclick: () => location.hash = `#/route/${r.id}` },
                modeChip(r),
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", text: r.name }),
                  el("div", { class: "s", text: `${live} vehicle${live === 1 ? "" : "s"} running${r.note ? " · service note" : ""}` })
                ),
                el(
                  "div",
                  { class: "r" },
                  el("div", { class: "big-time", text: next ? next.inSec < 45 ? "now" : `${Math.round(next.inSec / 60)} min` : "—" }),
                  el("div", { class: "tiny faint", text: "next" })
                )
              ));
            });
          };
          return { node, init: draw, tick: draw };
        }
      };
      routeScreen = {
        title: (p) => `Route ${routeById(p.id)?.number || ""}`,
        sub: (p) => routeById(p.id)?.name || "",
        tab: "routes",
        render(p) {
          const route2 = routeById(p.id);
          if (!route2) return { node: emptyState("Unknown route") };
          let dir = 0;
          const node = el("div");
          const canvas = el("canvas", { style: "height:230px;width:100%" });
          const mapWrap = el("div", { class: "map-wrap" }, canvas);
          const dirSeg = el(
            "div",
            { class: "seg" },
            el("button", { class: "on", text: `→ ${route2.headsigns[0]}`, onclick: (e) => {
              dir = 0;
              seg(dirSeg, 0);
              redraw();
            } }),
            el("button", { text: `→ ${route2.headsigns[1]}`, onclick: (e) => {
              dir = 1;
              seg(dirSeg, 1);
              redraw();
            } })
          );
          const departuresHost = el("div", { class: "list" });
          const stopsHost = el("div", { class: "card tight" });
          const liveHost = el("div", { class: "list" });
          node.append(
            routeHead(route2),
            el("div", { style: "height:10px" }),
            mapWrap,
            el("div", { style: "height:10px" }),
            el("div", { class: "card tight" }, el("div", { class: "row between" }, el("div", { class: "tiny muted", text: "Direction" }), dirSeg)),
            sectionTitle("Next departures from the terminus"),
            departuresHost,
            sectionTitle("Vehicles on the road now"),
            liveHost,
            sectionTitle("Stops", pill("sample data", "grey")),
            stopsHost,
            el(
              "div",
              { class: "card" },
              el("div", { class: "small muted", text: "Ticketing" }),
              el("div", { style: "font-size:13px;margin-top:4px", text: "A 90-minute ticket must be registered each time you enter a vehicle. With hands-free boarding, that happens automatically via the onboard unit." })
            )
          );
          const map = createMap(canvas, { interactive: true });
          map.fitRoute(route2);
          map.on("select", (hit) => {
            if (hit.kind === "vehicle") openVehicleSheet(hit.id);
            if (hit.kind === "stop") location.hash = `#/stop/${encodeURIComponent(hit.name)}`;
          });
          function seg(container, active) {
            [...container.children].forEach((c, i) => c.classList.toggle("on", i === active));
          }
          const redraw = () => {
            departuresHost.innerHTML = "";
            const deps = departuresForRoute(route2.id, dir, 60).slice(0, 6);
            if (!deps.length) departuresHost.append(emptyState("Service has ended for today", "First departures in the morning around 05:30."));
            deps.forEach((d) => departuresHost.append(el(
              "div",
              { class: "item" },
              el(
                "div",
                { class: "grow" },
                el("div", { class: "t", text: `→ ${d.headsign}` }),
                el("div", { class: "s", text: `scheduled ${fmtClock(new Date(now2() + d.schedIn * 1e3))}${d.delay > 60 ? ` · +${Math.round(d.delay / 60)} min` : ""}` })
              ),
              el("div", { class: "r" }, el("div", { class: `big-time ${d.delay > 90 ? "late" : ""}`, text: d.inSec < 30 ? "now" : `${Math.round(d.inSec / 60)} min` }))
            )));
          };
          const drawStops = () => {
            const vs = vehiclesOnRoute(route2.id);
            stopsHost.innerHTML = "";
            route2.stops.forEach(([name, lat, lon], idx) => {
              const near = vs.filter((v) => v.stopIdx === (dir === 0 ? idx : route2.stops.length - 1 - idx));
              const div = el(
                "div",
                { class: `stopline ${near.length ? "next" : ""}`, style: "cursor:pointer", onclick: () => location.hash = `#/stop/${encodeURIComponent(name)}` },
                el("div", { class: "stop-dot" }),
                el("div", { class: "grow" }, el("div", { class: "t", style: "font-size:13.5px", text: name }), el("div", { class: "tiny faint", text: `${lat.toFixed(4)}, ${lon.toFixed(4)}` })),
                near.length ? pill(`${near.length} here`, "green") : null
              );
              stopsHost.append(div);
            });
          };
          const drawLive = () => {
            const vs = vehiclesOnRoute(route2.id).sort((a, b) => a.distance - b.distance);
            liveHost.innerHTML = "";
            if (!vs.length) liveHost.append(emptyState("No vehicles running on this route at the moment"));
            vs.slice(0, 6).forEach((v) => liveHost.append(el(
              "button",
              { class: "item", onclick: () => {
                map.follow(v.id);
                openVehicleSheet(v.id);
              } },
              modeChip(v.route),
              el(
                "div",
                { class: "grow" },
                el("div", { class: "t", text: `→ ${v.headsign}` }),
                el("div", { class: "s", text: `${v.dwelling ? `at ${v.currentStop || v.route.stops[v.stopIdx][0]}` : `next ${v.nextStop}`} · unit ${v.unitId}` })
              ),
              el(
                "div",
                { class: "r" },
                el("div", { class: "tiny", text: v.delay > 60 ? `+${Math.round(v.delay / 60)} min` : "on time" }),
                el("div", { class: "tiny faint", text: `${v.occupancy}% full` })
              )
            )));
          };
          return {
            node,
            init() {
              redraw();
              drawStops();
              drawLive();
            },
            tick() {
              redraw();
              drawStops();
              drawLive();
              map.render();
            },
            destroy() {
              map.destroy();
            }
          };
        }
      };
      stopScreen = {
        title: (p) => decodeURIComponent(p.name),
        sub: "Departures board",
        tab: "routes",
        render(p) {
          const name = decodeURIComponent(p.name);
          const stop = stopByName(name);
          const node = el("div");
          const host = el("div", { class: "list" });
          const head = el("div", { class: "card" });
          const saved = el("button", { class: "btn ghost sm" });
          const drawHead = () => {
            head.innerHTML = "";
            head.append(
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("h2", { style: "font-size:18px", text: name }),
                  el("div", { class: "small muted", text: stop ? `served by ${stop.routes.map((id) => `route ${routeById(id).number}`).join(", ")}` : "stop" })
                ),
                el(
                  "div",
                  { class: "row", style: "gap:6px" },
                  saved,
                  el("button", { class: "btn ghost sm", text: "On map", onclick: () => {
                    if (stop) {
                      location.hash = "#/map";
                      setTimeout(() => events.emit("focus-stop", stop), 60);
                    }
                  } })
                )
              )
            );
            saved.textContent = state.prefs.savedStops.includes(name) ? "★ Saved" : "☆ Save";
            saved.onclick = () => {
              const on = toggleSavedStop(name);
              toast({ title: on ? `${name} saved` : `${name} removed`, body: on ? "It will show up on your home screen." : "", kind: on ? "ok" : "info" });
              drawHead();
            };
          };
          const fill = () => {
            const deps = departuresForStop(name, 90);
            host.innerHTML = "";
            if (!deps.length) return host.append(emptyState("No departures in the next 90 minutes", "Check the night routes after 23:30."));
            deps.forEach((d) => host.append(departureRow(d, { onClick: () => openVehicleSheet(d.vehicleId) })));
          };
          node.append(
            head,
            sectionTitle("Next departures"),
            host,
            el(
              "div",
              { class: "card" },
              el("div", { class: "small muted", text: "Hands-free at this stop" }),
              el("div", { style: "font-size:13px;margin-top:4px", text: "When a vehicle with an onboard unit stops in front of you, the app registers your ticket automatically — no tapping the validator." })
            )
          );
          return { node, init() {
            drawHead();
            fill();
          }, tick: fill };
        }
      };
      mapScreen = {
        title: "Live map",
        sub: "Vehicles, delays and you",
        tab: "map",
        render() {
          const node = el("div");
          const canvas = el("canvas", { style: "height:58vh;width:100%" });
          const overlay = el("div", { class: "map-overlay" });
          const wrap = el("div", { class: "map-wrap tall" }, canvas, overlay);
          const stats = el("div", { class: "card tight" });
          const list = el("div", { class: "list" });
          const map = createMap(canvas, { interactive: true });
          map.setCenter(56.949, 24.11, 12.6);
          const followChip = el("button", { class: "map-chip", text: "Following: off", onclick: () => {
            map.follow(null);
            updateChips();
          } });
          const youChip = el("button", { class: "map-chip", text: "Center on me", onclick: () => {
            map.follow(null);
            map.setCenter(detection.position.lat, detection.position.lon, 14.5);
          } });
          overlay.append(youChip, followChip);
          map.on("select", (hit) => {
            if (hit.kind === "vehicle") openVehicleSheet(hit.id);
            if (hit.kind === "stop") location.hash = `#/stop/${encodeURIComponent(hit.name)}`;
          });
          events.on("focus-stop", (s) => map.setCenter(s.lat, s.lon, 15.5));
          const updateChips = () => {
            const f = map.following;
            followChip.textContent = f ? `Following ${f.split("-")[0].toUpperCase()}` : "Following: off";
            followChip.classList.toggle("on", !!f);
          };
          const fill = () => {
            const s = fleetStats();
            stats.innerHTML = "";
            stats.append(el(
              "div",
              { class: "row between" },
              el("div", {}, el("div", { style: "font-weight:600", text: `${s.total} vehicles in service` }), el("div", { class: "tiny muted", text: `${s.delayed} running late · ${s.dwelling} at a stop · simulated clock ${fmtClock(new Date(now2()))}` })),
              pill(`${getScale()}× time`, "grey")
            ));
            list.innerHTML = "";
            const near = vehicles().map((v) => ({ v, d: haversine(detection.position, v) })).sort((a, b) => a.d - b.d).slice(0, 8);
            near.forEach(({ v, d }) => list.append(el(
              "button",
              { class: "item", onclick: () => {
                map.follow(v.id);
                map.setCenter(v.lat, v.lon, 15);
                updateChips();
                openVehicleSheet(v.id);
              } },
              modeChip(v.route),
              el(
                "div",
                { class: "grow" },
                el("div", { class: "t", text: `→ ${v.headsign}` }),
                el("div", { class: "s", text: `${v.dwelling ? `at ${v.currentStop || v.route.stops[v.stopIdx][0]}` : `next ${v.nextStop}`} · ${Math.round(d)} m from you` })
              ),
              el("div", { class: "r" }, el("div", { class: "tiny", text: v.delay > 60 ? `+${Math.round(v.delay / 60)} min` : "on time" }), el("div", { class: "tiny faint", text: `${v.occupancy}% full` }))
            )));
          };
          node.append(
            wrap,
            sectionTitle("Closest vehicles"),
            stats,
            list,
            el(
              "div",
              { class: "card" },
              el("div", { class: "small muted", text: "Tap a vehicle for its onboard unit" }),
              el("div", { style: "font-size:13px;margin-top:4px", text: "Every vehicle in this demo broadcasts a signed BLE beacon from a virtual onboard unit. In production those are the operator-installed transponders that make hands-free ticketing possible." })
            )
          );
          return { node, init() {
            fill();
            updateChips();
          }, tick() {
            fill();
            map.render();
            updateChips();
          }, destroy() {
            map.destroy();
          } };
        }
      };
      tickets = {
        title: "Tickets",
        sub: `${OPERATOR.name} · demo payments`,
        tab: "tickets",
        render() {
          const node = el("div");
          const activeHost = el("div");
          const walletHost = el("div", { class: "card" });
          const faresHost = el("div", { class: "list" });
          const invHost = el("div", { class: "list" });
          let qty = 1;
          const drawActive = () => {
            expireTickets(now2());
            const tk = currentTicket(now2());
            activeHost.innerHTML = "";
            if (!tk) {
              activeHost.append(el(
                "div",
                { class: "card" },
                el(
                  "div",
                  { class: "row between" },
                  el("div", {}, el("div", { style: "font-weight:600", text: "No active ticket" }), el("div", { class: "small muted", text: "Buy one below, or let hands-free auto-buy register it on your next boarding." })),
                  pill("idle", "grey")
                )
              ));
              return;
            }
            activeHost.append(ticketCard(tk));
          };
          const drawWallet = () => {
            walletHost.innerHTML = "";
            walletHost.append(
              el(
                "div",
                { class: "row between" },
                el("div", {}, el("div", { class: "tiny muted", text: "Wallet credit" }), el("div", { style: "font-size:24px;font-weight:700", text: eur(state.wallet.balance) })),
                el(
                  "div",
                  { class: "row", style: "gap:6px" },
                  el("button", { class: "btn ghost sm", text: "Top up", onclick: openTopUp }),
                  el("button", { class: "btn ghost sm", text: "Wallet", onclick: () => location.hash = "#/wallet" })
                )
              ),
              el("div", { class: "small muted", style: "margin-top:6px", text: `${mask(defaultMethod() || { brand: "Visa", last4: "4242" })} · spent today ${eur(todaySpend(now2()))} of ${eur(state.prefs.handsFree.dailyCap)} cap` })
            );
          };
          const drawFares = () => {
            faresHost.innerHTML = "";
            FARES.forEach((f) => {
              faresHost.append(el(
                "button",
                { class: "item", onclick: () => location.hash = `#/checkout/${f.id}` },
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", text: f.name }, f.popular ? pill("most popular", "green") : null),
                  el("div", { class: "s", text: f.desc })
                ),
                el("div", { class: "r" }, el("div", { class: "big-time", text: eur(f.price) }), el("div", { class: "tiny faint", text: "one-off" }))
              ));
            });
          };
          const drawInventory = () => {
            const unused = state.tickets.filter((t) => t.status === "unused");
            const expired = state.tickets.filter((t) => t.status === "expired");
            invHost.innerHTML = "";
            invHost.append(el(
              "div",
              { class: "card tight row between" },
              el(
                "div",
                {},
                el("div", { style: "font-weight:600", text: `${unused.length} unused ticket${unused.length === 1 ? "" : "s"} in the wallet` }),
                el("div", { class: "tiny muted", text: "Unused time tickets start counting at their first registration." })
              ),
              el("button", { class: "btn ghost sm", text: "Buy more", onclick: () => node.querySelector(".fare-anchor")?.scrollIntoView({ behavior: "smooth" }) })
            ));
            state.tickets.slice(0, 6).forEach((t) => {
              const f = fareById(t.fareId);
              invHost.append(el(
                "div",
                { class: "item", style: "cursor:default" },
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", text: `${f ? f.name : t.fareId}` }),
                  el("div", { class: "s", text: `${t.status === "unused" ? "not registered yet" : t.status}${t.validTo ? ` · until ${fmtDateTime(new Date(t.validTo))}` : ""} · bought ${fmtDate(new Date(t.purchasedAt))}` })
                ),
                el("div", { class: "r" }, pill(t.status, t.status === "active" ? "green" : t.status === "expired" ? "grey" : "blue"), el("div", { class: "tiny faint", text: t.id }))
              ));
            });
            void expired;
          };
          node.append(
            sectionTitle("Active ticket"),
            activeHost,
            sectionTitle("Wallet"),
            walletHost,
            el("div", { class: "fare-anchor" }),
            sectionTitle("Buy a ticket"),
            faresHost,
            sectionTitle("Your wallet contents"),
            invHost,
            sectionTitle("How registration works"),
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "small", style: "line-height:1.6" },
                el("div", { text: `• A 90-minute ticket covers any tram, trolleybus or bus, but must be registered each time you enter another vehicle — hands-free does it for you.` }),
                el("div", { style: "margin-top:6px", text: "• 24-hour, 3-day, 5-day and monthly tickets start at their first registration and are then continuously valid." }),
                el("div", { style: "margin-top:6px", text: `• Travelling without a registered ticket in Rīga carries a fine of ${eur(OPERATOR.fineRange[0])}–${eur(OPERATOR.fineRange[1])}. The app keeps the evidence for every registration.` }),
                el("div", { style: "margin-top:6px", class: "faint", text: `• Payments here are simulated (DemoPSP). No card details are stored; card numbers are only checked with the Luhn algorithm.` })
              )
            )
          );
          return {
            node,
            init() {
              drawActive();
              drawWallet();
              drawFares();
              drawInventory();
            },
            tick() {
              tickCountdowns(node, now2());
              drawActive();
              drawWallet();
            },
            get qty() {
              return qty;
            },
            set qty(v) {
              qty = v;
            }
          };
        }
      };
      checkout = {
        title: "Checkout",
        sub: "DemoPSP — simulated payment",
        tab: "tickets",
        render(p) {
          const fare = fareById(p.id);
          const node = el("div");
          if (!fare) return { node: emptyState("Unknown fare") };
          let qty = 1;
          const qtyLine = el("div", { class: "row between", style: "margin-top:6px" });
          const summary = el("div", { class: "card" });
          const methodHost = el("div", { class: "card" });
          const status = el("div", { class: "small", style: "margin-top:10px" });
          const payBtn = el("button", { class: "btn", text: "Pay" });
          const renderSummary = () => {
            summary.innerHTML = "";
            summary.append(
              el(
                "div",
                { class: "row between" },
                el("div", {}, el("div", { style: "font-weight:650", text: fare.name }), el("div", { class: "small muted", text: fare.desc })),
                el("div", { class: "big-time", text: eur(fare.price) })
              ),
              el("hr", { class: "sep" }),
              qtyLine,
              el("hr", { class: "sep" }),
              el("div", { class: "row between" }, el("div", { class: "small muted", text: "Total" }), el("div", { style: "font-weight:700;font-size:18px", text: eur(fare.price * qty) })),
              el("div", { class: "tiny faint", style: "margin-top:4px", text: fare.kind === "time" ? `Valid ${fare.minutes >= 1440 ? `${fare.minutes / 1440} day(s)` : `${fare.minutes} minutes`} from first registration.` : "Single trip product." })
            );
            qtyLine.innerHTML = "";
            qtyLine.append(
              el("div", {}, el("div", { style: "font-weight:600", text: "Quantity" }), el("div", { class: "tiny muted", text: "Tickets are stored in your wallet" })),
              el(
                "div",
                { class: "row", style: "gap:8px" },
                el("button", { class: "btn ghost sm", text: "−", onclick: () => {
                  qty = clamp(qty - 1, 1, 10);
                  renderSummary();
                } }),
                el("div", { class: "mono", style: "min-width:22px;text-align:center", text: String(qty) }),
                el("button", { class: "btn ghost sm", text: "+", onclick: () => {
                  qty = clamp(qty + 1, 1, 10);
                  renderSummary();
                } })
              )
            );
            payBtn.textContent = `Pay ${eur(fare.price * qty)}`;
          };
          const renderMethod = () => {
            methodHost.innerHTML = "";
            const m = defaultMethod();
            methodHost.append(
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("div", { class: "tiny muted", text: "Payment method" }),
                  el("div", { style: "font-weight:600", text: m ? mask(m) : "No card yet" }),
                  m ? el("div", { class: "tiny faint", text: `expires ${m.exp}` }) : null
                ),
                el(
                  "div",
                  { class: "row", style: "gap:6px" },
                  el("button", { class: "btn ghost sm", text: m ? "Change" : "Add card", onclick: openCardSheet }),
                  el("button", { class: "btn ghost sm", text: "Demo cards", onclick: openTestCards })
                )
              )
            );
          };
          function openCardSheet() {
            openSheet(({ close: close2 }) => {
              const box = el("div", {}, el("h3", { text: "Add a card" }), el("div", { class: "tiny faint", text: DEMO_NOTICE }));
              const form = el("div", { style: "margin-top:10px" });
              const fields = {};
              const mk = (key, label, placeholder, extra = {}) => {
                const input = el("input", { class: "input", placeholder, ...extra });
                fields[key] = input;
                return el("div", { class: "field" }, el("label", { text: label }), input);
              };
              form.append(
                mk("number", "Card number", "4242 4242 4242 4242", { inputmode: "numeric", oninput: (e) => {
                  e.target.value = e.target.value.replace(/[^\d ]/g, "").slice(0, 19);
                } }),
                el(
                  "div",
                  { class: "row", style: "gap:10px" },
                  el("div", { class: "grow" }, mk("exp", "Expiry", "MM/YY", { oninput: (e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                    e.target.value = v;
                  } })),
                  el("div", { class: "grow" }, mk("cvc", "CVC", "123", { inputmode: "numeric", oninput: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  } }))
                ),
                mk("name", "Name on card", "JĀNIS BĒRZIŅŠ")
              );
              const errors = el("div", { class: "small", style: "color:var(--bad)" });
              const save2 = el("button", { class: "btn", text: "Save card", style: "margin-top:10px" });
              save2.onclick = () => {
                const v = validateCard({ number: fields.number.value, exp: fields.exp.value, cvc: fields.cvc.value, name: fields.name.value });
                errors.textContent = Object.values(v.errors).join(" · ");
                if (!v.ok) return;
                const m = addMethod({ brand: v.brand, last4: v.last4, exp: fields.exp.value });
                if (state.methods.length > 1) {
                  state.methods.forEach((x) => x.isDefault = x.id === m.id);
                  save();
                }
                toast({ title: "Card added", body: `${mask(m)} · stored as a token in this demo only`, kind: "ok" });
                close2();
                renderMethod();
              };
              form.append(errors, save2);
              box.append(form);
              return box;
            });
          }
          function openTestCards() {
            openSheet(({ close: close2 }) => el(
              "div",
              {},
              el("h3", { text: "Demo test cards" }),
              el("div", { class: "tiny faint", text: "Use these numbers to exercise the approved and declined paths." }),
              el("div", { class: "list", style: "margin-top:10px" }, TEST_CARDS.map((c) => el("button", {
                class: "item",
                onclick: async () => {
                  const v = validateCard({ number: c.number, exp: c.exp, cvc: c.cvc, name: "Demo Passenger" });
                  addMethod({ brand: v.brand, last4: v.last4, exp: c.exp });
                  state.methods.forEach((x, i) => x.isDefault = i === state.methods.length - 1);
                  save();
                  close2();
                  renderMethod();
                  toast({ title: `${c.label} added`, body: mask({ brand: v.brand, last4: v.last4 }), kind: "ok" });
                }
              }, el("div", { class: "grow" }, el("div", { class: "t", text: c.label }), el("div", { class: "s mono", text: `${c.number} · ${c.exp}` })), el("div", { class: "r", text: "→" }))))
            ));
          }
          payBtn.onclick = async () => {
            payBtn.disabled = true;
            const original = payBtn.textContent;
            payBtn.textContent = "Authorising…";
            status.textContent = "";
            const method = defaultMethod();
            const idem = `buy-${fare.id}-${qty}-${Date.now()}`;
            const res = await charge({ amount: +(fare.price * qty).toFixed(2), method, idempotencyKey: idem, description: `${qty} × ${fare.name}` });
            if (!res.ok) {
              status.innerHTML = "";
              status.append(el("span", { style: "color:var(--bad)", text: `Declined: ${res.message}` }));
              payBtn.disabled = false;
              payBtn.textContent = original;
              toast({ title: "Payment declined", body: res.message, kind: "bad" });
              return;
            }
            const { receipt: receipt2, tickets: bought } = await purchase(fare.id, qty);
            payBtn.textContent = "Paid ✓";
            status.innerHTML = "";
            status.append(el("span", { style: "color:var(--acc)", text: `Approved · auth ${res.authCode} · receipt ${receipt2.id}` }));
            toast({ title: "Tickets are in your wallet", body: `${bought.length} × ${fare.name} · ${eur(receipt2.total)}`, kind: "ok" });
            setTimeout(() => location.hash = `#/receipt/${receipt2.id}`, 700);
          };
          node.append(
            summary,
            sectionTitle("Payment"),
            methodHost,
            payBtn,
            status,
            el(
              "div",
              { class: "card", style: "margin-top:14px" },
              el("div", { class: "small muted", text: "What you are paying for" }),
              el("div", { style: "font-size:13px;margin-top:4px", text: "Tickets bought here are loaded into the app wallet and registered either by you or automatically by the hands-free service when an onboard unit detects you entering a vehicle." })
            )
          );
          renderSummary();
          renderMethod();
          return { node };
        }
      };
      wallet = {
        title: "Wallet & payments",
        sub: "Balance, cards, receipts",
        tab: "tickets",
        render() {
          const node = el("div");
          const bal = el("div", { class: "card" });
          const methodsHost = el("div", { class: "list" });
          const receiptsHost = el("div", { class: "list" });
          const draw = () => {
            bal.innerHTML = "";
            bal.append(
              el(
                "div",
                { class: "row between" },
                el("div", {}, el("div", { class: "tiny muted", text: "Balance" }), el("div", { style: "font-size:28px;font-weight:700", text: eur(state.wallet.balance) })),
                el("button", { class: "btn sm", text: "Top up", onclick: openTopUp })
              ),
              el("div", { class: "small muted", style: "margin-top:6px", text: `Spent today ${eur(todaySpend(now2()))} · cap ${eur(state.prefs.handsFree.dailyCap)} · total ${eur(state.stats.spend)}` })
            );
            methodsHost.innerHTML = "";
            (state.methods.length ? state.methods : [{ id: "none", brand: "No card yet", last4: "", exp: "" }]).forEach((m) => {
              methodsHost.append(el(
                "div",
                { class: "item", style: "cursor:default" },
                el("div", { class: "grow" }, el("div", { class: "t", text: m.last4 ? mask(m) : m.brand }), el("div", { class: "s", text: m.exp ? `expires ${m.exp}` : "DemoPSP will provision a test card on first payment" })),
                el(
                  "div",
                  { class: "r" },
                  m.isDefault ? pill("default", "green") : null,
                  m.last4 ? el("button", { class: "btn-ghost-inline", text: "Remove", onclick: () => {
                    state.methods = state.methods.filter((x) => x.id !== m.id);
                    if (state.methods[0]) state.methods[0].isDefault = true;
                    save();
                    draw();
                  } }) : null
                )
              ));
            });
            receiptsHost.innerHTML = "";
            if (!state.receipts.length) receiptsHost.append(emptyState("No receipts yet"));
            state.receipts.slice(0, 8).forEach((r) => receiptsHost.append(el(
              "button",
              { class: "item", onclick: () => location.hash = `#/receipt/${r.id}` },
              el(
                "div",
                { class: "grow" },
                el("div", { class: "t", text: r.note || (r.kind === "topup" ? "Wallet top-up" : "Ticket purchase") }),
                el("div", { class: "s", text: `${fmtDateTime(new Date(r.at))} · ${r.method}` })
              ),
              el("div", { class: "r" }, el("div", { class: "big-time", text: eur(r.total) }), el("div", { class: "tiny faint", text: r.id }))
            )));
          };
          node.append(
            sectionTitle("Wallet"),
            bal,
            sectionTitle("Payment methods"),
            methodsHost,
            el("div", { class: "card" }, el("div", { class: "tiny faint", text: DEMO_NOTICE })),
            sectionTitle("Receipts"),
            receiptsHost
          );
          return { node, init: draw, tick: draw };
        }
      };
      receipt = {
        title: "Receipt",
        sub: "DemoPSP",
        tab: "tickets",
        render(p) {
          const r = state.receipts.find((x) => x.id === decodeURIComponent(p.id));
          if (!r) return { node: emptyState("Receipt not found") };
          const node = el("div");
          node.append(
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "row between" },
                el("div", {}, el("h2", { style: "font-size:18px", text: eur(r.total) }), el("div", { class: "small muted", text: r.note || r.kind })),
                pill(r.status === "paid" ? "paid" : r.status, r.status === "paid" ? "green" : "grey")
              ),
              el("hr", { class: "sep" }),
              ...r.items.map((it) => kv(`${it.label} × ${it.qty}`, eur(it.price * it.qty))),
              kv("Total", eur(r.total)),
              kv("Method", r.method),
              kv("Date", fmtDateTime(new Date(r.at))),
              kv("Receipt no.", r.id),
              kv("Integrity hash", `${r.hash.slice(0, 24)}…`),
              el("div", { class: "tiny faint", style: "margin-top:8px", text: "The hash is SHA-256 over the receipt id, total and kind — a toy version of the tamper-evident receipts a real issuer would sign." })
            ),
            el(
              "div",
              { class: "row", style: "gap:8px" },
              el("button", { class: "btn ghost sm", text: "Email me this receipt", onclick: () => toast({ title: "Receipt queued", body: `${r.id} would be emailed in production.`, kind: "info" }) }),
              el("button", { class: "btn ghost sm", text: "Request refund", onclick: async () => {
                const res = await refund({ amount: r.total, reference: r.id, idempotencyKey: `refund-${r.id}` });
                notify("Refund requested", `${eur(res.amount)} — reference ${r.id}. In production this is a PSP refund with an SLA, not an instant credit.`, "info");
                toast({ title: "Refund requested", body: `${eur(res.amount)} · reference ${r.id}`, kind: "ok" });
              } }),
              el("button", { class: "btn ghost sm", text: "Back", onclick: () => history.back() })
            )
          );
          return { node };
        }
      };
      trips = {
        title: "My trips",
        sub: "History with boarding evidence",
        tab: "account",
        render() {
          const node = el("div");
          const stats = el("div", { class: "card" });
          const host = el("div", { class: "list" });
          const draw = () => {
            stats.innerHTML = "";
            const today = state.trips.filter((t) => new Date(t.boardAt).toDateString() === new Date(now2()).toDateString());
            stats.append(el(
              "div",
              { class: "row between" },
              el(
                "div",
                {},
                el("div", { style: "font-weight:600", text: `${today.length} trip${today.length === 1 ? "" : "s"} today` }),
                el("div", { class: "tiny muted", text: `${state.stats.handsFreeBoardings} hands-free boardings · ${state.stats.manualBoardings} manual · ${state.stats.rejectedBeacons} rejected beacons` })
              ),
              pill(eur(state.stats.spend), "green")
            ));
            host.innerHTML = "";
            if (!state.trips.length) host.append(emptyState("No trips recorded yet", "Board a vehicle on the live map to see a trip appear here with its evidence."));
            state.trips.forEach((t) => {
              const route2 = routeById(t.routeId);
              host.append(el(
                "button",
                { class: "item", onclick: () => location.hash = `#/trip/${t.id}` },
                route2 ? modeChip(route2) : el("span", { class: "mode-chip mode-bus", text: "?" }),
                el(
                  "div",
                  { class: "grow" },
                  el("div", { class: "t", text: `${t.boardStop} → ${t.alightStop || "still on board"}` }),
                  el("div", { class: "s", text: `${fmtDateTime(new Date(t.boardAt))} · ${t.fareName}${t.charged ? ` · ${eur(t.charged)}` : " · no charge"}` })
                ),
                el(
                  "div",
                  { class: "r" },
                  pill(t.boardMethod === "hands-free" ? "hands-free" : t.boardMethod, t.boardMethod === "hands-free" ? "green" : "grey"),
                  el("div", { class: "tiny faint", text: t.alightAt ? fmtDuration(t.alightAt - t.boardAt) : "in progress" })
                )
              ));
            });
          };
          node.append(stats, sectionTitle("Trips"), host);
          return { node, init: draw, tick: draw };
        }
      };
      tripScreen = {
        title: "Trip",
        sub: "Boarding evidence",
        tab: "account",
        render(p) {
          const t = state.trips.find((x) => x.id === p.id);
          if (!t) return { node: emptyState("Trip not found") };
          const node = el("div");
          const canvas = el("canvas", { class: "trace" });
          const tk = state.tickets.find((x) => x.id === t.ticketId);
          const route2 = routeById(t.routeId);
          node.append(
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("div", { style: "font-weight:650;font-size:16px", text: `${t.boardStop} → ${t.alightStop || "on board"}` }),
                  el("div", { class: "small muted", text: `${route2 ? `${route2.mode} ${route2.number} · ` : ""}${fmtDateTime(new Date(t.boardAt))}` })
                ),
                pill(t.boardMethod === "hands-free" ? "hands-free" : t.boardMethod, t.boardMethod === "hands-free" ? "green" : "grey")
              ),
              el("div", { style: "height:10px" }),
              canvas,
              el(
                "div",
                { class: "row between", style: "margin-top:8px" },
                el("div", { class: "tiny muted", text: "Cyan = boarding stop · amber = alighting stop" }),
                el("div", { class: "tiny faint", text: t.duration ? "" : "" })
              )
            ),
            el(
              "div",
              { class: "card" },
              kv("Fare used", t.fareName),
              kv("Charged", t.charged ? eur(t.charged) : "no charge — reused existing ticket"),
              kv("Vehicle", t.vehicleId),
              kv("Onboard unit", t.unitId || "—"),
              kv("Board → alight", `${fmtClock(new Date(t.boardAt))} → ${t.alightAt ? fmtClock(new Date(t.alightAt)) : "—"}`),
              kv("Duration", t.alightAt ? fmtDuration(t.alightAt - t.boardAt) : "in progress"),
              kv("Ticket", t.ticketId),
              kv("Receipt", tk?.receiptId || "—")
            ),
            sectionTitle("Why the app registered this boarding"),
            el("div", { class: "card" }, evidenceTimeline(t.boardEvidence?.length ? t.boardEvidence : [{ source: "manual", detail: "registered without sensor evidence" }])),
            el(
              "div",
              { class: "row", style: "gap:8px" },
              el("button", { class: "btn ghost sm", text: "Open ticket", onclick: () => location.hash = "#/tickets" }),
              tk?.receiptId ? el("button", { class: "btn ghost sm", text: "Open receipt", onclick: () => location.hash = `#/receipt/${tk.receiptId}` }) : null,
              el("button", { class: "btn ghost sm", text: "Report an issue", onclick: () => toast({ title: "Issue reported", body: "A support case would be opened with the operator, attaching this evidence bundle.", kind: "info" }) })
            )
          );
          setTimeout(() => {
            try {
              drawTripTrace(canvas, t);
            } catch (e) {
              console.warn(e);
            }
          }, 30);
          return { node };
        }
      };
      validator = {
        title: "Inspector mode",
        sub: "Validate tickets",
        tab: "account",
        render() {
          const node = el("div");
          const resultHost = el("div");
          const camHost = el("div");
          const manual = el("input", { class: "input", placeholder: "Paste an ER1.… token or ticket id" });
          const inspections = [];
          let stream = null, raf = null;
          const showResult = async (token) => {
            resultHost.innerHTML = "";
            const res = await verifyTicketToken(token, now2());
            const holderTicket = state.tickets.find((tk) => tk.id === res.data?.t);
            const box = el("div", { class: `scan-result ${res.ok && res.active ? "valid" : "invalid"}` });
            box.append(
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  { class: "row", style: "gap:8px" },
                  el("span", { html: svg(res.ok && res.active ? ICON.check : ICON.cross, 20) }),
                  el(
                    "div",
                    {},
                    el("div", { style: "font-weight:700", text: res.ok && res.active ? "VALID" : `NOT VALID — ${res.reason.replace(/-/g, " ")}` }),
                    el("div", { class: "tiny muted", text: `signature ${res.ok ? "verified" : "failed"} · checked ${fmtClock(new Date(now2()))}` })
                  )
                ),
                pill(res.ok ? "token ok" : "rejected", res.ok ? "green" : "red")
              )
            );
            if (res.data) {
              box.append(
                el("hr", { class: "sep" }),
                kv("Product", fareById(holderTicket?.fareId)?.name || res.data.p),
                kv("Ticket", res.data.t),
                kv("Holder id", res.data.h),
                kv("Valid from", fmtDateTime(new Date(res.data.f))),
                kv("Valid to", fmtDateTime(new Date(res.data.x))),
                kv("Route registered", res.data.r || "any"),
                kv("Vehicle / unit", res.data.vh || "—"),
                kv("Operator", "Rīgas satiksme (demo issuer)")
              );
            }
            resultHost.append(box);
            inspections.unshift({ token, res });
          };
          const startCam = async () => {
            camHost.innerHTML = "";
            const video = el("video", { playsinline: true, muted: true });
            const reticle = el("div", { class: "scanner-reticle" });
            const hint = el("div", { class: "scanner-hint", text: "Point the camera at the passenger’s QR code" });
            const box = el("div", { class: "scanner-box" }, video, reticle, hint);
            camHost.append(box);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
              video.srcObject = stream;
              await video.play();
              const canvas = document.createElement("canvas");
              const scan = () => {
                if (!stream) return;
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(video, 0, 0);
                  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = window.jsQR?.(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
                  if (code?.data) {
                    hint.textContent = "Code captured ✓";
                    stopCam();
                    showResult(code.data);
                    return;
                  }
                }
                raf = requestAnimationFrame(scan);
              };
              raf = requestAnimationFrame(scan);
            } catch (e) {
              camHost.innerHTML = "";
              camHost.append(el(
                "div",
                { class: "card" },
                el("div", { style: "font-weight:600", text: "Camera unavailable" }),
                el("div", { class: "small muted", text: `${e.name || "Error"}: ${e.message || "permission denied"}. In the sandboxed preview the camera is blocked — use the token field or the simulated inspection below.` })
              ));
            }
          };
          const stopCam = () => {
            cancelAnimationFrame(raf);
            stream?.getTracks().forEach((t) => t.stop());
            stream = null;
            raf = null;
          };
          const inspect = async () => {
            const val = manual.value.trim();
            if (!val) return;
            if (val.startsWith("ER1.") || val.startsWith("PIE1.")) return showResult(val);
            const tk = state.tickets.find((x) => x.id === val);
            if (!tk) return toast({ title: "Unknown code", body: "Not an EasyRide token or a known ticket id.", kind: "warn" });
            showResult(tk.token);
          };
          node.append(
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "row between" },
                el(
                  "div",
                  {},
                  el("div", { style: "font-weight:650", text: "Controller check" }),
                  el("div", { class: "tiny muted", text: "Scan a QR code or paste a token. Validation is offline: the token carries a signed payload." })
                ),
                pill("offline capable", "blue")
              ),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:10px" },
                el("button", { class: "btn sm", text: "Start camera scan", onclick: startCam }),
                el("button", { class: "btn ghost sm", text: "Stop", onclick: stopCam })
              ),
              camHost
            ),
            sectionTitle("Manual entry"),
            el("div", { class: "row", style: "gap:8px" }, el("div", { class: "grow" }, manual), el("button", { class: "btn sm", text: "Check", onclick: inspect })),
            sectionTitle("Result"),
            resultHost,
            sectionTitle("Simulated inspection"),
            el(
              "div",
              { class: "card" },
              el("div", { class: "small muted", text: "Check the ticket this phone is currently holding, or test the anti-fraud path." }),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:10px;flex-wrap:wrap" },
                el("button", { class: "btn ghost sm", text: "Scan my active ticket", onclick: () => {
                  const tk = currentTicket(now2());
                  if (!tk) return toast({ title: "No active ticket on this phone", kind: "warn" });
                  showResult(tk.token);
                } }),
                el("button", { class: "btn ghost sm", text: "Forge a ticket token", onclick: async () => {
                  const tk = currentTicket(now2());
                  const forged = `ER1.${btoa(JSON.stringify({ v: 1, t: "tk_forged", p: "m30", f: now2(), x: now2() + 864e5, h: "attacker" })).replace(/=+$/, "")}.${(tk?.token || "x").split(".")[2]}`;
                  toast({ title: "Forged token rejected", body: "The signature does not match the payload, so the inspector sees INVALID.", kind: "bad" });
                  showResult(forged);
                } }),
                el("button", { class: "btn ghost sm", text: "Inspect a spoofed beacon", onclick: async () => {
                  const v = vehicles()[0];
                  if (!v) return;
                  const fake = await beaconFor(v, { spoof: true });
                  const verdict = await verifyBeacon(fake, { nonces: /* @__PURE__ */ new Set(), counters: /* @__PURE__ */ new Map() }, now2());
                  toast({ title: `Beacon rejected: ${verdict.reason}`, body: "A cloned beacon cannot register a ticket — signature check fails.", kind: "bad" });
                } })
              )
            ),
            el(
              "div",
              { class: "card" },
              el("div", { class: "small muted", text: "How inspectors would use this" }),
              el("div", { style: "font-size:13px;margin-top:4px", text: "A controller app validates the signed token against the issuer’s public key without a network round-trip. Online checks (used for refunds and disputes) reconcile against the trip ledger kept by the operator." })
            )
          );
          return { node, destroy() {
            stopCam();
          } };
        }
      };
      alerts = {
        title: "Service alerts",
        sub: "Disruptions and notifications",
        tab: "home",
        render() {
          const node = el("div");
          const mine = el("div", { class: "list" });
          const feed = el("div", { class: "list" });
          ALERTS.forEach((a) => feed.append(alertRow(a)));
          state.notifications.slice(0, 20).forEach((n) => mine.append(el(
            "div",
            { class: "card tight" },
            el(
              "div",
              { class: "row between" },
              el("div", {}, el("div", { style: "font-weight:600;font-size:13.5px", text: n.title }), el("div", { class: "tiny muted", text: n.body })),
              el("div", { class: "tiny faint", text: fmtClock(new Date(n.at)) })
            )
          )));
          if (!state.notifications.length) mine.append(emptyState("No personal notifications yet"));
          node.append(
            sectionTitle("Your notifications", el("button", { class: "btn-ghost-inline", text: "Mark all read", onclick: () => {
              markNotificationsRead();
              toast({ title: "All notifications marked read", kind: "info" });
            } })),
            mine,
            sectionTitle("Network alerts"),
            feed
          );
          return { node };
        }
      };
      account = {
        title: "Account",
        sub: "Profile, stats and data",
        tab: "account",
        render() {
          const node = el("div");
          const stats = state.stats;
          const links = [
            ["Switch interface (Passenger / Driver)", "Choose passenger app or bus driver cabin view", "#/start"],
            ["Bus driver console", "Live passenger count, tickets, route & crowding", "#/driver"],
            ["My trips", "History, evidence, receipts", "#/trips"],
            ["Wallet & receipts", `${eur(state.wallet.balance)} balance`, "#/wallet"],
            ["Tickets", "Buy and manage tickets", "#/tickets"],
            ["Inspector mode", "Validate a ticket", "#/validator"],
            ["Hands-free settings", "Sensors, auto-buy, limits", "#/settings"],
            ["Data & privacy", "Export or delete your data", "#/privacy"],
            ["Service alerts", `${state.notifications.length} notifications`, "#/alerts"],
            ["About this build", "What is real and what is simulated", "#/about"]
          ];
          node.append(
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "row", style: "gap:12px" },
                el("div", { style: "width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#4ade80,#22d3ee);display:grid;place-items:center;color:#06131c;font-weight:800", text: "DP" }),
                el("div", {}, el("div", { style: "font-weight:650", text: state.profile.name }), el("div", { class: "tiny muted", text: `Holder ID ${state.profile.holderId} · demo account` }))
              ),
              el("hr", { class: "sep" }),
              el(
                "div",
                { class: "row between" },
                el("div", { class: "center grow" }, el("div", { style: "font-weight:700;font-size:17px", text: String(stats.handsFreeBoardings) }), el("div", { class: "tiny muted", text: "hands-free" })),
                el("div", { class: "center grow" }, el("div", { style: "font-weight:700;font-size:17px", text: String(stats.manualBoardings) }), el("div", { class: "tiny muted", text: "manual" })),
                el("div", { class: "center grow" }, el("div", { style: "font-weight:700;font-size:17px", text: String(stats.rejectedBeacons) }), el("div", { class: "tiny muted", text: "beacons blocked" })),
                el("div", { class: "center grow" }, el("div", { style: "font-weight:700;font-size:17px", text: eur(stats.spend) }), el("div", { class: "tiny muted", text: "spent" }))
              )
            ),
            sectionTitle("Manage")
          );
          links.forEach(([t, s, href]) => node.append(el(
            "button",
            { class: "item", onclick: () => location.hash = href },
            el("div", { class: "grow" }, el("div", { class: "t", text: t }), el("div", { class: "s", text: s })),
            el("div", { class: "r", text: "→" })
          )));
          return { node };
        }
      };
      settings = {
        title: "Hands-free settings",
        sub: "Sensors, fares, limits",
        tab: "account",
        render() {
          const node = el("div");
          const hf = () => state.prefs.handsFree;
          const sw = (label, path, hint) => {
            const input = el("input", { type: "checkbox" });
            input.checked = !!path.get();
            input.onchange = () => {
              path.set(input.checked);
              toast({ title: `${label}: ${input.checked ? "on" : "off"}`, kind: "info" });
            };
            return el("label", { class: "switch" }, input, el("span", {}, label, hint ? el("span", { class: "tiny faint", text: ` — ${hint}` }) : null));
          };
          const get = (p) => () => p.split(".").reduce((o, k) => o[k], state.prefs);
          const set = (p) => (v) => setPref(p, v);
          const segRow = (label, options, path) => {
            const seg = el("div", { class: "seg" });
            options.forEach(([val, text]) => seg.append(el("button", {
              class: get(path)() === val ? "on" : "",
              text,
              onclick: (e) => {
                set(path)(val);
                [...seg.children].forEach((c) => c.classList.toggle("on", c === e.target));
              }
            })));
            return el("div", { class: "c-row" }, el("span", { class: "c-label", text: label }), seg);
          };
          node.append(
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Automatic registration" }),
              sw("Hands-free boarding enabled", { get: get("handsFree.enabled"), set: set("handsFree.enabled") }),
              segRow("When a boarding is detected", [["silent", "Register silently"], ["ping", "Notify me"], ["confirm", "Ask me first"]], "handsFree.mode"),
              el("div", { class: "tiny muted", style: "margin-top:4px", text: "“Ask me first” shows a confirmation banner for 10 seconds before registering." })
            ),
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Fares & limits" }),
              segRow("Auto-buy product", [["smart", "Smart"], ["t90", "90 min"], ["d1", "24 h"], ["none", "Never"]], "handsFree.autoBuyProduct"),
              el(
                "div",
                { class: "c-row" },
                el("span", { class: "c-label", text: "Daily cap" }),
                (() => {
                  const sel = el("select", { class: "input", style: "width:auto" });
                  [6, 8, 10, 12, 20, 30].forEach((v) => sel.append(el("option", { value: String(v), selected: v === state.prefs.handsFree.dailyCap ? "selected" : null, text: eur(v) })));
                  sel.onchange = () => {
                    setPref("handsFree.dailyCap", +sel.value);
                    toast({ title: `Daily cap set to ${eur(+sel.value)}`, kind: "info" });
                  };
                  return sel;
                })()
              ),
              sw(
                "Auto-buy when the wallet is empty",
                { get: get("handsFree.autoBuy"), set: set("handsFree.autoBuy") },
                "smart picks a 24-hour ticket from your third boarding of the day"
              )
            ),
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Sensors" }),
              sw("BLE onboard-unit scan", { get: get("handsFree.sensors.ble"), set: set("handsFree.sensors.ble") }, "signed beacons from the vehicle"),
              sw("Location (geofence confirm)", { get: get("handsFree.sensors.gps"), set: set("handsFree.sensors.gps") }, "second source for anti-fraud"),
              sw("NFC tap fallback", { get: get("handsFree.sensors.nfc"), set: set("handsFree.sensors.nfc") }, "for phones where BLE is restricted"),
              sw("Require two sources before charging me", { get: get("handsFree.requireSecondSource"), set: set("handsFree.requireSecondSource") }),
              el(
                "div",
                { class: "c-row" },
                el("span", { class: "c-label", text: "Signal threshold" }),
                (() => {
                  const out = el("output", { class: "mono tiny", text: `${hf().rssiThreshold} dBm` });
                  const r = el("input", { type: "range", min: "-95", max: "-65", step: "1", value: String(hf().rssiThreshold) });
                  r.oninput = () => {
                    out.textContent = `${r.value} dBm`;
                  };
                  r.onchange = () => setPref("handsFree.rssiThreshold", +r.value);
                  return el("div", { class: "row grow", style: "gap:8px" }, r, out);
                })()
              ),
              el(
                "div",
                { class: "c-row" },
                el("span", { class: "c-label", text: "Dwell time" }),
                (() => {
                  const out = el("output", { class: "mono tiny", text: `${(hf().dwellMs / 1e3).toFixed(1)} s` });
                  const r = el("input", { type: "range", min: "1000", max: "8000", step: "500", value: String(hf().dwellMs) });
                  r.oninput = () => {
                    out.textContent = `${(r.value / 1e3).toFixed(1)} s`;
                  };
                  r.onchange = () => setPref("handsFree.dwellMs", +r.value);
                  return el("div", { class: "row grow", style: "gap:8px" }, r, out);
                })()
              )
            ),
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Notifications" }),
              sw("Ticket and boarding notifications", { get: get("notifications"), set: set("notifications") }),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:8px" },
                el("button", { class: "btn ghost sm", text: "Test browser notification", onclick: async () => {
                  if (!("Notification" in window)) return toast({ title: "Not supported here", body: "The preview iframe blocks notifications; the in-app banner still works.", kind: "warn" });
                  try {
                    const perm = await Notification.requestPermission();
                    if (perm === "granted") new Notification("EasyRide", { body: "Hands-free ticketing is armed." });
                    else toast({ title: "Permission not granted", kind: "warn" });
                  } catch (e) {
                    toast({ title: "Blocked in this context", body: String(e.message || e), kind: "warn" });
                  }
                } })
              )
            ),
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Saved stops" }),
              el("div", { class: "small muted", style: "margin-top:4px", text: state.prefs.savedStops.join(" · ") || "none yet" }),
              el("div", { class: "tiny faint", style: "margin-top:4px", text: "Saved stops drive the “departures near you” list on the home screen." })
            )
          );
          return { node };
        }
      };
      privacy = {
        title: "Data & privacy",
        sub: "What this app keeps",
        tab: "account",
        render() {
          const node = el("div");
          const dump = () => JSON.stringify({ profile: state.profile, prefs: state.prefs, tickets: state.tickets, trips: state.trips, receipts: state.receipts }, null, 2);
          node.append(
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "Design principles" }),
              el(
                "div",
                { class: "small", style: "line-height:1.6;margin-top:6px" },
                el("div", { text: "• Boarding detection is on-device: beacons are checked locally, so a ticket registers even with no network." }),
                el("div", { style: "margin-top:6px", text: "• Only the trip summary (route, vehicle, stop, time) is uploaded — no continuous location trail. The demo keeps everything in your browser’s localStorage." }),
                el("div", { style: "margin-top:6px", text: "• Paying requires no card data on the device: the PSP returns a token, and the app only stores brand, last four digits and expiry." }),
                el("div", { style: "margin-top:6px", text: "• Deleting your data removes the wallet, trips, receipts and preferences immediately. A production build also has to honour the operator’s retention rules for accounting." })
              )
            ),
            el(
              "div",
              { class: "row", style: "gap:8px" },
              el("button", { class: "btn ghost sm", text: "Export my data (JSON)", onclick: () => {
                const blob = new Blob([dump()], { type: "application/json" });
                const a = el("a", { href: URL.createObjectURL(blob), download: `easyride-export-${Date.now()}.json` });
                document.body.append(a);
                a.click();
                a.remove();
                toast({ title: "Export started", body: "A JSON file with your demo data is downloading.", kind: "ok" });
              } }),
              el("button", { class: "btn danger sm", text: "Delete everything", onclick: async () => {
                const { askConfirm: askConfirm2 } = await Promise.resolve().then(() => (init_app(), app_exports));
                const yes = await askConfirm2("Delete all your data?", "Wallet, tickets, trips, receipts and preferences in this browser will be removed.");
                if (!yes) return;
                resetAll();
                location.hash = "#/onboarding";
              } })
            ),
            el(
              "div",
              { class: "card", style: "margin-top:12px" },
              el("div", { class: "tiny faint", text: "Demo build: data lives only in this browser. Nothing is sent to a server, and there is no real payment or operator integration." })
            ),
            !storageAvailable ? el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:600;font-size:13.5px", text: "Storage is blocked in this context" }),
              el("div", { class: "small muted", style: "margin-top:4px", text: "This preview runs in a sandboxed frame without storage access, so the wallet, tickets and trips live in memory for this session only. Open the file directly (or deploy it) and everything persists across reloads." })
            ) : null
          );
          return { node };
        }
      };
      about = {
        title: "About this build",
        sub: "Real vs simulated",
        tab: "account",
        render() {
          const node = el("div");
          const rows = [
            ["Timetables and live map", "Simulated fleet over a hand-made sample network inspired by Rīgas satiksme routes. Real product: GTFS + GTFS-RT from the operator."],
            ["Onboard units & beacons", "Virtual ACUs that broadcast signed BLE payloads. Real product: transponders installed in vehicles, or the operator’s existing ticketing API."],
            ["Boarding detection", "Real logic (signature check, freshness, anti-replay, dwell time, two-source confirmation) running against simulated signals."],
            ["Payments", "DemoPSP: Luhn-checked card numbers, idempotency keys, auth codes, declines and refunds — no money moves, no card data leaves the device."],
            ["Tickets", "Signed tokens (HMAC-SHA256 in the demo) rendered as real QR codes, validated offline by the inspector screen."],
            ["Fares", "Amounts mirror the public Rīgas satiksme tariff for realism; always confirm current prices with the operator."]
          ];
          node.append(
            el(
              "div",
              { class: "card" },
              el("div", { style: "font-weight:650", text: "EasyRide — hands-free public transport ticketing" }),
              el("div", { class: "small muted", style: "margin-top:6px", text: "A prototype of the “walk on, ride, walk off” experience: no tapping, no queueing, no fumbling for a card." })
            ),
            sectionTitle("What is real and what is simulated"),
            el("div", { class: "card" }, rows.map(([k, v]) => el(
              "div",
              { style: "margin-bottom:10px" },
              el("div", { style: "font-weight:600;font-size:13.5px", text: k }),
              el("div", { class: "small muted", text: v })
            ))),
            sectionTitle("Next steps for a real pilot"),
            el(
              "div",
              { class: "card" },
              el(
                "div",
                { class: "small", style: "line-height:1.6" },
                el("div", { text: "1. Reuse the operator’s existing onboard hardware (Rīgas satiksme vehicles already carry validators and GPS/AVL units)." }),
                el("div", { style: "margin-top:6px", text: "2. Agree the fare rules that hands-free ticketing must respect, including the per-vehicle re-registration rule for 90-minute tickets." }),
                el("div", { style: "margin-top:6px", text: "3. Move token issuing and charging to a server, ideally through an existing ticketing provider or PSP." }),
                el("div", { style: "margin-top:6px", text: "4. Onboard native app needed for reliable background BLE scanning; a PWA can only do fore-fround scanning." })
              ),
              el("div", { class: "tiny faint", style: "margin-top:8px", text: "See docs/architecture.md in the project workspace for the full design, security model and open questions for the operator." })
            )
          );
          return { node };
        }
      };
      onboarding = {
        title: "Welcome",
        sub: "Set-up takes a minute",
        tab: null,
        render() {
          const node = el("div");
          let step = 0;
          const body = el("div");
          const dots = el("div", { class: "row", style: "justify-content:center;gap:6px;margin:12px 0" });
          const next = el("button", { class: "btn", text: "Continue" });
          const steps = [
            () => el(
              "div",
              { class: "card" },
              el("h2", { style: "font-size:20px", text: "Walk on. Ride. Walk off." }),
              el(
                "div",
                { class: "small muted", style: "margin-top:8px;line-height:1.6" },
                el("div", { text: "EasyRide brings Riga timetables, live vehicles and tickets together — and registers your ticket automatically when the onboard sensor in the vehicle sees your phone enter." }),
                el("div", { style: "margin-top:8px", text: "No tapping a validator, no queue at the driver, no ticket bought under pressure at the door." }),
                el("div", { class: "tiny faint", style: "margin-top:10px", text: "This build is a demonstration: sensors and payments are simulated. Every screen still works end to end." })
              )
            ),
            () => el(
              "div",
              { class: "card" },
              el("h2", { style: "font-size:18px", text: "Permissions for hands-free boarding" }),
              el("div", { class: "small muted", style: "margin-top:6px", text: "The demo asks for these three things. In a native build they are real OS permissions." }),
              ["Bluetooth (scan for onboard units)", "Location (only while boarding — used to confirm you are at the vehicle)", "Notifications (ticket registered, delays on your route)"].map((t) => el("label", { class: "switch" }, el("input", { type: "checkbox", checked: "checked" }), el("span", { text: t }))),
              el("div", { class: "tiny faint", text: "Location is never tracked continuously in this build; the app only checks proximity at the moment of boarding." })
            ),
            () => el(
              "div",
              { class: "card" },
              el("h2", { style: "font-size:18px", text: "Fare wallet and spending limit" }),
              el("div", { class: "small muted", style: "margin-top:6px", text: "Hands-free works best with a small credit balance so the app can buy the right ticket the moment you board." }),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:10px" },
                el("button", { class: "btn ghost sm", text: "Add €10 (demo)", onclick: async (e) => {
                  await topUp(10);
                  e.target.disabled = true;
                  e.target.textContent = "Added ✓";
                } }),
                el("button", { class: "btn ghost sm", text: "Skip for now", onclick: () => toast({ title: "You can top up later", body: "Auto-buy will ask you to add credit when it is needed.", kind: "info" }) })
              ),
              el("div", { class: "tiny faint", style: "margin-top:8px", text: `Default cap: €${state.prefs.handsFree.dailyCap.toFixed(2)} per day, configurable in settings.` })
            ),
            () => el(
              "div",
              { class: "card" },
              el("h2", { style: "font-size:18px", text: "You are set" }),
              el("div", { class: "small muted", style: "margin-top:6px", text: "Try this loop: open the live map, tap a vehicle, and walk up to it. The sensor will register a ticket in a couple of seconds." }),
              el(
                "div",
                { class: "row", style: "gap:8px;margin-top:10px" },
                el("button", { class: "btn ghost sm", text: "Open the live map", onclick: () => {
                  finish();
                  location.hash = "#/map";
                } })
              )
            )
          ];
          const draw = () => {
            body.innerHTML = "";
            body.append(steps[step]());
            dots.innerHTML = "";
            steps.forEach((_, i) => dots.append(el("span", { style: `width:7px;height:7px;border-radius:50%;background:${i === step ? "var(--acc)" : "#2c3d5e"}` })));
            next.textContent = step === steps.length - 1 ? "Start using EasyRide" : "Continue";
          };
          const finish = () => {
            state.onboarded = true;
            state.role = "passenger";
            save();
          };
          next.onclick = () => {
            if (step < steps.length - 1) {
              step++;
              draw();
            } else {
              finish();
              location.hash = "#/home";
            }
          };
          node.append(
            body,
            dots,
            next,
            el("button", { class: "btn ghost", style: "margin-top:8px", text: "Skip set-up", onclick: () => {
              finish();
              location.hash = "#/home";
            } }),
            el("button", { class: "btn ghost", style: "margin-top:8px", text: "← Back to role selection (Passenger / Driver)", onclick: () => {
              location.hash = "#/start";
            } })
          );
          draw();
          return { node };
        }
      };
      screens = {
        start: startScreen,
        driver: driverCockpit,
        "driver-map": driverMap,
        "driver-route": driverRoute,
        "driver-tickets": driverTickets,
        home,
        routes,
        route: routeScreen,
        stop: stopScreen,
        map: mapScreen,
        tickets,
        checkout,
        wallet,
        receipt,
        trips,
        trip: tripScreen,
        validator,
        alerts,
        account,
        settings,
        privacy,
        about,
        onboarding
      };
    }
  });

  // js/app.js
  var app_exports = {};
  __export(app_exports, {
    askConfirm: () => askConfirm,
    navigate: () => navigate,
    route: () => route,
    updateHeaderBadges: () => updateHeaderBadges
  });
  function setHash(hash) {
    try {
      location.hash = hash;
    } catch (e) {
      console.warn("hash navigation failed", e);
    }
  }
  function replaceHash(hash) {
    try {
      history.replaceState(null, "", hash);
    } catch {
      setHash(hash);
    }
  }
  function defaultScreenName() {
    if (!state.role) return "start";
    if (state.role === "driver") return "driver";
    return state.onboarded ? "home" : "onboarding";
  }
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [pathPart, queryPart] = raw.split("?");
    const segments = pathPart.split("/").filter(Boolean).map(decodeURIComponent);
    const name = segments[0] || defaultScreenName();
    const query = Object.fromEntries(new URLSearchParams(queryPart || ""));
    const params = { id: segments[1] || null, name: segments[1] || null, query };
    return { name, params, depth: segments.length };
  }
  function navigate(hash, { replace = false } = {}) {
    if (replace) replaceHash(hash);
    else setHash(hash);
    if (replace) route();
  }
  function route() {
    const { name, params, depth } = parseHash();
    if (name === "home" && !state.onboarded) return navigate("#/onboarding", { replace: true });
    const screen = screens[name];
    if (!screen) {
      toast({ title: `Unknown screen “${name}”`, kind: "warn" });
      return navigate("#/start", { replace: true });
    }
    const isDriverScreen = screen.role === "driver";
    const isNeutralScreen = screen.role === "neutral";
    if (isDriverScreen && state.role !== "driver") setRole("driver");
    else if (!isDriverScreen && !isNeutralScreen && name !== "onboarding" && state.role !== "passenger") {
      setRole("passenger");
    }
    try {
      current.instance?.destroy?.();
    } catch (e) {
      console.warn("screen destroy failed", e);
    }
    current = { name, screen, params, instance: null };
    header.title.textContent = typeof screen.title === "function" ? screen.title(params) : screen.title;
    header.sub.textContent = typeof screen.sub === "function" ? screen.sub(params) : screen.sub || "";
    header.back.hidden = depth < 2;
    const passengerTabs = $("#tabbar");
    const driverTabs = $("#driver-tabbar");
    if (isDriverScreen) {
      passengerTabs.style.display = "none";
      driverTabs.hidden = false;
      driverTabs.style.display = "";
      document.querySelectorAll("#driver-tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === screen.tab));
    } else {
      driverTabs.hidden = true;
      driverTabs.style.display = "none";
      passengerTabs.style.display = screen.tab === null ? "none" : "";
      document.querySelectorAll("#tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === screen.tab));
    }
    const roleBtn = $("#btn-role-switch");
    if (roleBtn) {
      roleBtn.hidden = isNeutralScreen;
      roleBtn.textContent = isDriverScreen ? "⇄ Passenger" : "⇄ Driver";
      roleBtn.title = isDriverScreen ? "Switch to Passenger view" : "Switch to Bus Driver view";
    }
    const quickTicketBtn = $("#btn-ticket-quick");
    if (quickTicketBtn) quickTicketBtn.hidden = isDriverScreen || isNeutralScreen;
    const alertsBtn = $("#btn-alerts");
    if (alertsBtn) alertsBtn.hidden = isNeutralScreen;
    if (isDriverScreen || isNeutralScreen) banner.hidden = true;
    screenHost.innerHTML = "";
    try {
      const inst = screen.render(params) || { node: document.createTextNode("") };
      current.instance = inst;
      screenHost.append(inst.node);
      screenHost.scrollTop = 0;
      inst.init?.();
      inst.tick?.();
    } catch (e) {
      console.error(`screen “${name}” failed to render`, e);
      screenHost.innerHTML = "";
      const card = document.createElement("div");
      card.className = "card";
      const h = document.createElement("div");
      h.style.fontWeight = "650";
      h.textContent = `This screen hit a problem`;
      const p = document.createElement("div");
      p.className = "small muted";
      p.style.marginTop = "6px";
      p.textContent = String(e && e.message || e);
      const back = document.createElement("button");
      back.className = "btn ghost sm";
      back.style.marginTop = "10px";
      back.textContent = "Back to start";
      back.onclick = () => navigate("#/start");
      card.append(h, p, back);
      screenHost.append(card);
    }
    updateHeaderBadges();
  }
  function updateHeaderBadges() {
    const unread = state.notifications.some((n) => !n.read);
    $("#alerts-dot").hidden = !unread;
    $("#ticket-dot").hidden = !currentTicket(now2());
  }
  function renderBanner(d) {
    clearTimeout(confirmTimer);
    if (current.screen?.role === "driver" || current.screen?.role === "neutral") {
      banner.hidden = true;
      return;
    }
    if (d.status === "awaiting-confirm" && d.vehicle) {
      const v = d.vehicle;
      banner.hidden = false;
      banner.innerHTML = "";
      banner.append(
        document.createElement("h4"),
        document.createElement("p")
      );
      banner.querySelector("h4").textContent = `Boarding detected — ${v.route.number} → ${v.headsign}`;
      banner.querySelector("p").textContent = `Unit ${v.unitId} · ${Math.round(d.distance)} m · register your ticket?`;
      const row = document.createElement("div");
      row.className = "row";
      row.style.cssText = "gap:8px;margin-top:10px";
      const yes = document.createElement("button");
      yes.className = "btn sm";
      yes.textContent = "Register ticket";
      yes.onclick = async () => {
        await detection.confirmBoarding();
        banner.hidden = true;
      };
      const no = document.createElement("button");
      no.className = "btn ghost sm";
      no.textContent = "Not me";
      no.onclick = () => {
        detection.declineBoarding();
        banner.hidden = true;
      };
      row.append(yes, no);
      banner.append(row);
      confirmTimer = setTimeout(() => {
        if (detection.status === "awaiting-confirm") {
          detection.declineBoarding("confirmation timed out");
          banner.hidden = true;
          toast({ title: "Boarding not confirmed", body: "No ticket was registered. Tap a vehicle on the map to try again.", kind: "warn" });
        }
      }, 1e4);
      return;
    }
    if (d.status === "onboard" && d.active) {
      const v = d.active.vehicle;
      banner.hidden = false;
      banner.innerHTML = "";
      const h = document.createElement("h4");
      h.textContent = `Ticket registered — ${v.route.number} → ${v.headsign}`;
      const p = document.createElement("p");
      p.textContent = `Automatic registration at ${fmtClock(new Date(d.active.since))} · unit ${v.unitId} · tap for the QR code`;
      banner.append(h, p);
      banner.onclick = () => {
        banner.hidden = true;
        navigate("#/tickets");
      };
      return;
    }
    banner.hidden = true;
  }
  function loop() {
    try {
      if (simRunning) tick();
      const t = performance.now();
      current.instance?.tick?.();
      if (t - lastRouteRefresh > 1e3) {
        lastRouteRefresh = t;
        updateHeaderBadges();
      }
      renderConsole();
    } catch (e) {
      console.error("frame error (recovered)", e);
    }
    requestAnimationFrame(loop);
  }
  function pushLog(level, msg) {
    consoleLog.unshift({ at: now2(), level, msg });
    if (consoleLog.length > 200) consoleLog.pop();
    logHost.innerHTML = "";
    consoleLog.slice(0, 40).forEach((l) => {
      const div = document.createElement("div");
      div.className = `ev ${level}`;
      const time = document.createElement("time");
      time.textContent = fmtClock(new Date(l.at));
      const span = document.createElement("span");
      span.textContent = l.msg;
      div.append(time, span);
      logHost.append(div);
    });
  }
  async function renderConsole() {
    const clock2 = new Date(now2());
    $("#sim-clock").textContent = `${clock2.toLocaleDateString("en-GB")} ${fmtClock(clock2)} · ${getScale()}× · ${fleetStats().total} vehicles`;
    const now3 = performance.now();
    if (now3 - unitCheckAt < 1500) return;
    unitCheckAt = now3;
    const near = nearestToUser();
    const card = $("#unit-card");
    if (!near) {
      card.textContent = "No vehicle in range.";
      lastUnitSig = "";
      return;
    }
    const { vehicle, distance } = near;
    const sig = `${vehicle.id}|${Math.round(distance)}|${vehicle.stopIdx}`;
    if (sig === lastUnitSig) return;
    lastUnitSig = sig;
    const beacon = await beaconFor(vehicle);
    const verdict = await verifyBeacon(beacon, { nonces: /* @__PURE__ */ new Set(), counters: /* @__PURE__ */ new Map() }, now2());
    const rssi = Math.round(Math.max(-99, -59 - 20 * Math.log10(Math.max(1, distance))));
    card.innerHTML = "";
    const lines = [
      [`unit`, vehicle.unitId],
      [`route`, `${vehicle.route.number} → ${vehicle.headsign}`],
      [`trip`, vehicle.tripId],
      [`stop seq`, String(beacon.stopSeq)],
      [`counter`, String(beacon.counter)],
      [`distance`, `${Math.round(distance)} m · ${rssi} dBm`],
      [`signature`, verdict.ok ? `${beacon.algorithm} ✓ verified` : `✗ ${verdict.reason}`],
      [`payload`, `${beacon.payload.slice(0, 46)}…`]
    ];
    lines.forEach(([k, v]) => {
      const div = document.createElement("div");
      const lbl = document.createElement("span");
      lbl.style.color = "#6b7ba0";
      lbl.textContent = `${k.padEnd(9, " ")} `;
      const val = document.createElement("b");
      val.textContent = String(v);
      div.append(lbl, val);
      card.append(div);
    });
  }
  function nearestToUser() {
    if (current.screen?.role === "driver") {
      const dv = getDriverVehicle();
      if (dv) return { vehicle: dv, distance: 1 };
    }
    let best = null, bd = Infinity;
    for (const v of vehicles()) {
      const d = Math.hypot((v.lat - detection.position.lat) * 111320, (v.lon - detection.position.lon) * 111320 * Math.cos(detection.position.lat * Math.PI / 180));
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best ? { vehicle: best, distance: bd } : null;
  }
  function askConfirm(title, body, { confirmText = "Confirm", danger = true } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (val) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
        closeSheet();
      };
      openSheet(({ close: close2 }) => {
        const box = document.createElement("div");
        const h = document.createElement("h3");
        h.textContent = title;
        const p = document.createElement("p");
        p.className = "small muted";
        p.style.marginTop = "6px";
        p.textContent = body || "";
        const row = document.createElement("div");
        row.className = "row";
        row.style.cssText = "gap:8px;margin-top:14px";
        const yes = document.createElement("button");
        yes.className = danger ? "btn" : "btn";
        yes.textContent = confirmText;
        yes.onclick = () => done(true);
        const no = document.createElement("button");
        no.className = "btn ghost";
        no.textContent = "Cancel";
        no.onclick = () => {
          settled = true;
          resolve(false);
          close2();
        };
        row.append(yes, no);
        box.append(h, p, row);
        return box;
      }, { onClose: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      } });
    });
  }
  async function setupServiceWorker() {
    if (window.__PIETURA_NO_SW__) return;
    const build = window.__PIETURA_BUILD__ || "dev";
    const KEY2 = "pietura.build";
    try {
      if (!("serviceWorker" in navigator && location.protocol.startsWith("http"))) return;
      let previous = null;
      try {
        previous = localStorage.getItem(KEY2);
      } catch {
      }
      if (previous && previous !== build) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        console.info(`EasyRide build changed (${previous} → ${build}); cleared cached assets.`);
      }
      try {
        localStorage.setItem(KEY2, build);
      } catch {
      }
      const reg = await navigator.serviceWorker.register("sw.js");
      if (previous && previous !== build && navigator.serviceWorker.controller) location.reload();
      else reg.update?.().catch(() => {
      });
    } catch (e) {
      console.warn("service worker unavailable", e);
    }
  }
  function boot() {
    if (!location.hash || location.hash === "#" || location.hash === "#/") {
      replaceHash(`#/${defaultScreenName()}`);
    }
    route();
    detection.start();
    requestAnimationFrame(loop);
    if (state.onboarded && !state.notifications.length) {
      notify("Hands-free is armed", "Your ticket will register automatically when you board a vehicle with an onboard unit.", "ok");
    }
    pushLog("info", `EasyRide demo booted · ${fleetStats().total} vehicles in service`);
    const badge = document.getElementById("demo-badge");
    const wide = window.matchMedia("(min-width: 1080px)");
    const placeBadge = () => {
      if (!badge) return;
      const head = document.querySelector(".console-head");
      if (wide.matches && head) {
        head.append(badge);
        badge.classList.add("attached");
      } else {
        document.body.prepend(badge);
        badge.classList.remove("attached");
      }
    };
    placeBadge();
    wide.addEventListener?.("change", placeBadge);
    setupServiceWorker();
    window.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select")) return;
      if (current.screen?.role === "driver") {
        const dmap = { 1: "#/driver", 2: "#/driver-map", 3: "#/driver-route", 4: "#/driver-tickets" };
        if (dmap[e.key]) navigate(dmap[e.key]);
        return;
      }
      const map = { 1: "#/home", 2: "#/routes", 3: "#/map", 4: "#/tickets", 5: "#/account" };
      if (map[e.key]) navigate(map[e.key]);
    });
  }
  var screenHost, header, banner, current, confirmTimer, refreshSoon, simRunning, lastRouteRefresh, logHost, consoleLog, lastUnitSig, unitCheckAt, appApi;
  var init_app = __esm({
    "js/app.js"() {
      init_util();
      init_ui();
      init_screens();
      init_sim();
      init_detection();
      init_store();
      init_store();
      init_driver();
      init_crypto();
      setClock(() => now2());
      screenHost = $("#screen");
      header = { title: $("#hdr-title"), sub: $("#hdr-sub"), back: $("#btn-back") };
      if (window.__EASYRIDE_EMBED__ || /[?&]embed=1\b/.test(location.search)) {
        document.body.classList.add("embed-frame");
      }
      banner = document.createElement("div");
      banner.className = "boarded-banner";
      banner.hidden = true;
      $("#app-frame").append(banner);
      current = { name: null, screen: null, params: {}, instance: null };
      document.querySelectorAll("#tabbar a, #driver-tabbar a").forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const target = a.getAttribute("href") || "#/start";
          if (location.hash === target) {
            route();
            return;
          }
          setHash(target);
          route();
        });
      });
      $("#hdr-logo")?.addEventListener("click", () => {
        setHash("#/start");
        route();
      });
      $("#hdr-logo")?.style && ($("#hdr-logo").style.cursor = "pointer");
      $("#btn-role-switch")?.addEventListener("click", () => {
        if (current.screen?.role === "driver") {
          setRole("passenger");
          const target = state.onboarded ? "#/home" : "#/onboarding";
          setHash(target);
          route();
        } else {
          setRole("driver");
          setHash("#/driver");
          route();
        }
      });
      $("#c-role-start")?.addEventListener("click", () => {
        setHash("#/start");
        route();
      });
      $("#c-role-passenger")?.addEventListener("click", () => {
        setRole("passenger");
        setHash(state.onboarded ? "#/home" : "#/onboarding");
        route();
      });
      $("#c-role-driver")?.addEventListener("click", () => {
        setRole("driver");
        setHash("#/driver");
        route();
      });
      $("#btn-back").addEventListener("click", () => {
        try {
          if (history.length > 1) {
            history.back();
            return;
          }
        } catch {
        }
        navigate("#/home");
      });
      $("#btn-alerts").addEventListener("click", () => navigate("#/alerts"));
      $("#btn-ticket-quick").addEventListener("click", () => navigate("#/tickets"));
      window.addEventListener("hashchange", route);
      confirmTimer = null;
      refreshSoon = debounce(() => {
        if (document.visibilityState !== "hidden") route();
      }, 300);
      events.on("detection", (d) => {
        renderBanner(d);
        if (current.name === "home" || current.name === "map") refreshSoon();
      });
      events.on("boarding", ({ trip, charged, reason }) => {
        if (navigator.vibrate) navigator.vibrate(charged ? [18, 60, 18] : 18);
        toast({
          title: charged ? `Ticket registered · ${eur(charged)} charged` : "Ticket registered · no charge",
          body: reason,
          kind: "ok",
          timeout: 6500
        });
        setTimeout(() => {
          if (current.name === "tickets") route();
        }, 400);
      });
      events.on("notification", (n) => {
        updateHeaderBadges();
        if (state.prefs.notifications && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(n.title, { body: n.body });
          } catch {
          }
        }
      });
      events.on("alight-log", ({ reason }) => toast({ title: "Trip closed automatically", body: reason, kind: "info" }));
      simRunning = true;
      lastRouteRefresh = 0;
      logHost = $("#event-log");
      consoleLog = [];
      events.on("event", (e) => pushLog(e.level, e.msg));
      lastUnitSig = "";
      unitCheckAt = 0;
      $("#sim-run").addEventListener("change", (e) => {
        simRunning = e.target.checked;
        pushLog("info", simRunning ? "Depot simulation resumed" : "Depot simulation paused (clock frozen)");
      });
      $("#sim-follow").addEventListener("change", (e) => {
        if (!e.target.checked) {
          detection.stopFollow();
          pushLog("info", "Stopped following the boarded vehicle");
        } else {
          const t = openTrip();
          if (t) detection.followVehicle(t.vehicleId);
        }
      });
      $("#beacon-range").addEventListener("input", (e) => {
        $("#beacon-range-out").textContent = `${e.target.value} m`;
        detection.setRange(+e.target.value);
      });
      document.querySelectorAll("#timescale button").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll("#timescale button").forEach((x) => x.classList.toggle("on", x === b));
        setScale(+b.dataset.scale);
        pushLog("info", `Time scale set to ${b.dataset.scale}×`);
      }));
      $("#btn-spoof").addEventListener("click", async () => {
        const near = nearestToUser();
        if (!near) return pushLog("warn", "No vehicle nearby to spoof");
        const fake = await beaconFor(near.vehicle, { spoof: true });
        const verdict = await verifyBeacon(fake, detection.seen, now2());
        state.stats.spoofAttempts++;
        save();
        pushLog(verdict.ok ? "warn" : "err", verdict.ok ? `Spoofed beacon ACCEPTED — this should not happen (${verdict.reason})` : `Spoofed beacon rejected: ${verdict.reason} — no ticket registered`);
        toast({ title: verdict.ok ? "Spoof accepted (bad!)" : "Spoofed beacon rejected", body: verdict.ok ? "Investigate the signature check." : `Reason: ${verdict.reason}. A cloned beacon cannot charge you.`, kind: verdict.ok ? "bad" : "ok" });
      });
      $("#btn-replay").addEventListener("click", async () => {
        const near = nearestToUser();
        if (!near) return pushLog("warn", "No vehicle nearby to replay");
        const beacon = await beaconFor(near.vehicle);
        const seen = { nonces: /* @__PURE__ */ new Set(), counters: /* @__PURE__ */ new Map() };
        const first = await verifyBeacon(beacon, seen, now2());
        seen.nonces.add(beacon.nonce);
        seen.counters.set(beacon.unitId, beacon.counter);
        const second = await verifyBeacon(beacon, seen, now2());
        pushLog("info", `Replay test — first transmission: ${first.ok ? "accepted" : first.reason}`);
        pushLog(second.ok ? "err" : "ok", `Replay test — identical beacon repeated: ${second.ok ? "ACCEPTED (bad!)" : `rejected (${second.reason})`}`);
      });
      $("#btn-clear-log").addEventListener("click", () => {
        consoleLog.length = 0;
        logHost.innerHTML = "";
      });
      $("#btn-reset").addEventListener("click", async () => {
        const yes = await askConfirm("Reset all demo data?", "Wallet, tickets, trips, receipts and preferences in this browser will be cleared.");
        if (!yes) return;
        resetAll();
        resetBeacons();
        setHash("#/start");
        route();
        toast({ title: "Demo data reset", kind: "info" });
      });
      $("#btn-crash").addEventListener("click", () => {
        state.wallet.balance = 0;
        save();
        pushLog("warn", "Wallet emptied — the next hands-free boarding will hit the no-balance path");
        toast({ title: "Wallet emptied", body: "Board a vehicle to see how the app handles a failed auto-buy.", kind: "warn" });
      });
      window.__pietura_detection = detection;
      appApi = { state, store: store_exports, sim: sim_exports, driver: driver_exports, detection, navigate, refresh: route, crypto: null };
      window.__pietura = appApi;
      window.__easyride = appApi;
      Promise.resolve().then(() => (init_crypto(), crypto_exports)).then((m) => {
        appApi.crypto = m;
      }).catch(() => {
      });
      window.addEventListener("error", (e) => console.error("app error", e.error || e.message));
      boot();
    }
  });
  init_app();
})();
