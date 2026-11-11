/**
 * site.js — Interactive controllers for the EasyRide B2B / Operator & Investor Website:
 *  1. Embedded Live Demo Studio (Split Pitch View, Driver Console, Passenger App + live sync)
 *  2. 1-Click Guided Auto-Boarding Demo ("Board Bus 22 Hands-Free")
 *  3. Technical Architecture & Security Inspector
 *  4. Fleet ROI & Riga Pilot Economics Calculator
 *  5. Pilot / Investor Inquiry Generator
 */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ================================================================== */
  /* 1. EMBEDDED LIVE DEMO STUDIO                                       */
  /* ================================================================== */

  const stage = $('#frames-stage');
  const shellPassenger = $('#shell-passenger');
  const shellDriver = $('#shell-driver');
  const framePassenger = $('#frame-passenger');
  const frameDriver = $('#frame-driver');
  const wtStatus = $('#wt-status');

  function bootEmbeddedFrames() {
    if (!framePassenger || !frameDriver) return;

    // Standalone single-file mode: inject embedded app HTML with embed=1 + initial hash
    if (typeof window.__EMBEDDED_APP_HTML__ === 'string' && window.__EMBEDDED_APP_HTML__.length > 100) {
      const makeDoc = (initialHash, initialRole) => {
        const bootPatch = `<script>window.__EASYRIDE_EMBED__=true;try{location.hash=${JSON.stringify(initialHash)};}catch(e){}<\/script>`;
        return window.__EMBEDDED_APP_HTML__.replace('<head>', () => '<head>' + bootPatch);
      };
      framePassenger.srcdoc = makeDoc('#/start', 'passenger');
      frameDriver.srcdoc = makeDoc('#/driver', 'driver');
    } else {
      framePassenger.src = '../index.html?embed=1#/start';
      frameDriver.src = '../index.html?embed=1#/driver';
    }
  }

  function frameTargetOrigin() {
    try {
      return (location.origin && location.origin !== 'null') ? location.origin : '*';
    } catch {
      return '*';
    }
  }

  // Relay boarding/ticket sync strictly between our own Passenger & Driver iframes
  window.addEventListener('message', (e) => {
    if (e.data?.type !== 'easyride:sync') return;
    const isKnownFrame = (e.source && (e.source === framePassenger?.contentWindow || e.source === frameDriver?.contentWindow));
    if (!isKnownFrame) return;
    const expectedOrigin = frameTargetOrigin();
    if (expectedOrigin !== '*' && e.origin !== expectedOrigin) return;
    [framePassenger, frameDriver].forEach((fr) => {
      if (fr && fr.contentWindow && fr.contentWindow !== e.source) {
        try {
          fr.contentWindow.postMessage({ type: 'easyride:sync-apply', payload: e.data.payload }, expectedOrigin);
        } catch { /* ignore */ }
      }
    });
  });

  function setStudioMode(mode) {
    $$('.mode-tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    stage.classList.remove('single-driver', 'single-passenger');
    if (mode === 'driver') {
      stage.classList.add('single-driver');
      shellPassenger.hidden = true;
      shellDriver.hidden = false;
    } else if (mode === 'passenger') {
      stage.classList.add('single-passenger');
      shellPassenger.hidden = false;
      shellDriver.hidden = true;
    } else {
      shellPassenger.hidden = false;
      shellDriver.hidden = false;
    }
  }

  $$('.mode-tab').forEach((btn) => {
    btn.addEventListener('click', () => setStudioMode(btn.dataset.mode));
  });

  // 1-Click Guided Investor Walkthrough: Board Bus 22 in Passenger frame -> watch Driver frame update!
  const btnAutoBoard = $('#btn-auto-board');
  if (btnAutoBoard) {
    btnAutoBoard.addEventListener('click', () => {
      // Ensure Split mode so visitor sees BOTH sides react
      setStudioMode('split');
      try {
        const pw = framePassenger?.contentWindow;
        const dw = frameDriver?.contentWindow;
        const pApi = pw?.__easyride;
        const dApi = dw?.__easyride;
        if (!pApi || !dApi) {
          wtStatus.textContent = 'Demo frames still loading — click again in 1 second.';
          return;
        }

        // Complete passenger onboarding if not yet done & ensure wallet has funds for auto-ticket
        pApi.state.onboarded = true;
        pApi.store.setRole('passenger');
        if ((pApi.state.wallet?.balance ?? 0) < 1.5) {
          pApi.state.wallet.balance = 9.0;
        }
        pApi.store.save();

        // Pick Bus 22 (Airport line) if live, otherwise first bus in service
        const vehicles = pApi.sim.vehicles();
        const target = vehicles.find((v) => v.route.id === 'b22')
          || vehicles.find((v) => v.route.mode === 'bus')
          || vehicles[0];

        if (!target) return;

        // Point Driver Console at the exact same bus and open Passengers/Cockpit
        dApi.driver.setDriverVehicle(target.id);
        dw.location.hash = '#/driver';

        // Navigate Passenger to Live Map & step onto the bus via simulated BLE+GPS
        pw.location.hash = '#/map';
        pApi.detection.followVehicle(target.id);

        wtStatus.textContent = `Scanning ER-BEACON/1 on Bus ${target.route.number} → ${target.headsign} (holding 2.5 s BLE dwell)…`;
        btnAutoBoard.disabled = true;

        setTimeout(() => {
          // Relay latest state explicitly in case sandboxed iframe blocks storage events
          try {
            dw.postMessage({
              type: 'easyride:sync-apply',
              payload: {
                wallet: pApi.state.wallet,
                tickets: pApi.state.tickets,
                trips: pApi.state.trips,
                receipts: pApi.state.receipts,
                stats: pApi.state.stats,
              },
            }, frameTargetOrigin());
          } catch { /* ignore */ }
          wtStatus.textContent = `✓ Registered hands-free on Bus ${target.route.number}! Check Driver Console → YOU are now counted on board.`;
          btnAutoBoard.disabled = false;
        }, 3300);
      } catch (err) {
        wtStatus.textContent = 'Tip: Click inside either frame above to test boarding directly.';
        btnAutoBoard.disabled = false;
      }
    });
  }

  // 1-Click Simulate Stop Boarding (+3) in Driver Frame
  const btnSimStop = $('#btn-sim-stop');
  if (btnSimStop) {
    btnSimStop.addEventListener('click', () => {
      try {
        const dw = frameDriver?.contentWindow;
        const dApi = dw?.__easyride;
        if (!dApi) return;
        if (shellDriver.hidden) setStudioMode('driver');
        const v = dApi.driver.getDriverVehicle();
        const res = dApi.driver.simulateStopBoarding(v);
        if (res) {
          const cab = dApi.driver.cabinFor(v);
          wtStatus.textContent = `Stop event on Bus ${v.route.number}: +${res.boarded} boarded, −${res.alighted} alighted · Now ${cab.onBoard}/${cab.capacity} pax (${cab.crowdingPct}% full)`;
        }
      } catch { /* ignore */ }
    });
  }

  /* ================================================================== */
  /* 2. TECHNICAL ARCHITECTURE INSPECTOR                                */
  /* ================================================================== */

  const ARCH_DATA = {
    beacons: {
      badge: 'STAGE 01 · VEHICLE HARDWARE',
      title: '3 Ceiling BLE Beacons per Vehicle — €58 Total Retrofit',
      body: 'Instead of €8,500+ ruggedized optical turnstiles and cellular cabling at every door, EasyRide mounts three industrial Bluetooth Low Energy 5.2 beacons (Front Door, Mid Cabin, Rear Cabin) powered from existing 24V lighting rails or 5-year lithium cells.',
      bullets: [
        'Broadcasts signed 1 Hz ER-BEACON/1 frames carrying unit ID, route, trip, stop sequence, and monotonic counter.',
        'RSSI differential across Front / Mid / Rear beacons maps cabin crowding distribution in real time.',
        'Zero moving parts, zero screen vandalism, 15-minute depot installation per bus.',
      ],
      code: `<span class="hl">ER-BEACON/1</span>|<span class="cy">ACU-B22-0930</span>|b22|b22-0-0542|dir=0|seq=6|ctr=1793180075|ts=1793268000\nHMAC-SHA256: <span class="hl">9f4c2e81b70d4a19...verified</span>  ·  TX power: -12 dBm (cabin-tuned)`,
    },
    filter: {
      badge: 'STAGE 02 · SPATIAL ACCURACY',
      title: 'Zero Accidental Billing at Crowded Bus Shelters',
      body: 'The hardest problem in hands-free transit is distinguishing a passenger inside the front door from someone waiting 1.5 metres away under a glass shelter at Centrālā stacija. EasyRide requires three independent signals before charging a cent:',
      bullets: [
        'Multi-beacon cabin gradient: Interior RSSI curve (−54 to −72 dBm) vs. exterior hull attenuation.',
        'Sustained dwell window: Signal must hold inside the cabin envelope for ≥ 2.5 consecutive seconds.',
        'Trajectory co-movement: Phone accelerometer + GPS speed vector matches the vehicle departing the stop.',
      ],
      code: `Candidate: Bus 22 (ACU-B22-0930) · RSSI -59 dBm · dist 1.1 m\nDwell check: <span class="hl">2.8 s ≥ 2.5 s PASS</span>  ·  Co-movement: <span class="hl">22.4 km/h MATCH</span>  →  <span class="cy">REGISTER RIDE</span>`,
    },
    security: {
      badge: 'STAGE 03 · ANTI-FRAUD & CRYPTOGRAPHY',
      title: 'Cryptographic Anti-Spoofing & Replay Rejection',
      body: 'Every onboard unit holds a provisioned symmetric key rotated during depot Wi-Fi sync. Broadcast nonces and 1-second rolling counters prevent anyone from recording a bus beacon and replaying it elsewhere.',
      bullets: [
        'Bad-signature broadcasts are rejected in < 2 ms on the handset and flagged in operator telemetry.',
        'Captured & replayed frames fail monotonic counter + timestamp skew checks immediately.',
        'Smart fare protection guarantees a rider with an active 90-min or monthly pass is re-registered at €0.00.',
      ],
      code: `Frame #1793180041 → <span class="hl">ACCEPTED</span> (valid HMAC, fresh counter)\nReplay #1793180041 → <span class="cy">BLOCKED: replay-counter-seen</span> (logged to fraud counter)`,
    },
    offline: {
      badge: 'STAGE 04 · COMPLIANCE & INSPECTION',
      title: 'Sub-50 ms Offline Inspector Verification + Non-Confrontational Cabin Ops',
      body: 'Drivers focus on safe driving—never policing fares. Cabin telemetry shows exact compliance % on board so operators can trigger polite automated cabin audio reminders or dispatch mobile inspectors to specific high-evasion trips.',
      bullets: [
        'Registered rides mint an offline-verifiable ER1. signed QR token bound to vehicle ID, stop, and timestamp.',
        'Rīgas satiksme handhelds verify authenticity completely offline in tunnels or dead zones.',
        'Coexists 100% with legacy plastic e-talons and paper QR tickets during multi-year fleet transition.',
      ],
      code: `Token: <span class="hl">ER1.eyJ0aWNrZXRJZCI6InRrX2IyMiIsInZlaGljbGVJZCI6ImIyMi0wIn0.7a81c0e...</span>\nInspector scan: <span class="hl">VALID · 90-min ticket · Registered 4 min ago on Bus 22</span>`,
    },
  };

  function renderArch(key) {
    const d = ARCH_DATA[key];
    if (!d) return;
    $$('.arch-btn').forEach((b) => b.classList.toggle('active', b.dataset.arch === key));
    const host = $('#arch-detail');
    if (!host) return;
    host.innerHTML = `
      <div>
        <span class="eyebrow cyan">${d.badge}</span>
        <h3 style="font-size:23px;margin:14px 0 10px">${d.title}</h3>
        <p style="color:var(--txt2);margin:0 0 18px;font-size:15px;line-height:1.62">${d.body}</p>
        <ul class="check-list">
          ${d.bullets.map((b) => `<li><span class="chk">✓</span><span>${b}</span></li>`).join('')}
        </ul>
      </div>
      <div>
        <div style="font-size:11.5px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Live Protocol Sample</div>
        <div class="code-box">${d.code}</div>
      </div>
    `;
  }

  $$('.arch-btn').forEach((btn) => {
    btn.addEventListener('click', () => renderArch(btn.dataset.arch));
  });

  /* ================================================================== */
  /* 3. FLEET ROI & PILOT ECONOMICS CALCULATOR                          */
  /* ================================================================== */

  const inFleet = $('#roi-fleet');
  const inBoardings = $('#roi-boardings');
  const inRecovery = $('#roi-recovery');

  function fmtEur(n) {
    return '€' + Math.round(n).toLocaleString('en-US');
  }

  function updateRoi() {
    if (!inFleet) return;
    const fleet = Number(inFleet.value);
    const boardings = Number(inBoardings.value);
    const recoveryPct = Number(inRecovery.value);

    $('#lbl-fleet').textContent = `${fleet} vehicles`;
    $('#lbl-boardings').textContent = `${boardings.toLocaleString('en-US')} / day`;
    $('#lbl-recovery').textContent = `${recoveryPct.toFixed(1)}%`;

    const capexPerBus = 58; // 3 industrial BLE beacons + mount
    const legacyCapexPerBus = 8500;
    const totalCapex = fleet * capexPerBus;
    const legacySavings = fleet * (legacyCapexPerBus - capexPerBus);

    // Effective yield per recovered unvalidated boarding (€1.15 blended single/90-min fare net of pass mix)
    const effectiveFare = 1.15;
    const dailyRecoveredRides = fleet * boardings * (recoveryPct / 100);
    const annualRecoveredEur = dailyRecoveredRides * effectiveFare * 340; // 340 annualized weekday-equiv days
    const dailyRev = annualRecoveredEur / 365;
    const paybackDays = Math.max(1, Math.round(totalCapex / Math.max(1, dailyRev)));

    // 45% app adoption * 2.6 seconds door dwell saved per hands-free boarding
    const dwellHoursPerDay = (fleet * boardings * 0.45 * 2.6) / 3600;

    $('#out-capex').textContent = fmtEur(totalCapex);
    $('#out-capex-sub').textContent = `Saves ${fmtEur(legacySavings)} vs. legacy door validators`;
    $('#out-rev').textContent = fmtEur(annualRecoveredEur) + '/yr';
    $('#out-rev-sub').textContent = `~${Math.round(dailyRecoveredRides).toLocaleString('en-US')} recovered rides/day`;
    $('#out-payback').textContent = paybackDays < 30 ? `${paybackDays} days` : `${(paybackDays / 30).toFixed(1)} mo`;
    $('#out-dwell').textContent = `${dwellHoursPerDay.toFixed(1)} hrs/day`;
  }

  [inFleet, inBoardings, inRecovery].forEach((el) => el?.addEventListener('input', () => {
    $$('.preset-chip').forEach((c) => c.classList.remove('active'));
    updateRoi();
  }));

  $$('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.preset-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      inFleet.value = chip.dataset.fleet;
      inBoardings.value = chip.dataset.boardings;
      inRecovery.value = chip.dataset.recovery;
      updateRoi();
    });
  });

  /* ================================================================== */
  /* 4. PILOT / INVESTOR BRIEF GENERATOR                                */
  /* ================================================================== */

  const form = $('#pilot-form');
  const briefBox = $('#brief-output');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const orgType = String($('#f-role').value || '').slice(0, 80);
      const org = String($('#f-org').value || '').trim().slice(0, 120) || 'Municipal Transit Partner';
      const email = String($('#f-email').value || '').trim().slice(0, 120) || 'partner@example.org';
      const scope = String($('#f-scope').value || '').slice(0, 100);
      const notes = String($('#f-notes').value || '').trim().slice(0, 800);

      const summary = [
        `EASYRIDE PILOT & PARTNERSHIP BRIEF`,
        `Organization: ${org} (${orgType})`,
        `Contact:      ${email}`,
        `Target Scope: ${scope}`,
        `Included:     3-beacon cabin BLE kit + Passenger App + Driver Cabin Telemetry`,
        notes ? `Notes:        ${notes}` : null,
      ].filter(Boolean).join('\n');

      const mailto = `mailto:pilots@easyride.lv?subject=${encodeURIComponent(`EasyRide Inquiry — ${org} (${scope})`)}&body=${encodeURIComponent(summary)}`;

      // Build output strictly via DOM nodes + textContent (zero innerHTML with user input)
      briefBox.textContent = '';
      briefBox.hidden = false;

      const heading = document.createElement('b');
      heading.style.color = 'var(--acc)';
      heading.textContent = '✓ Pilot inquiry package ready';

      const sub = document.createElement('div');
      sub.style.color = 'var(--txt2)';
      sub.style.marginTop = '4px';
      sub.textContent = 'Demo mode does not transmit form data to external servers. Copy your brief below or open it directly in your mail client:';

      const pre = document.createElement('pre');
      pre.id = 'brief-pre';
      pre.textContent = summary;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      actions.style.flexWrap = 'wrap';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-primary btn-sm';
      copyBtn.id = 'btn-copy-brief';
      copyBtn.textContent = 'Copy Brief to Clipboard';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(summary);
          copyBtn.textContent = '✓ Copied!';
        } catch {
          copyBtn.textContent = 'Select text above to copy';
        }
      });

      const mailLink = document.createElement('a');
      mailLink.className = 'btn btn-secondary btn-sm';
      mailLink.href = mailto;
      mailLink.textContent = 'Open in Email Client ↗';

      actions.append(copyBtn, mailLink);
      briefBox.append(heading, sub, pre, actions);
    });
  }

  /* ================================================================== */
  /* INIT                                                               */
  /* ================================================================== */

  bootEmbeddedFrames();
  renderArch('beacons');
  updateRoi();
})();
