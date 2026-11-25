import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ============================================================================
// Smooth Rounded Egg Profile Math (zero pointy poles!)
// ============================================================================
const EGG_Y_CENTER = 1.38;
const EGG_HALF_H = 0.90; // spans y = 0.48 .. 2.28

function eggYAtT(t) {
  const theta = (Math.max(0, Math.min(1, t)) - 0.5) * Math.PI;
  return EGG_Y_CENTER + EGG_HALF_H * Math.sin(theta);
}

function eggRadiusAtT(t) {
  const theta = (Math.max(0, Math.min(1, t)) - 0.5) * Math.PI;
  // Plump lower-mid face/cheeks, smoothly tapering to a round inverted egg dome at top!
  return 0.95 * Math.cos(theta) * (1.0 - 0.12 * Math.sin(theta));
}

function eggTFromY(y) {
  const sinT = Math.max(-1, Math.min(1, (y - EGG_Y_CENTER) / EGG_HALF_H));
  return Math.asin(sinT) / Math.PI + 0.5;
}

function eggRadiusAtY(y) {
  return eggRadiusAtT(eggTFromY(y));
}

// ============================================================================
// Procedural High-Res Textures (Dario Face, Wood Tabletop, Bokeh Lamp, Smoke)
// ============================================================================
function createDarioFaceTexture() {
  const W = 1024;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Helper: map 3D world height y on egg -> Canvas Y (v=1 at top -> canvas y=0)
  const yToC = (y) => (1 - eggTFromY(y)) * H;
  const cx = W * 0.5; // 512 = +Z front center

  // 1. Rich warm toasted-peach clay skin tone (calibrated for ACESFilmic + Studio IBL!)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
  baseGrad.addColorStop(0.0, '#d89b72');
  baseGrad.addColorStop(0.38, '#d4946a');
  baseGrad.addColorStop(0.72, '#c9865c');
  baseGrad.addColorStop(1.0, '#a66844');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  // Soft matte clay surface micro-texture
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 5 + Math.random() * 14;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,222,194,0.03)' : 'rgba(130,72,44,0.025)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Subtle 5-o'clock beard stubble shadow around inverted chin & mouth (y = 1.62..1.98)
  const stubbleY = yToC(1.77);
  const stubbleGrad = ctx.createRadialGradient(cx, stubbleY, 12, cx, stubbleY, 122);
  stubbleGrad.addColorStop(0.0, 'rgba(84, 72, 64, 0.25)');
  stubbleGrad.addColorStop(0.6, 'rgba(98, 82, 70, 0.14)');
  stubbleGrad.addColorStop(1.0, 'rgba(98, 82, 70, 0)');
  ctx.fillStyle = stubbleGrad;
  ctx.save();
  ctx.scale(1.18, 0.84);
  ctx.beginPath();
  ctx.arc(cx / 1.18, stubbleY / 0.84, 122, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 460; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random());
    const sx = cx + Math.cos(a) * rad * 96;
    const sy = stubbleY + Math.sin(a) * rad * 66;
    ctx.fillStyle = 'rgba(58, 46, 38, 0.085)';
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }

  // 3. Warm rosy cheek & nose-area flush (matching Dario's photo!)
  const drawFlush = (fx, fy, rx, ry, alpha) => {
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, rx);
    g.addColorStop(0, `rgba(216, 108, 86, ${alpha})`);
    g.addColorStop(0.65, `rgba(208, 114, 92, ${alpha * 0.35})`);
    g.addColorStop(1, 'rgba(208, 114, 92, 0)');
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawFlush(cx - 78, yToC(1.52), 56, 34, 0.28);
  drawFlush(cx + 78, yToC(1.52), 56, 34, 0.28);
  drawFlush(cx, yToC(1.51), 46, 32, 0.24);

  // 4. Soft chin contour (above mouth since upside down)
  ctx.strokeStyle = 'rgba(128, 72, 48, 0.34)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 34, yToC(1.88));
  ctx.quadraticCurveTo(cx, yToC(1.93), cx + 34, yToC(1.88));
  ctx.stroke();

  // 5. Dario's gentle nasolabial laugh folds curving around mouth corners
  ctx.strokeStyle = 'rgba(132, 76, 52, 0.46)';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(cx - 36, yToC(1.50));
  ctx.bezierCurveTo(cx - 58, yToC(1.56), cx - 66, yToC(1.66), cx - 60, yToC(1.76));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 36, yToC(1.50));
  ctx.bezierCurveTo(cx + 58, yToC(1.56), cx + 66, yToC(1.66), cx + 60, yToC(1.76));
  ctx.stroke();

  // Smile corner dimples
  ctx.strokeStyle = 'rgba(114, 60, 40, 0.5)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(cx - 49, yToC(1.66));
  ctx.quadraticCurveTo(cx - 53, yToC(1.70), cx - 45, yToC(1.74));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 49, yToC(1.66));
  ctx.quadraticCurveTo(cx + 53, yToC(1.70), cx + 45, yToC(1.74));
  ctx.stroke();

  // 6. Signature Dario Closed Warm Smirk Mouth (fuller rosy lower lip ABOVE seam!)
  const mouthY = yToC(1.70);
  const lowerLipGrad = ctx.createLinearGradient(0, mouthY, 0, mouthY - 26);
  lowerLipGrad.addColorStop(0, '#9e4c45');
  lowerLipGrad.addColorStop(0.5, '#c46c63');
  lowerLipGrad.addColorStop(1, '#d6887d');
  ctx.fillStyle = lowerLipGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 46, mouthY);
  ctx.bezierCurveTo(cx - 26, mouthY - 24, cx + 26, mouthY - 24, cx + 46, mouthY);
  ctx.bezierCurveTo(cx + 22, mouthY - 2, cx - 22, mouthY - 2, cx - 46, mouthY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 182, 170, 0.48)';
  ctx.beginPath();
  ctx.ellipse(cx, mouthY - 11, 18, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(124, 68, 46, 0.48)';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(cx - 24, mouthY - 25);
  ctx.quadraticCurveTo(cx, mouthY - 32, cx + 24, mouthY - 25);
  ctx.stroke();

  // Thinner upper lip (below seam, closer to nose)
  ctx.fillStyle = 'rgba(172, 96, 86, 0.90)';
  ctx.beginPath();
  ctx.moveTo(cx - 46, mouthY);
  ctx.bezierCurveTo(cx - 24, mouthY + 13, cx - 8, mouthY + 12, cx, mouthY + 8);
  ctx.bezierCurveTo(cx + 8, mouthY + 12, cx + 24, mouthY + 13, cx + 46, mouthY);
  ctx.bezierCurveTo(cx + 22, mouthY - 2, cx - 22, mouthY - 2, cx - 46, mouthY);
  ctx.closePath();
  ctx.fill();

  // Gentle closed mouth seam
  ctx.strokeStyle = '#57261c';
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(cx - 51, mouthY - 1);
  ctx.bezierCurveTo(cx - 31, mouthY + 4.5, cx - 12, mouthY + 0.5, cx, mouthY + 0.5);
  ctx.bezierCurveTo(cx + 12, mouthY + 0.5, cx + 31, mouthY + 4.5, cx + 51, mouthY - 1);
  ctx.stroke();

  // 7. Expressive, Clear Grey-Hazel Dario Eyes (larger & higher contrast so they read cleanly!)
  const eyeY = yToC(1.29);
  const eyeSep = 54;

  const drawEye = (ex, flip) => {
    // Under-eye pillow crease (ABOVE eye since upside down)
    ctx.strokeStyle = 'rgba(140, 84, 56, 0.46)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(ex - 28, eyeY - 27);
    ctx.quadraticCurveTo(ex, eyeY - 36, ex + 28, eyeY - 25);
    ctx.stroke();

    // Soft orbital depth
    const sockGrad = ctx.createRadialGradient(ex, eyeY, 6, ex, eyeY, 38);
    sockGrad.addColorStop(0, 'rgba(138, 82, 56, 0.28)');
    sockGrad.addColorStop(1, 'rgba(138, 82, 56, 0)');
    ctx.fillStyle = sockGrad;
    ctx.beginPath();
    ctx.arc(ex, eyeY, 38, 0, Math.PI * 2);
    ctx.fill();

    // Generous warm-white sclera almond
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex - 29, eyeY);
    ctx.quadraticCurveTo(ex, eyeY - 22, ex + 29, eyeY - 0.5);
    ctx.quadraticCurveTo(ex, eyeY + 20, ex - 29, eyeY);
    ctx.closePath();
    ctx.fillStyle = '#f2e8df';
    ctx.fill();
    ctx.clip();

    // Distinct Dario slate-grey / hazel iris
    const irisGrad = ctx.createRadialGradient(ex, eyeY + 1, 2, ex, eyeY + 1, 16.5);
    irisGrad.addColorStop(0, '#85928e');
    irisGrad.addColorStop(0.55, '#525f60');
    irisGrad.addColorStop(0.84, '#2d3436');
    irisGrad.addColorStop(1, '#1a1e20');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ex, eyeY + 1, 16.2, 0, Math.PI * 2);
    ctx.fill();

    // Crisp dark pupil
    ctx.fillStyle = '#0e1012';
    ctx.beginPath();
    ctx.arc(ex, eyeY + 1, 8.2, 0, Math.PI * 2);
    ctx.fill();

    // Bright catchlight glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.arc(ex - 4.8 * flip, eyeY - 4.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 236, 210, 0.55)';
    ctx.beginPath();
    ctx.arc(ex + 4.4 * flip, eyeY + 4.8, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Crisp dark upper lash line (BOTTOM edge since upside down!)
    ctx.strokeStyle = '#22150e';
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(ex - 30, eyeY);
    ctx.quadraticCurveTo(ex, eyeY + 21, ex + 30, eyeY - 0.5);
    ctx.stroke();

    // Lower rim definition (TOP edge)
    ctx.strokeStyle = 'rgba(116, 68, 46, 0.52)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(ex - 27, eyeY - 1);
    ctx.quadraticCurveTo(ex, eyeY - 20.5, ex + 27, eyeY - 1);
    ctx.stroke();

    // Soft hooded eyelid crease
    ctx.strokeStyle = 'rgba(128, 74, 48, 0.55)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(ex - 27, eyeY + 18);
    ctx.quadraticCurveTo(ex, eyeY + 28, ex + 26, eyeY + 16.5);
    ctx.stroke();
  };

  drawEye(cx - eyeSep, 1);
  drawEye(cx + eyeSep, -1);

  // 8. Natural Soft Dark-Brown Dario Eyebrows (below eyes/glasses browbar)
  const browY = yToC(1.115);
  ctx.strokeStyle = 'rgba(60, 38, 25, 0.88)';
  ctx.lineWidth = 8.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 90, browY + 3);
  ctx.bezierCurveTo(cx - 67, browY + 11, cx - 42, browY + 8, cx - 22, browY - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 90, browY + 3);
  ctx.bezierCurveTo(cx + 67, browY + 11, cx + 42, browY + 8, cx + 22, browY - 1);
  ctx.stroke();

  // 9. Broad High Dario Forehead with Signature Soft Horizontal Creases!
  ctx.strokeStyle = 'rgba(136, 80, 52, 0.36)';
  ctx.lineWidth = 2.8;
  const fh1 = yToC(1.015);
  const fh2 = yToC(0.950);
  const fh3 = yToC(0.888);
  ctx.beginPath();
  ctx.moveTo(cx - 66, fh1);
  ctx.quadraticCurveTo(cx, fh1 + 5, cx + 66, fh1);
  ctx.stroke();

  ctx.lineWidth = 3.0;
  ctx.strokeStyle = 'rgba(136, 80, 52, 0.42)';
  ctx.beginPath();
  ctx.moveTo(cx - 76, fh2);
  ctx.quadraticCurveTo(cx, fh2 + 6, cx + 76, fh2);
  ctx.stroke();

  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(136, 80, 52, 0.28)';
  ctx.beginPath();
  ctx.moveTo(cx - 50, fh3);
  ctx.quadraticCurveTo(cx, fh3 + 4, cx + 50, fh3);
  ctx.stroke();

  // 10. Subtle hairline shadow near base where curly hair meets skin
  const hairEdgeGrad = ctx.createLinearGradient(0, yToC(0.82), 0, H);
  hairEdgeGrad.addColorStop(0, 'rgba(30, 16, 9, 0)');
  hairEdgeGrad.addColorStop(0.45, 'rgba(30, 16, 9, 0.36)');
  hairEdgeGrad.addColorStop(1, 'rgba(20, 11, 6, 0.90)');
  ctx.fillStyle = hairEdgeGrad;
  ctx.fillRect(0, yToC(0.82), W, H - yToC(0.82));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createWoodTableTexture() {
  const W = 1024;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#785236');
  grad.addColorStop(0.5, '#66432b');
  grad.addColorStop(1, '#523420');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 240; i++) {
    const y = (i / 240) * H + (Math.random() - 0.5) * 4;
    const alpha = 0.04 + Math.random() * 0.11;
    ctx.strokeStyle = i % 3 === 0
      ? `rgba(154, 112, 76, ${alpha * 0.72})`
      : `rgba(44, 24, 12, ${alpha})`;
    ctx.lineWidth = 1 + Math.random() * 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    const wave = (Math.random() - 0.5) * 14;
    ctx.bezierCurveTo(W * 0.33, y + wave, W * 0.66, y - wave * 0.7, W, y + wave * 0.4);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(36, 20, 10, 0.32)';
  ctx.lineWidth = 2;
  for (let p = 1; p < 5; p++) {
    const py = (p / 5) * H;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(W, py);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  tex.anisotropy = 8;
  return tex;
}

// Soft cinema-bokeh glowing vertical lamp texture (matches the blurred warm lamp in the video!)
function createBokehLampTexture() {
  const W = 256;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Outer warm golden halo
  const halo = ctx.createRadialGradient(W * 0.5, H * 0.48, 12, W * 0.5, H * 0.48, W * 0.5);
  halo.addColorStop(0.0, 'rgba(255, 232, 172, 0.95)');
  halo.addColorStop(0.35, 'rgba(242, 178, 92, 0.55)');
  halo.addColorStop(0.7, 'rgba(210, 130, 50, 0.18)');
  halo.addColorStop(1.0, 'rgba(210, 130, 50, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Soft blurred bright vertical lamp core (drawn with canvas blur!)
  ctx.save();
  ctx.filter = 'blur(18px)';
  const coreGrad = ctx.createLinearGradient(0, 40, 0, H - 60);
  coreGrad.addColorStop(0, '#f7c572');
  coreGrad.addColorStop(0.45, '#fff3cf');
  coreGrad.addColorStop(0.85, '#f4b862');
  coreGrad.addColorStop(1, '#c87e34');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(W * 0.34, 24, W * 0.32, H - 96, 26);
  } else {
    ctx.rect(W * 0.34, 24, W * 0.32, H - 96);
  }
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSmokeSpriteTexture() {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  const puffs = [
    [64, 64, 54, 0.62],
    [48, 58, 36, 0.46],
    [80, 60, 34, 0.42],
    [62, 48, 32, 0.38],
    [66, 76, 30, 0.36],
  ];
  for (const [x, y, r, a] of puffs) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, `rgba(245, 243, 238, ${a})`);
    g.addColorStop(0.5, `rgba(215, 212, 206, ${a * 0.55})`);
    g.addColorStop(1, 'rgba(180, 178, 172, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGlowTexture(innerColor, outerColor) {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, innerColor);
  g.addColorStop(0.45, outerColor);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// 3D Geometry Builders (Egg Dario Parts & Studio Diorama)
// ============================================================================
function buildDarioGlasses() {
  const glassesGroup = new THREE.Group();

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d2024,
    roughness: 0.26,
    metalness: 0.14,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
  });

  // Subtle low-opacity clear glass so Dario's grey-hazel eyes stay crisp and vivid!
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6f0f8,
    transparent: true,
    opacity: 0.11,
    roughness: 0.05,
    metalness: 0.05,
    reflectivity: 0.9,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
  });

  function createPantoRim(side) {
    const g = new THREE.Group();
    const s = side;

    // Upside-down Dario Panto rim centered around eye height y = 1.29
    const pts2D = [
      [0.09, -0.095],
      [0.20, -0.142],
      [0.38, -0.135],
      [0.49, -0.082],
      [0.51, 0.045],
      [0.45, 0.175],
      [0.31, 0.225],
      [0.17, 0.202],
      [0.09, 0.105],
      [0.075, -0.01],
    ];

    const pts3D = pts2D.map(([lx, ly]) => {
      const wx = lx * s;
      const wy = 1.29 + ly;
      const rSurf = eggRadiusAtY(wy);
      const wz = Math.sqrt(Math.max(0.12, (rSurf + 0.055) ** 2 - wx * wx * 0.82));
      return new THREE.Vector3(wx, wy, wz);
    });

    const curve = new THREE.CatmullRomCurve3(pts3D, true, 'centripetal', 0.45);
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.024, 10, true);
    const rimMesh = new THREE.Mesh(tubeGeo, frameMat);
    rimMesh.castShadow = true;
    g.add(rimMesh);

    // Thicker browbar along the bottom (upside-down top of frames)
    const browPts = [pts3D[0], pts3D[1], pts3D[2], pts3D[3]].map(
      (p) => new THREE.Vector3(p.x, p.y - 0.008, p.z + 0.006)
    );
    const browCurve = new THREE.CatmullRomCurve3(browPts);
    const browMesh = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 18, 0.028, 8, false), frameMat);
    g.add(browMesh);

    // Translucent lens curved to fit frame
    const shape = new THREE.Shape();
    pts2D.forEach(([lx, ly], idx) => {
      if (idx === 0) shape.moveTo(lx * s, ly);
      else shape.lineTo(lx * s, ly);
    });
    shape.closePath();
    const lensGeo = new THREE.ShapeGeometry(shape, 24);
    const pos = lensGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const wy = 1.29 + vy;
      const rSurf = eggRadiusAtY(wy);
      const vz = Math.sqrt(Math.max(0.12, (rSurf + 0.048) ** 2 - vx * vx * 0.82));
      pos.setXYZ(i, vx, wy, vz);
    }
    lensGeo.computeVertexNormals();
    g.add(new THREE.Mesh(lensGeo, lensMat));

    // Temple arm wrapping smoothly back to Dario's ear
    const armPts = [
      new THREE.Vector3(0.50 * s, 1.20, 0.85),
      new THREE.Vector3(0.70 * s, 1.20, 0.72),
      new THREE.Vector3(0.89 * s, 1.21, 0.44),
      new THREE.Vector3(0.95 * s, 1.22, 0.08),
      new THREE.Vector3(0.93 * s, 1.20, -0.15),
    ];
    const armCurve = new THREE.CatmullRomCurve3(armPts);
    const armMesh = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 20, 0.020, 8, false), frameMat);
    armMesh.castShadow = true;
    g.add(armMesh);

    return g;
  }

  glassesGroup.add(createPantoRim(-1));
  glassesGroup.add(createPantoRim(1));

  // Keyhole bridge saddle
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.095, 1.205, 0.99),
    new THREE.Vector3(-0.04, 1.19, 1.028),
    new THREE.Vector3(0.0, 1.186, 1.036),
    new THREE.Vector3(0.04, 1.19, 1.028),
    new THREE.Vector3(0.095, 1.205, 0.99),
  ]);
  glassesGroup.add(new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 14, 0.024, 8, false), frameMat));

  return glassesGroup;
}

function buildDarioNose() {
  const noseGroup = new THREE.Group();
  const noseMat = new THREE.MeshPhysicalMaterial({
    color: 0xd48a66,
    roughness: 0.58,
    sheen: 0.24,
    sheenRoughness: 0.76,
    sheenColor: 0xffdfc8,
  });

  // Prominent softly rounded bulbous nose tip (centered at y = 1.52)
  const tipGeo = new THREE.SphereGeometry(0.115, 24, 20);
  tipGeo.scale(1.12, 0.95, 1.14);
  const tipMesh = new THREE.Mesh(tipGeo, noseMat);
  tipMesh.position.set(0, 1.52, 0.96);
  tipMesh.castShadow = true;
  noseGroup.add(tipMesh);

  // Nose bridge tapering between glasses
  const bridgeGeo = new THREE.CapsuleGeometry(0.068, 0.22, 10, 16);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, noseMat);
  bridgeMesh.position.set(0, 1.40, 0.925);
  bridgeMesh.rotation.x = 0.22;
  bridgeMesh.castShadow = true;
  noseGroup.add(bridgeMesh);

  // Rounded nostril wings (alae)
  const wingGeo = new THREE.SphereGeometry(0.064, 16, 14);
  wingGeo.scale(1.05, 0.84, 0.95);
  const wingL = new THREE.Mesh(wingGeo, noseMat);
  wingL.position.set(-0.095, 1.535, 0.915);
  const wingR = new THREE.Mesh(wingGeo, noseMat);
  wingR.position.set(0.095, 1.535, 0.915);
  noseGroup.add(wingL, wingR);

  // Nostril hollows
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x62311e, roughness: 0.92 });
  const holeGeo = new THREE.SphereGeometry(0.027, 12, 10);
  holeGeo.scale(1.25, 0.65, 0.8);
  const holeL = new THREE.Mesh(holeGeo, holeMat);
  holeL.position.set(-0.058, 1.585, 0.945);
  holeL.rotation.z = -0.22;
  const holeR = new THREE.Mesh(holeGeo, holeMat);
  holeR.position.set(0.058, 1.585, 0.945);
  holeR.rotation.z = 0.22;
  noseGroup.add(holeL, holeR);

  return noseGroup;
}

function buildCurlyHair() {
  const hairGroup = new THREE.Group();

  // Tighter, softer matte organic curl puff (radius 0.145 -> plush cohesive afro!)
  const puffGeo = new THREE.IcosahedronGeometry(0.145, 2);
  const pos = puffGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + 0.14 * Math.sin(x * 20 + y * 15) * Math.cos(z * 18);
    pos.setXYZ(i, x * n, y * n, z * n);
  }
  puffGeo.computeVertexNormals();

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.01,
  });

  // Cohesive rich dark espresso-brown palette (matches video & Dario's hair!)
  const palette = [
    new THREE.Color('#190f09'),
    new THREE.Color('#21140c'),
    new THREE.Color('#28180e'),
    new THREE.Color('#2f1c11'),
    new THREE.Color('#24150c'),
    new THREE.Color('#341f13'),
  ];

  let seed = 7331;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const transforms = [];
  const colors = [];

  // 1. Dense plush hair cushion resting cleanly on wooden tabletop (y = 0.08..0.52)
  for (let ring = 0; ring < 6; ring++) {
    const frac = ring / 5;
    const count = ring === 0 ? 1 : Math.round(9 + ring * 8);
    const rRing = frac * 0.84;
    const yBase = 0.12 + frac * frac * 0.26;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.41;
      const jitterR = (rand() - 0.5) * 0.08;
      const x = Math.cos(a) * (rRing + jitterR);
      const z = Math.sin(a) * (rRing + jitterR);
      const y = Math.max(0.095, yBase + (rand() - 0.5) * 0.07);
      const s = 0.85 + rand() * 0.45;
      transforms.push({ x, y, z, sx: s, sy: s * 0.72, sz: s, rx: rand() * 6, ry: rand() * 6, rz: rand() * 6 });
      colors.push(palette[Math.floor(rand() * palette.length)]);
    }
  }

  // 2. Sculpted dense curly afro wrap around circumference:
  //    - Front (+Z): recedes cleanly below Dario's broad high forehead (y <= 0.74)
  //    - Sides (±X temples): rises smoothly toward glasses arms (y <= 0.98)
  //    - Back (-Z): lush tall curly mop matching frame 00:01 (y <= 1.18)
  for (let layer = 0; layer < 5; layer++) {
    const count = 26 + layer * 4;
    for (let i = 0; i < count; i++) {
      const phi = (i / count) * Math.PI * 2 + layer * 0.19;
      const frontFactor = Math.cos(phi);
      const sideFactor = Math.abs(Math.sin(phi));

      let maxH;
      if (frontFactor > 0.2) {
        maxH = 0.74 - 0.06 * Math.pow(frontFactor, 2) + 0.06 * sideFactor;
      } else {
        maxH = 0.82 + 0.36 * Math.max(0, -frontFactor) + 0.18 * sideFactor;
      }

      const y = 0.30 + (layer / 4.1) * (maxH - 0.24) + (rand() - 0.5) * 0.06;
      if (y > maxH + 0.04) continue;

      const rEgg = eggRadiusAtY(Math.max(EGG_Y_CENTER - EGG_HALF_H + 0.05, y));
      const rOut = Math.max(0.72, rEgg + 0.055) + (rand() - 0.35) * 0.07;
      const x = Math.sin(phi) * rOut;
      const z = Math.cos(phi) * rOut;

      const s = 0.84 + rand() * 0.44;
      transforms.push({ x, y, z, sx: s, sy: s * 0.92, sz: s, rx: rand() * 6, ry: rand() * 6, rz: rand() * 6 });
      colors.push(palette[Math.floor(rand() * palette.length)]);
    }
  }

  // Extra dense back-of-head fill puffs so the bare-back view (00:01) has a lush, gapless hairline
  for (let i = 0; i < 18; i++) {
    const phi = Math.PI + ((i / 17) - 0.5) * 2.1;
    const y = 0.72 + (i % 3) * 0.14;
    const rOut = eggRadiusAtY(y) + 0.04;
    const s = 0.92 + rand() * 0.32;
    transforms.push({
      x: Math.sin(phi) * rOut,
      y,
      z: Math.cos(phi) * rOut,
      sx: s,
      sy: s * 0.9,
      sz: s,
      rx: rand() * 6,
      ry: rand() * 6,
      rz: rand() * 6,
    });
    colors.push(palette[Math.floor(rand() * palette.length)]);
  }

  const inst = new THREE.InstancedMesh(puffGeo, hairMat, transforms.length);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  transforms.forEach((t, idx) => {
    dummy.position.set(t.x, t.y, t.z);
    dummy.rotation.set(t.rx, t.ry, t.rz);
    dummy.scale.set(t.sx, t.sy, t.sz);
    dummy.updateMatrix();
    inst.setMatrixAt(idx, dummy.matrix);
    inst.setColorAt(idx, colors[idx]);
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  hairGroup.add(inst);

  // 3. Fine delicate spiral curl tendrils (subtle wisps peeking onto forehead & sides!)
  const tendrilMat = new THREE.MeshStandardMaterial({
    color: 0x2a190f,
    roughness: 0.86,
  });

  // Forehead curly wisps
  [-0.44, -0.20, 0.06, 0.28, 0.48].forEach((phi, idx) => {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const f = k / 8;
      const a = phi + Math.sin(f * Math.PI * 2 + idx) * 0.055;
      const y = 0.72 + f * 0.13;
      const r = eggRadiusAtY(y) + 0.016 + Math.sin(f * Math.PI) * 0.018;
      pts.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    hairGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.014, 6, false), tendrilMat));
  });

  // Subtle flicked side curls (hugging the silhouette neatly!)
  for (let i = 0; i < 14; i++) {
    const phi = (i / 14) * Math.PI * 2 + 0.25;
    const baseY = 0.44 + (i % 3) * 0.14;
    const rBase = 0.90 + (i % 2) * 0.05;
    const pts = [];
    for (let k = 0; k <= 9; k++) {
      const f = k / 9;
      const spiralA = phi + f * 0.34 * (i % 2 === 0 ? 1 : -1);
      const r = rBase + Math.sin(f * Math.PI) * 0.10 + f * 0.04;
      const y = baseY + Math.sin(f * Math.PI * 1.3) * 0.08;
      pts.push(new THREE.Vector3(Math.sin(spiralA) * r, y, Math.cos(spiralA) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    hairGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.016, 6, false), tendrilMat));
  }

  return hairGroup;
}

function buildPurpleSneaker() {
  const shoe = new THREE.Group();

  const upperMat = new THREE.MeshStandardMaterial({
    color: 0x62466a,
    roughness: 0.68,
    metalness: 0.04,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0x917c99,
    roughness: 0.78,
  });
  const laceMat = new THREE.MeshStandardMaterial({
    color: 0xb7a4be,
    roughness: 0.6,
  });

  const upperGeo = new THREE.BoxGeometry(0.24, 0.18, 0.42);
  const uPos = upperGeo.attributes.position;
  for (let i = 0; i < uPos.count; i++) {
    let x = uPos.getX(i);
    let y = uPos.getY(i);
    let z = uPos.getZ(i);
    if (z > 0.05) {
      x *= 0.86;
      y *= 0.85;
    }
    uPos.setXYZ(i, x, y, z);
  }
  upperGeo.computeVertexNormals();
  const upper = new THREE.Mesh(upperGeo, upperMat);
  upper.position.set(0, 0.10, 0.06);
  upper.castShadow = true;
  shoe.add(upper);

  const toeGeo = new THREE.SphereGeometry(0.115, 16, 12);
  toeGeo.scale(1.0, 0.78, 1.15);
  const toe = new THREE.Mesh(toeGeo, upperMat);
  toe.position.set(0, 0.10, 0.24);
  toe.castShadow = true;
  shoe.add(toe);

  const soleShape = new THREE.Shape();
  soleShape.absellipse(0, 0.08, 0.145, 0.265, 0, Math.PI * 2, false, 0);
  const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
    depth: 0.068,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 3,
  });
  soleGeo.rotateX(Math.PI / 2);
  const sole = new THREE.Mesh(soleGeo, soleMat);
  sole.position.set(0, 0.245, 0.0);
  sole.castShadow = true;
  shoe.add(sole);

  for (let i = 0; i < 3; i++) {
    const lace = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.10, 4, 6), laceMat);
    lace.rotation.z = Math.PI / 2;
    lace.position.set(0, 0.015, 0.08 + i * 0.055);
    shoe.add(lace);
  }

  return shoe;
}

function buildStubbyArm(side) {
  const armPivot = new THREE.Group();
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4946a,
    roughness: 0.58,
    sheen: 0.22,
    sheenRoughness: 0.76,
    sheenColor: 0xffe2c8,
  });

  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = t * 0.68;
    const r = t < 0.85
      ? 0.142 * (1 - 0.34 * t)
      : 0.142 * (1 - 0.34 * 0.85) * Math.cos(((t - 0.85) / 0.15) * (Math.PI / 2));
    pts.push(new THREE.Vector2(Math.max(0.001, r), x));
  }
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.rotateZ(-Math.PI / 2 * side);
  const mesh = new THREE.Mesh(geo, skinMat);
  mesh.castShadow = true;
  armPivot.add(mesh);

  const blurMat = new THREE.MeshBasicMaterial({
    color: 0xf9c67a,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const trailGeo = new THREE.RingGeometry(0.18, 0.88, 24, 1, side > 0 ? -0.48 : Math.PI - 0.48, 0.96);
  trailGeo.rotateX(-Math.PI / 2);
  const trail = new THREE.Mesh(trailGeo, blurMat);
  armPivot.add(trail);

  return { armPivot, blurMat };
}

function buildStudioEnvironment(scene) {
  // 1. Polished wooden tabletop (y = 0)
  const woodTex = createWoodTableTexture();
  const tableGeo = new THREE.BoxGeometry(22, 0.6, 14);
  const tableMat = new THREE.MeshPhysicalMaterial({
    map: woodTex,
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.32,
    clearcoatRoughness: 0.3,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, -0.3, 0);
  table.receiveShadow = true;
  scene.add(table);

  // 2. Dark warm olive-charcoal studio backdrop wall
  const wallGeo = new THREE.PlaneGeometry(28, 16);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x292d22,
    roughness: 0.94,
    metalness: 0.0,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 5.2, -5.2);
  scene.add(wall);

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e2119, roughness: 0.92 });
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 14, 0.35), panelMat);
  pillar.position.set(4.1, 5.0, -5.05);
  scene.add(pillar);

  // 3. Soft Cinema-Bokeh Glowing Warm Lamp (matches blurred golden lamp in video!)
  const bokehLampTex = createBokehLampTexture();
  const lampSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: bokehLampTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
    })
  );
  lampSprite.position.set(-2.55, 2.75, -3.9);
  lampSprite.scale.set(2.45, 4.9, 1);
  scene.add(lampSprite);

  // 4. Sculpted dark-olive background houseplant (far left)
  const plantGroup = new THREE.Group();
  plantGroup.position.set(-3.95, 0.0, -3.35);
  const leafPalette = [0x222c15, 0x2c391b, 0x253017, 0x1c2411];
  const leafAngles = [
    [-0.42, 0.3, 1.9],
    [-0.12, 0.1, 2.35],
    [0.24, 0.0, 2.2],
    [0.56, -0.15, 1.85],
    [0.82, -0.35, 1.45],
    [-0.65, 0.45, 1.55],
  ];
  leafAngles.forEach(([rz, ry, len], idx) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.24, len * 0.45, 0, len);
    shape.quadraticCurveTo(-0.24, len * 0.45, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 10);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const py = p.getY(k);
      p.setZ(k, -Math.pow(py / len, 2) * 0.42);
    }
    geo.computeVertexNormals();
    const leaf = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: leafPalette[idx % leafPalette.length],
        roughness: 0.85,
        side: THREE.DoubleSide,
      })
    );
    leaf.rotation.set(0.15, ry, rz);
    plantGroup.add(leaf);
  });
  scene.add(plantGroup);

  // 5. Balanced Warm Pixar-Style Studio Lighting Rig
  const ambient = new THREE.HemisphereLight(0xffe6c7, 0x38281c, 0.46);
  scene.add(ambient);

  const lampLight = new THREE.PointLight(0xffc26c, 11.5, 15, 1.65);
  lampLight.position.set(-2.4, 2.6, -1.4);
  scene.add(lampLight);

  const keyDir = new THREE.DirectionalLight(0xffeede, 1.38);
  keyDir.position.set(-1.9, 5.0, 4.4);
  keyDir.castShadow = true;
  keyDir.shadow.mapSize.set(1024, 1024);
  keyDir.shadow.camera.near = 1;
  keyDir.shadow.camera.far = 15;
  keyDir.shadow.camera.left = -3.2;
  keyDir.shadow.camera.right = 3.2;
  keyDir.shadow.camera.top = 3.8;
  keyDir.shadow.camera.bottom = -1.5;
  keyDir.shadow.bias = -0.0005;
  keyDir.shadow.radius = 4;
  scene.add(keyDir);

  const rimLight = new THREE.DirectionalLight(0x9fb49e, 0.72);
  rimLight.position.set(3.8, 2.6, -1.8);
  scene.add(rimLight);

  const frictionLight = new THREE.PointLight(0xff9b38, 0, 5.5, 1.8);
  frictionLight.position.set(0, 0.28, 0.25);
  scene.add(frictionLight);

  const frictionGlowMat = new THREE.MeshBasicMaterial({
    map: createGlowTexture('rgba(255, 198, 102, 0.72)', 'rgba(240, 128, 40, 0.22)'),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const frictionDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), frictionGlowMat);
  frictionDecal.rotation.x = -Math.PI / 2;
  frictionDecal.position.y = 0.008;
  scene.add(frictionDecal);

  return { frictionLight, frictionGlowMat, lampSprite };
}

// ============================================================================
// 3D Particle VFX System (Billowing Friction Smoke & Bouncing Golden Sparks!)
// ============================================================================
function createVFXSystem(scene) {
  const vfxGroup = new THREE.Group();
  scene.add(vfxGroup);

  const smokeTex = createSmokeSpriteTexture();
  const smokeCount = 44;
  const smokes = [];
  for (let i = 0; i < smokeCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0xf0eee9,
    });
    const sp = new THREE.Sprite(mat);
    sp.visible = false;
    vfxGroup.add(sp);
    smokes.push({
      sprite: sp,
      mat,
      life: Math.random(),
      maxLife: 0.65 + Math.random() * 0.55,
      vx: 0,
      vy: 0,
      vz: 0,
      rotSpeed: (Math.random() - 0.5) * 2.5,
      baseScale: 0.48 + Math.random() * 0.36,
    });
  }

  const sparkCount = 84;
  const sparkGeo = new THREE.BoxGeometry(0.025, 0.025, 0.16);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffe696,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
  sparkInst.frustumCulled = false;
  vfxGroup.add(sparkInst);

  const sparks = [];
  const sparkColors = [
    new THREE.Color('#fffbe0'),
    new THREE.Color('#ffdc75'),
    new THREE.Color('#ffb23e'),
    new THREE.Color('#ff8426'),
  ];
  for (let i = 0; i < sparkCount; i++) {
    sparks.push({
      active: false,
      life: Math.random(),
      maxLife: 0.28 + Math.random() * 0.42,
      pos: new THREE.Vector3(0, -10, 0),
      vel: new THREE.Vector3(),
      fromArm: i % 5 === 0,
    });
    sparkInst.setColorAt(i, sparkColors[i % sparkColors.length]);
  }
  if (sparkInst.instanceColor) sparkInst.instanceColor.needsUpdate = true;

  const dummy = new THREE.Object3D();
  const lookTarget = new THREE.Vector3();

  function respawnSmoke(s) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const angle = (side > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.35;
    const r = 0.64 + Math.random() * 0.26;
    s.sprite.position.set(Math.cos(angle) * r, 0.14 + Math.random() * 0.18, Math.sin(angle) * r * 0.72);
    const speed = 1.55 + Math.random() * 1.45;
    s.vx = Math.cos(angle) * speed;
    s.vy = 0.30 + Math.random() * 0.58;
    s.vz = Math.sin(angle) * speed * 0.62;
    s.life = 0;
    s.maxLife = 0.68 + Math.random() * 0.52;
    s.sprite.visible = true;
  }

  function respawnSpark(sp) {
    sp.life = 0;
    sp.maxLife = 0.26 + Math.random() * 0.42;
    sp.active = true;
    const angle = Math.random() * Math.PI * 2;
    if (sp.fromArm) {
      const side = Math.random() < 0.5 ? -1 : 1;
      sp.pos.set(side * (1.12 + Math.random() * 0.35), 1.36 + (Math.random() - 0.5) * 0.16, (Math.random() - 0.5) * 0.35);
      sp.vel.set(side * (2.6 + Math.random() * 2.2), 0.4 + Math.random() * 1.2, (Math.random() - 0.5) * 2.4);
    } else {
      const r = 0.78 + Math.random() * 0.18;
      sp.pos.set(Math.cos(angle) * r, 0.08 + Math.random() * 0.14, Math.sin(angle) * r);
      const speed = 2.5 + Math.random() * 3.1;
      sp.vel.set(
        Math.cos(angle) * speed - Math.sin(angle) * speed * 0.45,
        0.80 + Math.random() * 2.2,
        Math.sin(angle) * speed + Math.cos(angle) * speed * 0.45
      );
    }
  }

  function update(dt, turboIntensity) {
    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        if (turboIntensity > 0.15 && Math.random() < turboIntensity) {
          respawnSmoke(s);
        } else {
          s.sprite.visible = false;
          continue;
        }
      }
      if (!s.sprite.visible) continue;
      const p = s.life / s.maxLife;
      s.sprite.position.x += s.vx * dt;
      s.sprite.position.y += s.vy * dt;
      s.sprite.position.z += s.vz * dt;
      s.vx *= Math.pow(0.28, dt);
      s.vz *= Math.pow(0.28, dt);
      s.vy += 0.38 * dt;
      s.mat.rotation += s.rotSpeed * dt;
      const scale = s.baseScale * (0.58 + p * 2.15);
      s.sprite.scale.set(scale * 1.28, scale * 0.92, 1);
      const env = Math.sin(Math.min(1, p) * Math.PI);
      s.mat.opacity = env * 0.56 * Math.max(0.28, turboIntensity);
    }

    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        if (turboIntensity > 0.25 && Math.random() < turboIntensity) {
          respawnSpark(sp);
        } else {
          sp.active = false;
        }
      }
      if (!sp.active) {
        dummy.position.set(0, -20, 0);
        dummy.scale.set(0.001, 0.001, 0.001);
        dummy.updateMatrix();
        sparkInst.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const p = sp.life / sp.maxLife;
      sp.vel.y -= 6.8 * dt;
      sp.pos.addScaledVector(sp.vel, dt);
      if (sp.pos.y < 0.025) {
        sp.pos.y = 0.025;
        sp.vel.y = Math.abs(sp.vel.y) * 0.45;
        sp.vel.x *= 0.78;
        sp.vel.z *= 0.78;
      }
      dummy.position.copy(sp.pos);
      lookTarget.copy(sp.pos).add(sp.vel);
      dummy.lookAt(lookTarget);
      const speedLen = Math.min(2.4, 0.6 + sp.vel.length() * 0.30);
      const fade = 1 - p;
      dummy.scale.set(fade * 1.15, fade * 1.15, speedLen * fade);
      dummy.updateMatrix();
      sparkInst.setMatrixAt(i, dummy.matrix);
    }
    sparkInst.instanceMatrix.needsUpdate = true;
  }

  return { update };
}

// ============================================================================
// Main App Entry Point
// ============================================================================
export function initEggDario3D(container, options = {}) {
  const width = container.clientWidth || 640;
  const height = container.clientHeight || 360;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x22251c);
  scene.fog = new THREE.FogExp2(0x22251c, 0.056);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.34;

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);

  const studio = buildStudioEnvironment(scene);

  // ==========================================================================
  // Assemble 3D Egg Dario Rig
  // ==========================================================================
  const darioRoot = new THREE.Group();
  const tiltPivot = new THREE.Group();
  const spinGroup = new THREE.Group();
  darioRoot.add(tiltPivot);
  tiltPivot.add(spinGroup);
  scene.add(darioRoot);

  // 1. Smooth Rounded 3D Egg Body (zero pointy poles!)
  const eggPts = [];
  const eggSteps = 56;
  for (let i = 0; i <= eggSteps; i++) {
    const t = i / eggSteps;
    eggPts.push(new THREE.Vector2(eggRadiusAtT(t), eggYAtT(t)));
  }
  const eggGeo = new THREE.LatheGeometry(eggPts, 64, -Math.PI, Math.PI * 2);
  const faceTex = createDarioFaceTexture();
  const eggMat = new THREE.MeshPhysicalMaterial({
    map: faceTex,
    roughness: 0.58,
    metalness: 0.0,
    sheen: 0.24,
    sheenRoughness: 0.76,
    sheenColor: new THREE.Color(0xffe0c4),
  });
  const eggMesh = new THREE.Mesh(eggGeo, eggMat);
  eggMesh.castShadow = true;
  eggMesh.receiveShadow = true;
  spinGroup.add(eggMesh);

  // 2. Sculpted 3D Nose, Ears & Iconic Dark Panto Glasses
  spinGroup.add(buildDarioNose());
  spinGroup.add(buildDarioGlasses());

  const earMat = new THREE.MeshPhysicalMaterial({ color: 0xd08e64, roughness: 0.6 });
  const earGeo = new THREE.SphereGeometry(0.145, 16, 14);
  earGeo.scale(0.55, 1.05, 0.72);
  const earL = new THREE.Mesh(earGeo, earMat);
  earL.position.set(-0.93, 1.22, 0.04);
  earL.castShadow = true;
  const earR = new THREE.Mesh(earGeo, earMat);
  earR.position.set(0.93, 1.22, 0.04);
  earR.castShadow = true;
  spinGroup.add(earL, earR);

  // 3. Plush Dense 3D Instanced Curly Hair Mop
  const hairGroup = buildCurlyHair();
  spinGroup.add(hairGroup);

  const hairBlurMat = new THREE.MeshBasicMaterial({
    color: 0x3b332e,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const hairBlurRing = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 0.96, 0.56, 36, 1, true), hairBlurMat);
  hairBlurRing.position.y = 0.36;
  spinGroup.add(hairBlurRing);

  // 4. Articulated 3D Stubby Arms
  const leftArm = buildStubbyArm(-1);
  leftArm.armPivot.position.set(-0.88, 1.44, 0.0);
  const rightArm = buildStubbyArm(1);
  rightArm.armPivot.position.set(0.88, 1.44, 0.0);
  spinGroup.add(leftArm.armPivot, rightArm.armPivot);

  // 5. 3D Stubby Legs & Chunky Purple Sneakers on rounded top dome
  const legsGroup = new THREE.Group();
  const legMat = new THREE.MeshPhysicalMaterial({ color: 0xd6966c, roughness: 0.58 });
  const legGeo = new THREE.CapsuleGeometry(0.115, 0.24, 10, 16);

  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.23, 2.30, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.23, 2.30, 0);
  legR.castShadow = true;
  legsGroup.add(legL, legR);

  const shoeL = buildPurpleSneaker();
  shoeL.position.set(-0.23, 2.45, 0);
  const shoeR = buildPurpleSneaker();
  shoeR.position.set(0.23, 2.45, 0);
  legsGroup.add(shoeL, shoeR);
  spinGroup.add(legsGroup);

  // Softly rounded translucent purple shoe motion-blur rotor (00:02!)
  const shoeRotorMat = new THREE.MeshStandardMaterial({
    color: 0x6a4d73,
    roughness: 0.6,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const shoeRotorGeo = new THREE.SphereGeometry(0.46, 32, 16);
  shoeRotorGeo.scale(1.0, 0.28, 1.0);
  const shoeRotor = new THREE.Mesh(shoeRotorGeo, shoeRotorMat);
  shoeRotor.position.set(0, 2.58, 0);
  spinGroup.add(shoeRotor);

  // 6. 3D VFX Particles
  const vfx = createVFXSystem(scene);

  // ==========================================================================
  // Smooth Interactive Pointer Orbit & Two-Finger Pinch Zoom Camera Controls
  // ==========================================================================
  const defaultDistanceForAspect = (asp) => (asp < 1 ? Math.min(11.0, 6.45 / Math.max(0.54, asp)) : 6.45);
  const initDist = defaultDistanceForAspect(width / height);
  const camState = {
    azimuth: 0.0,
    elevation: 0.14,
    distance: initDist,
    targetAzimuth: 0.0,
    targetElevation: 0.14,
    targetDistance: initDist,
    flipped: false,
  };

  const activePointers = new Map();
  let lastPinchDist = 0;

  const dom = renderer.domElement;
  dom.style.cursor = 'grab';
  dom.style.touchAction = 'none';

  dom.addEventListener('pointerdown', (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dom.style.cursor = 'grabbing';
    try { dom.setPointerCapture(e.pointerId); } catch (_) {}
    if (activePointers.size === 2) {
      const [p1, p2] = [...activePointers.values()];
      lastPinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
  });
  dom.addEventListener('pointermove', (e) => {
    const prev = activePointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (activePointers.size === 1) {
      const sign = camState.flipped ? -1 : 1;
      camState.targetAzimuth -= dx * 0.0085 * sign;
      camState.targetElevation = Math.max(-0.18, Math.min(1.05, camState.targetElevation + dy * 0.0065 * sign));
    } else if (activePointers.size === 2) {
      const [p1, p2] = [...activePointers.values()];
      const pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (lastPinchDist > 0) {
        const delta = lastPinchDist - pinchDist;
        camState.targetDistance = Math.max(3.6, Math.min(12.5, camState.targetDistance + delta * 0.02));
      }
      lastPinchDist = pinchDist;
    }
  });
  const endDrag = (e) => {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) lastPinchDist = 0;
    if (activePointers.size === 0) dom.style.cursor = 'grab';
  };
  dom.addEventListener('pointerup', endDrag);
  dom.addEventListener('pointercancel', endDrag);
  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    camState.targetDistance = Math.max(3.6, Math.min(12.5, camState.targetDistance + e.deltaY * 0.004));
  }, { passive: false });

  // ==========================================================================
  // Animation State & Choreography
  // ==========================================================================
  const state = {
    mode: options.initialMode || 'full',
    paused: false,
    speed: 1.0,
    cycleTime: options.initialTime || 0,
    spinAngle: 0,
    spinVel: 0,
    vfxWarmupDone: false,
  };

  const CYCLE_DUR = 6.5;

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smoothstep(a, b, x) {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  }

  function stepSimulation(dt) {
    let turbo = 0;
    let tiltX = 0;
    let tiltZ = 0;
    let armDroop = 0;
    let bounceY = 0;
    let squashXZ = 1;
    let squashY = 1;

    if (state.mode === 'face') {
      state.spinAngle = THREE.MathUtils.lerp(state.spinAngle, 0, Math.min(1, dt * 8));
      state.spinVel = 0;
      tiltX = 0;
      armDroop = -0.04;
      turbo = 0;
    } else if (state.mode === 'turbo') {
      turbo = 1.0;
      state.spinVel = 28.0;
      state.spinAngle += state.spinVel * dt;
      const tNow = performance.now() * 0.001;
      tiltX = Math.sin(tNow * 21) * 0.042;
      tiltZ = Math.cos(tNow * 19) * 0.042;
      armDroop = 0.03;
      bounceY = Math.abs(Math.sin(tNow * 24)) * 0.032;
      squashXZ = 1.03;
      squashY = 0.97;
    } else {
      state.cycleTime = (state.cycleTime + dt) % CYCLE_DUR;
      const t = state.cycleTime;

      const diveOut = smoothstep(0.35, 1.05, t);
      const diveBack = smoothstep(5.75, 6.45, t);
      const upright = diveOut * (1 - diveBack);

      tiltX = (1 - upright) * 1.18;
      tiltZ = (1 - upright) * Math.sin(t * 7.5) * 0.10;

      const turboRamp = smoothstep(2.25, 2.95, t) * (1 - smoothstep(5.15, 5.75, t));
      turbo = turboRamp;
      armDroop = (1 - upright) * -0.45 + upright * (1 - turboRamp) * -0.18 + turboRamp * 0.04;

      if (t < 1.05) {
        state.spinAngle = Math.PI * (0.85 + 0.15 * diveOut);
        state.spinVel = 0.8;
      } else if (t < 2.35) {
        const p = (t - 1.05) / 1.30;
        const eased = p * 0.55 + p * p * 1.45;
        state.spinAngle = Math.PI + eased * Math.PI * 1.35;
        state.spinVel = 3.5 + p * 12;
      } else if (t < 5.65) {
        state.spinVel = 5.0 + turboRamp * 24.5;
        state.spinAngle += state.spinVel * dt;
      } else {
        state.spinVel = Math.max(0.5, state.spinVel * Math.pow(0.08, dt));
        state.spinAngle += state.spinVel * dt;
      }

      if (turboRamp > 0.05) {
        tiltX += Math.sin(t * 23) * 0.04 * turboRamp;
        tiltZ += Math.cos(t * 20) * 0.04 * turboRamp;
        bounceY = Math.abs(Math.sin(t * 25)) * 0.03 * turboRamp;
      }
      squashXZ = 1 + (1 - upright) * 0.04 + turboRamp * 0.03;
      squashY = 1 - (1 - upright) * 0.05 - turboRamp * 0.03;
    }

    tiltPivot.rotation.set(tiltX, 0, tiltZ);
    spinGroup.rotation.y = state.spinAngle;
    darioRoot.position.y = bounceY;
    darioRoot.scale.set(squashXZ, squashY, squashXZ);

    leftArm.armPivot.rotation.z = -armDroop;
    rightArm.armPivot.rotation.z = armDroop;
    leftArm.blurMat.opacity = turbo * 0.45;
    rightArm.blurMat.opacity = turbo * 0.45;

    hairBlurMat.opacity = turbo * 0.42;
    shoeRotorMat.opacity = turbo * 0.72;
    shoeRotor.rotation.y = -state.spinAngle * 0.5;
    shoeL.scale.setScalar(1 - turbo * 0.25);
    shoeR.scale.setScalar(1 - turbo * 0.25);

    const flicker = 0.85 + 0.15 * Math.sin(performance.now() * 0.035);
    studio.frictionLight.intensity = turbo * 7.5 * flicker;
    studio.frictionGlowMat.opacity = turbo * 0.65 * flicker;

    const lampBreath = 0.97 + 0.03 * Math.sin(performance.now() * 0.002);
    studio.lampSprite.scale.set(2.45 * lampBreath, 4.9 * lampBreath, 1);

    vfx.update(dt, turbo);
  }

  function updateCamera(dt) {
    const damp = 1 - Math.exp(-dt * 9);
    camState.azimuth += (camState.targetAzimuth - camState.azimuth) * damp;
    camState.elevation += (camState.targetElevation - camState.elevation) * damp;
    camState.distance += (camState.targetDistance - camState.distance) * damp;

    const targetY = 1.35;
    const x = Math.sin(camState.azimuth) * Math.cos(camState.elevation) * camState.distance;
    const y = targetY + Math.sin(camState.elevation) * camState.distance;
    const z = Math.cos(camState.azimuth) * Math.cos(camState.elevation) * camState.distance;

    camera.position.set(x, Math.max(0.25, y), z);
    camera.up.set(0, camState.flipped ? -1 : 1, 0);
    camera.lookAt(0, targetY, 0);
  }

  function jumpToPose(poseName) {
    if (poseName === 'face') {
      state.mode = 'face';
      state.spinAngle = 0;
      stepSimulation(0.016);
    } else if (poseName === 'back') {
      state.mode = 'full';
      state.cycleTime = 1.12;
      stepSimulation(0.016);
    } else if (poseName === 'dive') {
      state.mode = 'full';
      state.cycleTime = 0.15;
      stepSimulation(0.016);
    } else if (poseName === 'turbo') {
      state.mode = 'turbo';
      for (let i = 0; i < 30; i++) stepSimulation(0.03);
    }
    updateCamera(1.0);
    renderer.render(scene, camera);
  }

  let rafId = 0;
  let lastTs = performance.now();

  function animate(now) {
    rafId = requestAnimationFrame(animate);
    const rawDt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;

    if (!state.paused) {
      stepSimulation(rawDt * state.speed);
    }
    updateCamera(rawDt);
    renderer.render(scene, camera);
  }

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  ro.observe(container);

  if (options.initialPose) {
    jumpToPose(options.initialPose);
  } else {
    updateCamera(1.0);
  }

  if (!options.staticFrame) {
    rafId = requestAnimationFrame(animate);
  }

  return {
    setMode(m) {
      state.mode = m;
      if (m === 'turbo' && !state.vfxWarmupDone) {
        state.vfxWarmupDone = true;
        for (let i = 0; i < 12; i++) stepSimulation(0.025);
      }
      if (m !== 'face') state.paused = false;
    },
    setPaused(p) { state.paused = p; },
    isPaused() { return state.paused; },
    setSpeed(s) { state.speed = s; },
    toggleFlip() {
      camState.flipped = !camState.flipped;
      return camState.flipped;
    },
    resetCamera() {
      camState.targetAzimuth = 0;
      camState.targetElevation = 0.14;
      camState.targetDistance = defaultDistanceForAspect(camera.aspect);
    },
    jumpToPose,
    destroy() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
    },
  };
}

if (typeof window !== 'undefined') {
  window.initEggDario3D = initEggDario3D;
}
