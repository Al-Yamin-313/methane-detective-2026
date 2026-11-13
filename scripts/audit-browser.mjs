import os from 'os';
import path from 'path';
// Comprehensive Self-Contained Browser Audit & Multi-Viewport Verification Script
import { writeFileSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';

function saveShot(fileName, base64Data) {
  const buf = Buffer.from(base64Data, 'base64');
  writeFileSync(fileName, buf);
  try {
    mkdirSync('docs/evidence', { recursive: true });
    writeFileSync(`docs/evidence/${fileName}`, buf);
  } catch (e) {}
}

async function runAudit() {
  console.log('Spawning headless Chrome with CDP on port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    `--user-data-dir=${path.join(os.tmpdir(), 'methane_test_profile')}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  // Wait for Chrome CDP to be available
  let ver = null;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('http://localhost:9222/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9222 after 12 seconds');
  }

  console.log('Connected to Browser:', ver.Browser);

  try {
    const targetsRes = await fetch('http://localhost:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log('Target WebSocket URL:', pageTarget.webSocketDebuggerUrl);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();
    const consoleMessages = [];
    const runtimeExceptions = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push(msg.params);
        if (msg.params.type === 'error') {
          console.error(`[BROWSER CONSOLE ERROR]:`, msg.params.args.map(a => a.value || a.description).join(' '));
        } else {
          console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]:`, msg.params.args.map(a => a.value || a.description).join(' '));
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        runtimeExceptions.push(msg.params);
        console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
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

    // 1. Initial Load at 1440x900 (Desktop Map View)
    console.log('\n[1/7] Navigating to http://localhost:5173 at 1440x900...');
    await setViewport(1440, 900, false);
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await new Promise(r => setTimeout(r, 2500));

    const shotExplore = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_explore_1440x900.png', shotExplore.data);
    saveShot('screenshot_desktop_1440x900.png', shotExplore.data);
    saveShot('screenshot_map_final_1440x900.png', shotExplore.data);
    console.log(' -> Saved screenshot_explore_1440x900.png and screenshot_map_final_1440x900.png');

    // 2. Test Navigation Tabs (Trends, Climate Impact, Data & Methods)
    console.log('\n[2/7] Testing Navigation Tabs & Workflows...');
    const tabs = [
      { name: 'Understand', file: 'screenshot_trends_1440x900.png' },
      { name: 'Impact', file: 'screenshot_impact_1440x900.png' },
      { name: 'Methods', file: 'screenshot_methods_1440x900.png' },
      { name: 'Spot', file: 'screenshot_map_final_1440x900.png' }
    ];

    for (const t of tabs) {
      console.log(`Navigating to tab matching: "${t.name}"...`);
      const clickRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('nav button'));
          const btn = btns.find(b => b.textContent.includes('${t.name}'));
          if (btn) {
            btn.click();
            return { clicked: true, text: btn.textContent.trim() };
          }
          return { clicked: false, available: btns.map(b => b.textContent.trim()) };
        })()`,
        returnByValue: true
      });
      console.log(' -> Tab Click:', clickRes.result?.value);
      await new Promise(r => setTimeout(r, 1000));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      saveShot(t.file, shot.data);
      console.log(` -> Saved ${t.file}`);

      // If on Trends tab, test Scientist View toggle and switch target to BD-TRP-SYL
      if (t.name === 'Understand') {
        console.log('Testing Scientist View Toggle on Trends...');
        await send('Runtime.evaluate', {
          expression: `(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const scientistBtn = btns.find(b => b.textContent.includes('Scientist View') || b.textContent.includes('বিজ্ঞানীদের'));
            if (scientistBtn) {
              scientistBtn.click();
              return { clicked: true };
            }
            return { clicked: false };
          })()`,
          returnByValue: true
        });
        await new Promise(r => setTimeout(r, 800));

        // Test Target Selection: BD-TRP-SYL (Sentinel-5P TROPOMI)
        console.log('Testing Target Selector: Switch to BD-TRP-SYL (Genuine Sentinel-5P TROPOMI)...');
        await send('Runtime.evaluate', {
          expression: `(() => {
            const select = document.querySelector('select');
            if (select) {
              select.value = 'BD-TRP-SYL';
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return { selected: true, val: select.value };
            }
            return { selected: false };
          })()`,
          returnByValue: true
        });
        await new Promise(r => setTimeout(r, 1000));

        const shotTropomi = await send('Page.captureScreenshot', { format: 'png' });
        saveShot('screenshot_trends_comparison_1440x900.png', shotTropomi.data);
        console.log(' -> Saved screenshot_trends_comparison_1440x900.png (TROPOMI Null Not Rejected Verification)');
      }
    }

    // 3. Test Section 11 About Modal
    console.log('\n[3/7] Testing Section 11 About Modal...');
    const aboutClick = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b => b.getAttribute('aria-label')?.includes('About') || b.textContent.includes('About'));
        if (btn) {
          btn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log(' -> About Button Click:', aboutClick.result?.value);
    await new Promise(r => setTimeout(r, 600));

    const modalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed');
        if (!modal) return { found: false };
        const text = modal.textContent;
        return {
          found: true,
          hasTeam: text.includes('Developed by team RISING_CODERS_X'),
          hasEvent: text.includes('NASA Space Apps Challenge 2026'),
          fullText: text.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log(' -> About Modal Content Verification:', modalCheck.result?.value);

    const shotAbout = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_about_modal.png', shotAbout.data);
    console.log(' -> Saved screenshot_about_modal.png');

    // Close About Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.fixed button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // 4. Test Bilingual Toggle (English <-> বাংলা)
    console.log('\n[4/7] Testing Bilingual Switcher (EN -> বাংলা)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('বাংলা') || b.textContent.includes('English'));
        if (btn) {
          btn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    const shotBn = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_bengali_1440x900.png', shotBn.data);
    console.log(' -> Saved screenshot_bengali_1440x900.png');

    // Switch back to English
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('বাংলা') || b.textContent.includes('English'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // 5. Test Tablet Viewport (768x1024)
    console.log('\n[5/7] Testing Tablet Viewport (768x1024)...');
    await setViewport(768, 1024, false);
    const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_tablet_768x1024.png', shotTablet.data);
    console.log(' -> Saved screenshot_tablet_768x1024.png');

    // 6. Test Mobile Viewport (390x844) & Bottom Sheet Drawer
    console.log('\n[6/7] Testing Mobile Viewport (390x844)...');
    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 600));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_mobile_390x844.png', shotMobile.data);
    console.log(' -> Saved screenshot_mobile_390x844.png');

    // Open mobile drawer
    console.log('Opening Mobile Bottom Sheet Drawer...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pillBtn = document.querySelector('.lg\\\\:hidden.absolute button');
        if (pillBtn) {
          pillBtn.click();
          return { opened: true };
        }
        return { opened: false };
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const shotMobileDrawer = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_mobile_drawer_390x844.png', shotMobileDrawer.data);
    console.log(' -> Saved screenshot_mobile_drawer_390x844.png');

    // 7. Test Mobile Viewport (360x640)
    console.log('\n[7/7] Testing Mobile Viewport (360x640)...');
    await setViewport(360, 640, true);
    await new Promise(r => setTimeout(r, 600));

    const shotMobileSmall = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('screenshot_mobile_360x640.png', shotMobileSmall.data);
    console.log(' -> Saved screenshot_mobile_360x640.png');

    // Verification Summary
    console.log('\n======================================================');
    console.log('BROWSER AUDIT COMPLETE');
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Console Errors:', consoleMessages.filter(m => m.type === 'error').length);
    console.log('Runtime Exceptions:', runtimeExceptions.length);
    console.log('======================================================');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
