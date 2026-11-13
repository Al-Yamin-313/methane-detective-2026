import os from 'os';
import path from 'path';
async function check() {
  const list = await (await fetch('http://localhost:9222/json/list')).json();
  const page = list.find(t => t.type === 'page') || list[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const map = document.querySelector('.leaflet-container');
        const p1 = map?.parentElement;
        const p2 = p1?.parentElement;
        const main = document.querySelector('main');
        return {
          windowH: window.innerHeight,
          mainH: main?.offsetHeight,
          p2H: p2?.offsetHeight,
          p1H: p1?.offsetHeight,
          mapH: map?.offsetHeight
        };
      })()`,
      returnByValue: true
    }
  }));

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id === 1) {
      console.log('Flex Heights:', data.result?.result?.value);
      ws.close();
      process.exit(0);
    }
  };
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
