import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  root.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#140b09;color:#f8ddc8;font-family:Segoe UI,sans-serif;padding:32px">
      <div style="max-width:560px">
        <div style="letter-spacing:.35em;font-size:12px;color:#d99163">OLYMPUS WALK / SYSTEM CHECK</div>
        <h1 style="font-size:34px;margin:14px 0">WEBGL UNAVAILABLE</h1>
        <p style="line-height:1.6;color:#c9a58d">This simulator needs a browser with WebGL2 enabled. Try a current version of Chrome, Edge or Firefox, and make sure hardware acceleration is on.</p>
      </div>
    </div>`;
} else {
  ReactDOM.createRoot(root).render(<App />);
}
