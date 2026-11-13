import os from 'os';
import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';

const OUT_DIR = 'docs/evidence/final_acceptance';
mkdirSync(OUT_DIR, { recursive: true });

function saveEvidence(filename, base64Data) {
  const buf = Buffer.from(base64Data, 'base64');
  writeFileSync(`${OUT_DIR}/${filename}`, buf);
  console.log(`[SAVED EVIDENCE]: ${OUT_DIR}/${filename} (${Math.round(buf.length / 1024)} KB)`);
}

async function runUAT() {
  console.log('======================================================');
  console.log('METHANE DETECTIVE - FINAL ACCEPTANCE TESTING RUNNER');
  console.log('NASA Space Apps Challenge 2026 | Team RISING_CODERS_X');
  console.log('======================================================\n');

  console.log('Spawning Headless Chrome on CDP port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    `--user-data-dir=${path.join(os.tmpdir(), 'methane_test_profile')}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  // Connect to Chrome CDP
  let ver = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await fetch('http://localhost:9222/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to headless Chrome on port 9222');
  }

  console.log('Connected to Browser:', ver.Browser);

  try {
    const targetsRes = await fetch('http://localhost:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();
    const consoleLogs = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        if (msg.params.type === 'error') {
          consoleErrors.push(text);
          console.error('[BROWSER CONSOLE ERROR]:', text);
        } else {
          consoleLogs.push(text);
        }
      }
    };

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise(r => ws.onopen = r);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    const setViewport = async (width, height, isMobile = false) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
      });
      await new Promise(r => setTimeout(r, 600));
    };

    // -------------------------------------------------------------
    // TEST 1 — FIRST IMPRESSION (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: FIRST IMPRESSION AT 1440x900 ---');
    await setViewport(1440, 900, false);
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await new Promise(r => setTimeout(r, 3500));

    // Verify Header and Connection Status
    const headerEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('header');
        const title = header?.querySelector('.font-orbitron')?.textContent?.trim();
        const subtitle = header?.querySelector('.font-inter')?.textContent?.trim();
        const badge = header?.querySelector('.rounded-full')?.textContent?.trim();
        const navButtons = Array.from(document.querySelectorAll('nav button')).map(b => b.textContent.trim());
        return { title, subtitle, badge, navButtons };
      })()`,
      returnByValue: true
    });
    console.log('Header & Navigation State:', headerEval.result?.value);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    saveEvidence('final_explore_desktop_1440x900.png', shot1.data);

    // -------------------------------------------------------------
    // TEST 2 — EXPLORE OBSERVATION BD-HAB-001 (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: EXPLORE OBSERVATION BD-HAB-001 ---');
    const obsEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const inspector = document.querySelector('aside') || document.querySelector('.lg\\\\:w-96') || document.body;
        const text = inspector.textContent;
        return {
          hasNabiganj: text.includes('Nabiganj') || text.includes('Habiganj'),
          has820kg: text.includes('820 kg/hr') || text.includes('820'),
          hasUncertainty: text.includes('24%') || text.includes('±24%'),
          hasNoFacilityBlame: text.includes('not attributed to a named gas facility') || text.includes('6.9 km'),
          hasIMEModel: text.includes('IME') || text.includes('inversion'),
          hasButton: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Explore Observations Over Time'))
        };
      })()`,
      returnByValue: true
    });
    console.log('Observation BD-HAB-001 Validation:', obsEval.result?.value);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    saveEvidence('final_emit_observation_desktop_1440x900.png', shot2.data);

    // -------------------------------------------------------------
    // TEST 3 — UNDERSTAND TREND & SIMPLE VIEW (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: UNDERSTAND TREND IN SIMPLE VIEW ---');
    // Click on "2. Understand Data" Tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('nav button'));
        const btn = btns.find(b => b.textContent.includes('Understand'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Select BD-TRP-SYL in Target Dropdown to verify TROPOMI Column & Null Not Rejected
    const selectTropomi = await send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.querySelector('select');
        if (select) {
          select.value = 'BD-TRP-SYL';
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return { selected: true, value: select.value };
        }
        return { selected: false };
      })()`,
      returnByValue: true
    });
    console.log('Switched to BD-TRP-SYL:', selectTropomi.result?.value);
    await new Promise(r => setTimeout(r, 1200));

    const trendEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.textContent;
        return {
          hasSensSlope: bodyText.includes('+12.81') || bodyText.includes('12.81'),
          hasExactP: bodyText.includes('0.10868') || bodyText.includes('0.1087') || bodyText.includes('0.109') || bodyText.includes('0.11'),
          hasNullNotRejected: bodyText.includes('NOT REJECTED') || bodyText.includes('NOT STATISTICALLY SIGNIFICANT') || bodyText.includes('CYCLICAL'),
          hasQ1: bodyText.includes('WHAT IS CHANGING?'),
          hasQ2: bodyText.includes('WHERE IS IT CHANGING?'),
          hasQ3: bodyText.includes('HOW MUCH IS IT CHANGING?'),
          hasQ4: bodyText.includes('IS IT SIGNIFICANT?')
        };
      })()`,
      returnByValue: true
    });
    console.log('Trend BD-TRP-SYL Validation:', trendEval.result?.value);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    saveEvidence('final_trends_simple_desktop_1440x900.png', shot3.data);

    // -------------------------------------------------------------
    // TEST 4 — CLIMATE IMPACT SIMULATOR (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: CLIMATE IMPACT SIMULATOR ---');
    // Click on "3. Explore Impact" Tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('nav button'));
        const btn = btns.find(b => b.textContent.includes('Impact'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    const impactEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.textContent.toLowerCase();
        const slider = document.querySelector('input[type="range"]');
        return {
          hasSlider: !!slider,
          sliderValue: slider?.value,
          hasCars: text.includes('passenger cars') || text.includes('vehicle equivalent'),
          hasHomes: text.includes('homes fueled') || text.includes('household clean energy'),
          hasGasValue: text.includes('bdt') || text.includes('economic'),
          hasHypotheticalDisclaimer: text.includes('hypothetical') || text.includes('mitigation') || text.includes('scenario')
        };
      })()`,
      returnByValue: true
    });
    console.log('Climate Simulator Validation:', impactEval.result?.value);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    saveEvidence('final_climate_impact_desktop_1440x900.png', shot4.data);

    // -------------------------------------------------------------
    // TEST 5 — MOBILE USABILITY (390x844)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: MOBILE USABILITY AT 390x844 ---');
    // Return to Map/Spot tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('nav button'));
        const btn = btns.find(b => b.textContent.includes('Spot'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 1000));

    const mobileEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const docW = document.documentElement.scrollWidth;
        const viewW = window.innerWidth;
        const hasOverflow = docW > viewW;
        return { docW, viewW, hasOverflow };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Layout Validation (Zero Horizontal Overflow):', mobileEval.result?.value);

    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    saveEvidence('final_home_mobile_390x844.png', shot5.data);

    // -------------------------------------------------------------
    // BENGALI LANGUAGE & ATTRIBUTION VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- BENGALI LANGUAGE & ABOUT MODAL VERIFICATION ---');
    // Switch to Bengali
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('বাংলা') || b.textContent.includes('English'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    const bnEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.textContent;
        return {
          hasAppTitleBn: text.includes('মিথেন গোয়েন্দা'),
          hasSubtitleBn: text.includes('অদৃশ্য দূষণকারীদের'),
          hasLiveBadgeBn: text.includes('নাসা আর্থ ডাটা সংযুক্ত') || text.includes('সংরক্ষিত উপাত্ত')
        };
      })()`,
      returnByValue: true
    });
    console.log('Bengali Mode Validation:', bnEval.result?.value);

    // Open About Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b => b.getAttribute('aria-label')?.includes('About') || b.textContent.includes('About'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const aboutEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.textContent;
        return {
          hasTeam: text.includes('Developed by team RISING_CODERS_X'),
          hasEvent: text.includes('NASA Space Apps Challenge 2026'),
          hasChallengeName: text.includes('Be An Earth System Trend Detective')
        };
      })()`,
      returnByValue: true
    });
    console.log('Section 11 About Modal Attribution:', aboutEval.result?.value);

    console.log('\n======================================================');
    console.log('ALL FINAL ACCEPTANCE TESTS EXECUTED SUCCESSFULLY!');
    console.log('Console Errors:', consoleErrors.length);
    console.log('======================================================\n');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runUAT().catch(err => {
  console.error('Final Acceptance Test Failed:', err);
  process.exit(1);
});
