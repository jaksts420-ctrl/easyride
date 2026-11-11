# EasyRide — hands-free public transport & live bus driver console (demo)

**EasyRide** is an interactive Riga public transport PWA demo with a **role selector at launch** so you can experience the system from either side:

1. **Passenger view (`I’m taking public transport`)** — Riga timetables, live vehicle map with real-time crowding indicators, ticket store with simulated card checkout, and **automatic hands-free BLE + GPS ticket registration** the moment you step on board.
2. **Bus Driver console (`I’m the bus driver`)** — live cabin telemetry showing **people on board**, **registered tickets** (EasyRide BLE auto-registrations vs. card/QR taps vs. unregistered riders), **live bus position on the map**, **route & stop-by-stop progress**, and **bus crowding** (overall + front/mid/rear cabin zones). Switch between Passenger and Bus Driver anytime via the top header button (`⇄ Driver` / `⇄ Passenger`).

> **This is a demonstration build.** The network data, the onboard units, the beacons and the
> payment provider are all simulated. Nothing is charged and nothing is sent to a server.
> Everything runs locally in your browser.

---

## Run it

| How | What to do |
|---|---|
| **Live preview** | Open the running preview in this workspace (the server binds `0.0.0.0:8000`). |
| **Share with a QR code** | See [Sharing](#sharing) — `share/` and `dist/share/` hold the QR codes, a printable card and a QR maker. |
| **Local server** | `cd pietura && python3 -m http.server 8000`, then open `http://localhost:8000`. |
| **One file, no server** | Open `easyride-standalone.html` (or `dist/easyride-standalone.html`) — everything inlined, works from a USB stick, an email attachment or `file://`, fully offline. |
| **As an app** | Open the hosted URL in Chrome/Edge/Safari and choose *Install app* / *Add to Home Screen* (PWA, works offline after first load). |

No build step is required to run the app. Only if you edit the files in `js/` do you need to rebuild:
`./tools/build.sh` (browser bundle) and `node tools/build-standalone.mjs` (single file).

## Sharing

```
share/ (persisted) & dist/share/
├── qr-scan.png            # clean scannable QR code
├── share-card.html        # “scan to open” card — open it, or send the .png / .pdf
├── share-card.png         #   screenshot-ready version
├── share-card-print.pdf   #   A4, light theme, prints cleanly
├── qr.svg                 # vector QR (print quality)
├── qr-1024.png / qr-2048.png
├── qr-maker.html          # standalone page: paste any URL → QR code (works offline)
└── qr-matrix.json         # the raw QR matrix, for regenerating at any size

easyride-standalone.html   # single-file build, no server, no network calls
```

Regenerate the kit for a different address:

```bash
node tools/make-share.mjs https://your-deployment.example/easyride/
python3 tools/render-share.py                      # PNGs (needs Pillow)
node tools/capture-share.mjs                       # card PNG + print PDF + scan verification (needs puppeteer)
```

`capture-share.mjs` does not just render — it decodes every generated QR (including the one inside
the finished card) and fails if it does not read back exactly the URL. That is how the codes in this
repo were verified.

**A public link needs a tunnel or a host.** The workspace preview URL is protected by an access
token, so it cannot be shared with other people. A `trycloudflare.com` tunnel works for a live demo
but dies with the session and changes hostname on restart — for a permanent link (24/7, free, no
backend needed) host `dist/site/` on any static host: see [`docs/deploy.md`](docs/deploy.md).
Alternatively:

* run a tunnel to the local server — `cloudflared tunnel --url http://localhost:8000` gives a public
  `https://….trycloudflare.com` URL (free, no account, but the URL changes each time you start it and
  it dies when the process stops); or
* host the `easyride-standalone.html` file anywhere (GitHub Pages, Netlify drop, S3, an internal
  server) — it needs no backend, so a static host is enough.

---

## The 60-second tour

1. **Welcome → Continue ×3** — the onboarding asks for the three permissions a real build would need
   (Bluetooth, location while boarding, notifications) and offers a demo wallet top-up.
2. **Home** — departures near you, your active ticket, hands-free status.
3. **Live map** — the first simulated vehicle, its current stop and its onboard unit. Tap a vehicle
   and choose **“Walk up and board (simulate)”**.
4. **Watch the banner** — after ~2–3 seconds of steady signal the app registers the ticket by itself:
   a green *Ticket registered* banner appears, a trip is recorded, and the ticket with its QR code
   lands in **Tickets**.
5. **Trips** — open the trip to see exactly why it was registered: BLE beacon + GPS proximity +
   dwell time, with the unit id, trip id and counter.
6. **Inspector mode** — validate the ticket (the QR is a real signed token), then try
   **“Forge a ticket token”** and **“Inspect a spoofed beacon”** to see the fraud paths fail.
7. **Operator console** (right-hand column, wide screens) — beacon range, time scale up to ×60,
   the live beacon payload of the nearest vehicle, the event log, and the anti-fraud tests
   *Broadcast spoofed beacon* / *Replay captured beacon*.

Keyboard shortcuts while the console is visible: `1` Home · `2` Routes · `3` Live map · `4` Tickets · `5` Account.

---

## What is real vs. simulated

| Area | Status |
|---|---|
| Hands-free detection logic | **Real** — signature verification, freshness window, anti-replay (nonce + monotonic counter), signal-strength threshold, dwell time, two-source confirmation, re-boarding cooldown, alight detection. |
| Fare rules | **Real rules, sample data** — the 90-minute ticket must be re-registered on every vehicle entered; time tickets start at first registration; daily spending cap; auto-buy ladder. |
| Ticket tokens / QR | **Real mechanism** — the QR holds a signed payload (`PIE1.<base64url>.<hmac>`) that the inspector screen validates offline. The demo uses a compiled-in HMAC key; production uses per-unit Ed25519/ECDSA keys with rotation. |
| Payments | **Simulated (DemoPSP)** — Luhn validation, test cards, declines, auth codes, idempotency keys, receipts, refunds. No card data is stored and no money moves. |
| Timetables / live map | **Simulated fleet** over a hand-made sample network inspired by Rīgas satiksme routes. Production needs the operator's GTFS + GTFS-RT feeds. |
| Onboard sensors | **Virtual ACUs** that broadcast signed BLE-style payloads on a simulated clock. Production needs operator-installed transponders or an API from the operator's existing ticketing system. |
| Fares & prices shown | Mirror the public Rīgas satiksme tariff (90-min €1.50, 24 h €5, 3 days €8, 5 days €10, monthly €30, minibus/night €1.15, bus 22 on board €2.00, Riga unified train+PT €2.00). Always re-check with the operator before relying on them. |

---

## Why the hands-free flow needs the operator

A phone cannot reliably know it is inside a specific bus from GPS alone: a bus stop sits next to a
tram stop, vehicles pass each other, and the passenger is often standing on the pavement. Something
**on the vehicle** has to say "this passenger is at my door, on trip X, at stop Y". That is the
onboard unit — and only the operator can install it, because:

* only the operator knows which physical vehicle is running which trip;
* only the operator can hold the per-vehicle signing keys that make the beacon unforgeable;
* the fare decision (which product, whose discount, refund policy) is the operator's commercial rule set.

The good news for a pilot: vehicles already carry the hardware (validators, GPS/AVL units, door
sensors). Adding a BLE broadcaster to an existing AVL unit is a firmware change plus a key
provisioning process — much cheaper than a new fleet-wide rollout. The full design, including the
security model and the open questions to settle with the operator, is in
[`architecture.md`](architecture.md).

---

## Project layout

```
pietura/
├── index.html                  single-page shell (phone frame + operator console)
├── manifest.webmanifest        PWA metadata
├── sw.js                       offline worker (network-first, cache fallback)
├── css/app.css                 all styling
├── assets/icon.svg             app icon
├── js/
│   ├── app.js                  router, global loop, boarding banner, console wiring, SW setup
│   ├── screens.js              every screen (home, routes, map, tickets, checkout, trips, validator…)
│   ├── ui.js                   toasts, bottom sheets, ticket card, QR, evidence timeline
│   ├── store.js                state: wallet, tickets, trips, receipts, preferences (localStorage)
│   ├── data.js                 sample network, fares, alerts
│   ├── sim.js                  virtual fleet, timetables, beacons, simulated clock
│   ├── detection.js            hands-free boarding state machine
│   ├── crypto.js               beacon signing/verification + ticket tokens
│   ├── payments.js             DemoPSP (checkout, declines, refunds)
│   ├── map.js                  canvas map (no tiles, no API keys, works offline)
│   └── bundle.js               ← generated; this is what index.html loads
├── tools/
│   ├── build.sh                esbuild bundle step
│   ├── build-standalone.mjs    builds easyride-standalone.html (everything inlined)
│   ├── make-share.mjs          builds the QR / share kit
│   ├── render-share.py         QR PNG rendering (Pillow)
│   ├── capture-share.mjs       card PNG + print PDF + QR scan verification
│   ├── test-e2e.js             full app test suite
│   └── test-sandbox.js         sandboxed-preview test suite
├── vendor/                     qrcode-generator (MIT), jsQR (Apache-2.0)
└── docs/
    ├── architecture.md         production design, security model, pilot plan
    ├── preview-harness.html    test page that reproduces the sandboxed preview environment
    └── screenshots/            captured by the automated test run
```

`index.html` loads `js/bundle.js`, a classic script bundled from the modules in `js/`. The bundle
exists because sandboxed preview iframes (and `file://` pages) block ES-module fetches — the modular
sources remain the source of truth, and `tools/build.sh` regenerates the bundle.

---

## Tests

An automated Puppeteer suite drives the app the way a user would, twice: once as a normal page and
once inside `<iframe sandbox="allow-scripts">` (the same environment as the in-app preview, where
storage and the History API are blocked).

Covered: boot → onboarding → tab navigation → route detail → live map rendering → card checkout →
declined payment → hands-free boarding with evidence → ticket QR + countdown → trip detail →
inspector validation (valid *and* forged tokens) → spoofed-beacon rejection → no-balance blocking →
settings persistence → reload persistence → service-worker registration.

The screenshots in `docs/screenshots/` are produced by that run. See `docs/testing.md` for how to
run both suites yourself.

---

## Known limits of this build

* **Boarding detection is driven by the simulator.** The logic is real, the signals are not.
* **A web app cannot scan BLE in the background.** A production hands-free client needs a native app
  (or a hybrid shell with a background BLE service); the PWA can only work while open on screen.
* **Single-device demo.** There is no server, no account system and no multi-device sync; state lives
  in `localStorage` and, in sandboxed previews where storage is blocked, in memory only.
* **Sample network data.** Routes are inspired by real Rīgas satiksme lines but stop sequences and
  timings are illustrative.
* **Not a ticketing authority.** Nothing here is approved by Rīgas satiksme, and it must not be used
  to imply a partnership that does not exist.
