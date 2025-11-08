export function installDebugOverlay() {
  if (!import.meta.env.DEV) {
    return;
  }

  if (typeof document === 'undefined') {
    return;
  }

  const el = document.createElement('div');
  el.id = '__debug';
  el.style.cssText =
    'position:fixed;z-index:999999;bottom:8px;right:8px;background:#111;color:#0f0;' +
    'padding:8px;font:12px/1.4 monospace;border:1px solid #0f0;max-width:55vw;max-height:45vh;overflow:auto';
  document.body.appendChild(el);

  const log = (k: string, m: any) => {
    el.innerHTML += `<div>[${k}] ${String(m)}</div>`;
  };

  const err0 = console.error;
  console.error = (...a: any[]) => {
    log('console.error', a.join(' '));
    err0(...a);
  };

  window.addEventListener('error', (e) => log('window.onerror', e.message));
  window.addEventListener('unhandledrejection', (e: any) =>
    log('unhandledrejection', String(e?.reason))
  );
}

