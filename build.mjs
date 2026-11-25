import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// 1. Bundle Three.js + Egg Dario 3D scene into a single minified IIFE script
const result = await esbuild.build({
  entryPoints: [path.join(root, 'src', 'main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: path.join(distDir, 'egg-dario-3d.bundle.js'),
  metafile: true,
});

const bundlePath = path.join(distDir, 'egg-dario-3d.bundle.js');
const bundleJs = fs.readFileSync(bundlePath, 'utf8');
console.log(`Built bundle: ${(bundleJs.length / 1024).toFixed(1)} KB`);

// 2. Also copy bundle next to the artifact preview HTML so it loads with zero external CDNs
const artifactDir = 'C:/Users/Administrator/.gemini/antigravity/brain/6fb39f02-0463-4227-9616-06861846273c';
fs.copyFileSync(bundlePath, path.join(artifactDir, 'egg-dario-3d.bundle.js'));

// 3. Emit standalone self-contained single-file HTML (works directly via double-click / file://)
const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D 鸡蛋达里奥旋转 (Three.js)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #171914; color: #eceae4; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
    #stage { width: 100%; height: 100%; }
    .hud {
      position: fixed; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translateX(-50%);
      display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px;
      width: max-content; max-width: calc(100vw - 20px);
      padding: 8px 10px; border-radius: 12px;
      background: rgba(24, 26, 21, 0.82); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.12); font-size: 13px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.45);
    }
    .btn {
      padding: 5px 11px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.06); color: #eceae4; cursor: pointer; font-size: 12px;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn:hover { background: rgba(255,255,255,0.14); }
    .btn.active { background: #d98d48; border-color: #f0ab67; color: #19120b; font-weight: 600; }
    .sep { width: 1px; height: 18px; background: rgba(255,255,255,0.14); }
    label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #c7c3b8; }
    input[type=range] { width: 88px; accent-color: #e49b56; cursor: pointer; }
    .hint { position: fixed; top: 14px; left: 16px; font-size: 12px; color: rgba(240,235,224,0.58); pointer-events: none; }
  </style>
</head>
<body>
  <div id="stage"></div>
  <div class="hint">单指拖拽 360° 旋转 · 双指/滚轮缩放</div>
  <div class="hud">
    <button id="btnPlay" class="btn">暂停</button>
    <div class="sep"></div>
    <button id="btnFull" class="btn active">完整循环</button>
    <button id="btnTurbo" class="btn">持续极速</button>
    <button id="btnFace" class="btn">正面定格</button>
    <div class="sep"></div>
    <button id="btnFlip" class="btn">正看脸部 (180°)</button>
    <button id="btnReset" class="btn">重置视角</button>
    <div class="sep"></div>
    <label>速度 <input id="rngSpeed" type="range" min="0.25" max="2" step="0.25" value="1" /><span id="lblSpeed">1.0x</span></label>
  </div>
  <script>${bundleJs}</script>
  <script>
    const app = window.initEggDario3D(document.getElementById('stage'));
    const btnPlay = document.getElementById('btnPlay');
    const btnFull = document.getElementById('btnFull');
    const btnTurbo = document.getElementById('btnTurbo');
    const btnFace = document.getElementById('btnFace');
    const btnFlip = document.getElementById('btnFlip');
    const btnReset = document.getElementById('btnReset');
    const rngSpeed = document.getElementById('rngSpeed');
    const lblSpeed = document.getElementById('lblSpeed');

    function setActive(m) {
      app.setMode(m);
      btnFull.classList.toggle('active', m === 'full');
      btnTurbo.classList.toggle('active', m === 'turbo');
      btnFace.classList.toggle('active', m === 'face');
      btnPlay.textContent = app.isPaused() ? '播放' : '暂停';
    }
    btnPlay.onclick = () => {
      const next = !app.isPaused();
      app.setPaused(next);
      btnPlay.textContent = next ? '播放' : '暂停';
    };
    btnFull.onclick = () => setActive('full');
    btnTurbo.onclick = () => setActive('turbo');
    btnFace.onclick = () => setActive('face');
    btnFlip.onclick = () => {
      const flipped = app.toggleFlip();
      btnFlip.classList.toggle('active', flipped);
      btnFlip.textContent = flipped ? '恢复倒立视角' : '正看脸部 (180°)';
    };
    btnReset.onclick = () => app.resetCamera();
    rngSpeed.oninput = (e) => {
      const v = parseFloat(e.target.value);
      app.setSpeed(v);
      lblSpeed.textContent = v.toFixed(2).replace(/\\.00$/, '.0') + 'x';
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'egg-dario-3d.html'), standaloneHtml, 'utf8');
console.log('Wrote standalone HTML:', path.join(distDir, 'egg-dario-3d.html'));
