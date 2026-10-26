// Sudo en 3D: el personaje hecho de vóxeles (cubos) que se arman de abajo hacia arriba,
// se apartan del cursor o del dedo y estallan con un clic. Modelo de la versión 3D aprobada por Jochi el 26 oct 2026.
// Solo se carga si muro.js decide que hay WebGL, buena conexión y movimiento permitido.
const THREE_URL = new URL("./vendor/three-0.128.0.min.js", import.meta.url);

export function cargar() {
  if (window.THREE) return Promise.resolve({ montar });
  return new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = THREE_URL; s.onload = () => ok({ montar }); s.onerror = mal;
    document.head.append(s);
  });
}

// Modelo de Sudo en vóxeles. Deja window.SudoModelo.
/* Sudo en vóxeles, basado en las fotos reales de Jochi (26 oct 2026).
   construir({ropa, lentes, pixel}) devuelve [{x,y,z,c}]: y hacia arriba, el frente mira a +z,
   +x es la izquierda del personaje (la derecha de quien mira). Unas 75 unidades de alto. */
(function () {
  const C = {
    piel: '#B97A52', pielL: '#C98B62', pielD: '#94603F', labio: '#8C4E3C', barba: '#6B4634',
    pelo: '#17131A', gorra: '#141217', gorraL: '#232028', lente: '#0B0A0E', lenteL: '#2B2A33',
    camiseta: '#141318', camisetaL: '#1E1C24', pantalon: '#121116', pantalonL: '#1B1A21',
    blanco: '#F2F1F4', gris: '#BDBAC4', negro: '#0E0D11', ojo: '#2A1912', ojoB: '#D9CDC2', brillo: '#F6F1EA', parpado: '#3A2418',
    reloj: '#15161B', relojL: '#2C3A58', sello: '#FF3355', tinta: '#1D1F22', tinta2: '#383A40', tintaS: '#6A5650',
    tintaV: '#3C4A34', tintaR: '#6A2E2A', p1: '#9FF3FF', p2: '#2B6F86',
    chaqueta: '#51298F', chaquetaL: '#6838AA', chaquetaD: '#3B1C6B', sudadera: '#141318'
  };

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function ruido(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = t => t * t * (3 - 2 * t);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  }
  const fbm = (x, y) => ruido(x, y) * 0.6 + ruido(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + ruido(x * 4.3 + 1, y * 4.3 + 9) * 0.1;

  function construir(op) {
    op = Object.assign({ ropa: 'camiseta', lentes: 'gorra', pixel: false, pose: 'cintura' }, op || {});
    const V = new Map();
    const k = (x, y, z) => x + ',' + y + ',' + z;
    const set = (x, y, z, c) => V.set(k(x, y, z), { x, y, z, c });
    const get = (x, y, z) => V.get(k(x, y, z));
    const del = (x, y, z) => V.delete(k(x, y, z));
    const caja = (x0, x1, y0, y1, z0, z1, c, r) => {
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
        if (r) {   // esquinas redondeadas en el plano xz
          const dx = Math.max(x0 + r - x, 0, x - (x1 - r)), dz = Math.max(z0 + r - z, 0, z - (z1 - r));
          if (dx * dx + dz * dz > r * r + 0.5) continue;
        }
        set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
      }
    };
    const frente = (x, y) => { for (let z = 20; z > -20; z--) if (get(x, y, z)) return z; return null; };
    const pintarFrente = (x, y, c, sobresale) => { const z = frente(x, y); if (z !== null) set(x, y, sobresale ? z + 1 : z, c); };

    // ---------- tenis blancos ----------
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -8 : 2, x1 = s < 0 ? -2 : 8;
      caja(x0, x1, 0, 1, -4, 8, C.blanco, 2);
      caja(x0, x1, 2, 4, -4, 7, C.blanco, 2);
      caja(x0 + 1, x1 - 1, 5, 5, -3, 3, C.blanco, 1);
      for (let z = -4; z <= 8; z++) for (let x = x0; x <= x1; x++) if (get(x, 0, z)) set(x, 0, z, C.gris);   // suela
      const ext = s < 0 ? x0 : x1;   // detalle negro del lado de afuera
      for (let z = -1; z <= 4; z++) set(ext, 2 + (z > 1 ? 1 : 0), z, C.negro);
      for (let x = x0 + 1; x <= x1 - 1; x++) set(x, 4, 6, C.gris);    // cordones
      for (let x = x0 + 1; x <= x1 - 1; x += 2) set(x, 5, 4, C.gris);
    }

    // ---------- pantalón ----------
    const pant = (x, y, z) => (z === 3 || x === -8 || x === 8) ? C.pantalonL : C.pantalon;
    caja(-8, -2, 6, 30, -3, 3, pant, 1);
    caja(2, 8, 6, 30, -3, 3, pant, 1);
    caja(-8, 8, 27, 33, -4, 4, pant, 1);

    // ---------- torso ----------
    const chaqueta = op.ropa === 'chaqueta';
    const tee = (x, y, z) => (y === 33 || y === 34) ? C.camisetaL : (z === 5 && (x + y) % 7 === 0 ? C.camisetaL : C.camiseta);
    caja(-10, 10, 33, 52, -5, 5, tee, 2);
    caja(-9, 9, 53, 54, -4, 4, tee, 2);
    for (const sx of [-10, 10]) for (let z = -5; z <= 5; z++) { del(sx, 52, z); }
    caja(-10, -10, 33, 49, -4, 4, tee); caja(10, 10, 33, 49, -4, 4, tee);
    // cuello redondo
    for (let x = -3; x <= 3; x++) { set(x, 54, 4, C.camisetaL); }
    if (!chaqueta) {   // el Sello en el pecho
      [[5, 47], [7, 47], [6, 46], [5, 45], [7, 45]].forEach(([x, y]) => set(x, y, 6, C.sello));
    }

    // ---------- brazos con articulaciones (hombro, codo, muñeca) ----------
    const POSES = {
      neutral: { d: [[-13, 48, 0], [-15, 35, 0], [-16, 22, 1]], i: [[13, 48, 0], [15, 35, 0], [16, 22, 1]] },
      cintura: { d: [[-13, 48, 0], [-21, 39, -1], [-13, 31, 3]], i: [[13, 48, 0], [21, 39, -1], [13, 31, 3]] },
      saludo:  { d: [[-12, 50, 0], [-20, 56, 1], [-22, 70, 2]], i: [[12, 50, 0], [15, 36, 0], [16, 22, 1]] },
      bolsillo:{ d: [[-12, 50, 0], [-15, 36, 0], [-16, 22, 1]], i: [[12, 50, 0], [15, 38, -1], [11, 30, 3]] }
    };
    const pose = POSES[op.pose] || POSES.neutral;
    function tatuaje(u, v) {
      const n = fbm(u, v), d = fbm(u * 2.6 + 40, v * 2.6 + 9);
      const t = n * 0.7 + d * 0.3;
      if (t > 0.57) return C.tinta;
      if (t > 0.49) return C.tinta2;
      if (t > 0.43) return C.tintaS;
      if (t < 0.24 && d > 0.55) return C.tintaR;
      return C.piel;
    }
    // rasteriza un cilindro redondeado entre a y b; color(t, ang) con t de 0 (a) a 1 (b)
    function capsula(a, b, r, color) {
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
      const lo = [0, 1, 2].map(i => Math.floor(Math.min(a[i], b[i]) - r - 1)), hi = [0, 1, 2].map(i => Math.ceil(Math.max(a[i], b[i]) + r + 1));
      for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
        const ap = [x - a[0], y - a[1], z - a[2]];
        const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L2));
        const q = [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t];
        const dd = (x - q[0]) ** 2 + (y - q[1]) ** 2 + (z - q[2]) ** 2;
        if (dd <= r * r + 0.3) set(x, y, z, color(t, Math.atan2(z - q[2], x - q[0]), x, y, z));
      }
    }
    const brazos = [['d', -1], ['i', 1]];
    for (const [lado, s] of brazos) {
      const [h, c, m] = pose[lado];
      const largoA = Math.hypot(c[0] - h[0], c[1] - h[1], c[2] - h[2]), largoB = Math.hypot(m[0] - c[0], m[1] - c[1], m[2] - c[2]);
      const piel = (seg, largo) => (t, ang) => tatuaje(ang * 2.2 + s * 11 + seg * 5, (seg ? largoA : 0) * 0.22 + t * largo * 0.22);
      if (chaqueta) {
        // manga inflada: color por altura, igual que el torso, para que las franjas no hagan dientes
        const manga = (t, ang, x, y) => (y % 5 === 0) ? C.chaquetaD : C.chaqueta;
        capsula(h, c, 4.2, manga);
        capsula(c, m, 3.9, (t, ang, x, y) => t > 0.93 ? C.chaquetaD : manga(t, ang, x, y));
      } else {
        capsula(h, c, 3.0, piel(0, largoA));
        capsula(c, m, 2.8, (t, ang) => t > 0.9 ? C.piel : piel(1, largoB)(t, ang));
        // manga ancha de la camiseta oversized: cubre el primer 45% del brazo
        const fin = [h[0] + (c[0] - h[0]) * 0.45, h[1] + (c[1] - h[1]) * 0.45, h[2] + (c[2] - h[2]) * 0.45];
        capsula(h, fin, 4.1, (t) => t > 0.85 ? C.camisetaL : C.camiseta);
        V.forEach((v, key) => { if (v.y > 54 && v.c === C.camiseta && Math.abs(v.x) > 9) V.delete(key); });
      }
      // mano: un poco más ancha, sigue la dirección del antebrazo
      const dir = [m[0] - c[0], m[1] - c[1], m[2] - c[2]].map(v => v / largoB);
      const pm = [m[0] + dir[0] * 2.2, m[1] + dir[1] * 2.2, m[2] + dir[2] * 2.2];
      const mano = op.pixel && lado === 'd' ? (t, ang, x, y, z) => ((x + y + z) & 1 ? C.p1 : C.p2) : () => C.piel;
      capsula(m, pm, 3.0, mano);
      if (lado === 'i' && !chaqueta) {   // reloj en la muñeca izquierda
        const pr = [c[0] + (m[0] - c[0]) * 0.86, c[1] + (m[1] - c[1]) * 0.86, c[2] + (m[2] - c[2]) * 0.86];
        const pr2 = [c[0] + (m[0] - c[0]) * 0.95, c[1] + (m[1] - c[1]) * 0.95, c[2] + (m[2] - c[2]) * 0.95];
        capsula(pr, pr2, 3.0, (t, ang) => (ang > 0.6 && ang < 1.8) ? C.relojL : C.reloj);
      }
    }

    // ---------- chaqueta inflada morada ----------
    if (chaqueta) {
      const acolchado = (x, y, z) => (y % 5 === 0) ? C.chaquetaD : ((y % 5 === 4) ? C.chaquetaL : C.chaqueta);
      caja(-12, 12, 30, 53, -7, 7, acolchado, 3);
      caja(-10, 10, 54, 57, -6, 6, acolchado, 3);                 // cuello alto
      for (let x = -4; x <= 4; x++) for (let y = 31; y <= 57; y++) for (let z = 4; z <= 7; z++) {   // abierta: se ve la sudadera
        if (Math.abs(x) <= 3 - (y > 53 ? 1 : 0)) { if (z >= 6) del(x, y, z); else if (z === 5) set(x, y, z, C.sudadera); }
      }
      for (let x = -3; x <= 3; x++) for (let z = 4; z <= 5; z++) for (let y = 54; y <= 57; y++) if (Math.abs(x) <= 2) del(x, y, z);
      [[5, 46], [7, 46], [6, 45], [5, 44], [7, 44]].forEach(([x, y]) => set(x + 2, y, 8, C.sello));   // el Sello en la chaqueta
    }

    // ---------- cuello y cabeza ----------
    caja(-3, 3, 53, 57, -3, 3, C.piel, 1);
    const cabeza = (x, y, z) => {
      if (y <= 57) return C.pielD;                 // sombra bajo la mandíbula
      if (z <= -5) return C.pielD;
      return C.piel;
    };
    caja(-7, 7, 57, 73, -6, 7, cabeza, 3);
    caja(-6, 6, 56, 56, -4, 6, cabeza, 3);          // mandíbula
    // orejas
    for (const s of [-1, 1]) caja(s * 8, s * 8, 62, 66, -1, 1, C.pielD);
    // bigote suave
    for (let x = -2; x <= 2; x++) set(x, 61, 7, C.barba);
    // nariz
    caja(-1, 0, 61, 64, 8, 8, C.piel); set(-1, 61, 8, C.pielD); set(0, 61, 8, C.pielD);
    // boca
    for (let x = -2; x <= 1; x++) set(x, 59, 7, C.labio);
    set(-3, 60, 7, C.pielD); set(3, 60, 7, C.pielD);
    // ojos: esclerótica suave a los lados, iris al centro con brillo, línea de párpado arriba
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -6 : 3;
      for (let y = 65; y <= 66; y++) { set(x0, y, 7, C.ojoB); set(x0 + 3, y, 7, C.ojoB); set(x0 + 1, y, 7, C.ojo); set(x0 + 2, y, 7, C.ojo); }
      set(x0 + 2, 66, 7, C.brillo);
      for (let x = x0; x <= x0 + 3; x++) set(x, 67, 7, C.parpado);       // pestañas / párpado
      for (let x = x0; x <= x0 + 3; x++) set(x, 64, 7, C.pielD);         // párpado inferior suave
    }
    // pelo pintado sobre la cabeza
    V.forEach(v => {
      if (v.y < 62 || v.y > 73 || v.c === C.ojoB || v.c === C.ojo) return;
      const lado = Math.abs(v.x) >= 6 && v.z <= 2 && v.y >= 64;
      const nuca = v.z <= -3 && v.y >= 62 && Math.abs(v.x) <= 7;
      if (lado || nuca) v.c = C.pelo;
    });
    caja(-1, 1, 58, 63, -8, -7, C.pelo);                                   // colita
    caja(0, 0, 56, 57, -8, -8, C.pelo);

    // ---------- gorra ----------
    V.forEach((v, key) => { if (v.y >= 70) V.delete(key); });
    for (let x = -9; x <= 9; x++) for (let y = 69; y <= 78; y++) for (let z = -9; z <= 9; z++) {
      const d = (x / 8.8) ** 2 + ((y - 68.5) / 9) ** 2 + ((z + 0.3) / 8.8) ** 2;
      if (d > 1 || y < 69) continue;
      let c = C.gorra;
      if (y === 69) c = C.gorraL;                                        // banda
      else if (x === 0 && z > 0) c = C.gorraL;                           // costura del frente
      else if (Math.abs(x) === Math.abs(z) && y > 71) c = C.gorraL;      // costuras de los paneles
      set(x, y, z, c);
    }
    for (let x = -8; x <= 8; x++) for (let z = 6; z <= 18; z++) {          // visera curva de tres capas
      const ancho = 8 - Math.max(0, z - 13);
      if (Math.abs(x) > ancho) continue;
      const caida = (z >= 12 ? 1 : 0) + (z >= 16 ? 1 : 0) + (Math.abs(x) >= 6 ? 1 : 0);
      const filo = z === 18 || Math.abs(x) === ancho;
      set(x, 70 - caida, z, z > 9 ? C.gorra : C.gorraL);
      set(x, 69 - caida, z, filo ? C.gorraL : C.gorra);
      set(x, 68 - caida, z, filo ? C.gorraL : '#0A090C');
    }
    set(0, 78, 0, C.gorraL); set(0, 77, 1, C.gorraL);
    // lentes negros cuadrados
    const lentes = (yb, zb, inclinar) => {
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? -7 : 2;
        for (let x = x0; x <= x0 + 5; x++) for (let y = yb; y <= yb + 2; y++) {
          const marco = y === yb + 2 || x === x0 || x === x0 + 5 || y === yb;
          set(x, y, zb, marco ? C.negro : C.lente);
        }
        set(x0 + 2, yb + 1, zb + 0, C.lenteL); set(x0 + 3, yb + 1, zb, '#5E6675');
      }
      for (let x = -1; x <= 1; x++) set(x, yb + 2, zb, C.negro);
    };
    if (op.lentes === 'cara') lentes(64, 8);
    else if (op.lentes === 'gorra' && op.ropa !== 'chaqueta') {          // colgados del cuello de la camiseta
      lentes(50, 6);
      for (let y = 51; y <= 53; y++) set(-1, y, 6, C.negro);
    }
    return Array.from(V.values());
  }
  window.SudoModelo = { construir, C };
})();

// Sudo con la chaqueta morada, de pie. Solo se quedan los vóxeles de la superficie (los de adentro no se ven)
// y el Sello del pecho brilla un poco.
function construir() {
  const todos = window.SudoModelo.construir({ ropa: "chaqueta", lentes: "gorra", pixel: false, pose: "neutral" });
  const hay = new Set(todos.map(v => v.x + "," + v.y + "," + v.z));
  const h = (x, y, z) => hay.has(x + "," + y + "," + z);
  const sello = window.SudoModelo.C.sello;
  return todos
    .filter(v => !(h(v.x + 1, v.y, v.z) && h(v.x - 1, v.y, v.z) && h(v.x, v.y + 1, v.z) && h(v.x, v.y - 1, v.z) && h(v.x, v.y, v.z + 1) && h(v.x, v.y, v.z - 1)))
    .map(v => ({ x: v.x, y: v.y, z: v.z, c: v.c, g: v.c === sello ? 1 : 0 }));
}

export function montar(lienzo2D, alArmarse, alPerderse) {
  const T = window.THREE;
  const lienzo = document.createElement("canvas");
  lienzo.id = "voxeles";
  lienzo.setAttribute("role", "img");
  lienzo.setAttribute("aria-label", lienzo2D.getAttribute("aria-label"));
  const renderer = new T.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  lienzo2D.replaceWith(lienzo);

  const escena = new T.Scene();
  const camara = new T.PerspectiveCamera(30, 1, 1, 800);
  const CENTRO = new T.Vector3(0, 39, 0);
  escena.add(new T.HemisphereLight(0xC8BEE8, 0x16141B, .8));
  const sol = new T.DirectionalLight(0xffffff, .7); sol.position.set(40, 100, 68); escena.add(sol);
  const frente = new T.DirectionalLight(0xffffff, .25); frente.position.set(0, 40, 120); escena.add(frente);
  const contra = new T.PointLight(0x8A5CC4, 1.4, 220); contra.position.set(-48, 68, -48); escena.add(contra);

  // un InstancedMesh por color; cada vóxel guarda su lugar, su posición y su velocidad
  const caja = new T.BoxGeometry(1, 1, 1), grupo = new T.Group(), voxeles = construir(), porColor = {};
  for (const v of voxeles) (porColor[v.c + v.g] = porColor[v.c + v.g] || []).push(v);
  for (const lista of Object.values(porColor)) {
    const col = new T.Color(lista[0].c);
    const mat = new T.MeshLambertMaterial({ color: col, emissive: lista[0].g ? col.clone().multiplyScalar(.5) : new T.Color(0) });
    const malla = new T.InstancedMesh(caja, mat, lista.length);
    malla.instanceMatrix.setUsage(T.DynamicDrawUsage);
    malla.frustumCulled = false;
    lista.forEach((v, i) => {
      Object.assign(v, { malla, i, hx: v.x, hy: v.y + .5, hz: v.z, vx: 0, vy: 0, vz: 0, s: v.s || 1 });
      // llegan desde abajo y desde los lados, los de abajo primero (~1,5 s)
      v.x = (Math.random() - .5) * 140; v.y = -60 - Math.random() * 80 - v.hy * .6; v.z = (Math.random() - .5) * 80;
      v.retraso = 150 + v.hy * 15 + Math.random() * 260;
    });
    grupo.add(malla);
  }
  escena.add(grupo);

  function ajustar() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // que quepa entero (alto ~42 vóxeles, ancho ~24 al girar) en cualquier proporción
    const media = Math.tan(T.MathUtils.degToRad(15));
    const d = Math.max(46 / media, 26 / (media * camara.aspect));
    camara.position.set(0, CENTRO.y + d * .1, d);
    camara.lookAt(CENTRO);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(lienzo);

  // puntero: un rayo desde la cámara; los vóxeles cerca del rayo se apartan
  const RESORTE = 0.075, FRENO = 0.82, RADIO = 10;
  const ndc = new T.Vector2(), rayo = new T.Raycaster(), inversa = new T.Matrix4();
  const origen = new T.Vector3(), dir = new T.Vector3();
  let hayPuntero = false, giroPuntero = 0;
  function mover(e) {
    const r = lienzo.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    hayPuntero = true;
  }
  function soltar() { hayPuntero = false; }
  function dispersar(fuerza) {
    for (const v of voxeles) {
      const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1), r = (0.6 + Math.random()) * fuerza;
      v.vx += Math.sin(b) * Math.cos(a) * r; v.vy += Math.cos(b) * r; v.vz += Math.sin(b) * Math.sin(a) * r;
    }
  }
  lienzo.addEventListener("pointermove", mover);
  lienzo.addEventListener("pointerdown", e => { mover(e); dispersar(6); });
  lienzo.addEventListener("pointerleave", soltar);
  lienzo.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") soltar(); });

  const m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), pos = new T.Vector3(), esc = new T.Vector3();
  const inicio = performance.now();
  let visible = true, pedido = 0, armado = false;

  function cuadro() {
    pedido = 0;
    if (!visible) return;
    const ahora = performance.now() - inicio, t = ahora / 1000;
    // se mece despacio y mira un poco hacia el puntero
    giroPuntero += ((hayPuntero ? ndc.x * .45 : 0) - giroPuntero) * .05;
    grupo.rotation.y = Math.sin(t * .45) * .5 + giroPuntero;
    grupo.updateMatrixWorld();
    let empujar = false;
    if (hayPuntero) {
      rayo.setFromCamera(ndc, camara);
      inversa.copy(grupo.matrixWorld).invert();
      origen.copy(rayo.ray.origin).applyMatrix4(inversa);
      dir.copy(rayo.ray.direction).transformDirection(inversa);
      empujar = true;
    }
    for (const v of voxeles) {
      if (ahora >= v.retraso) {
        if (empujar) {
          const px = v.x - origen.x, py = v.y - origen.y, pz = v.z - origen.z;
          const a = px * dir.x + py * dir.y + pz * dir.z;
          const ox = px - dir.x * a, oy = py - dir.y * a, oz = pz - dir.z * a, d = Math.hypot(ox, oy, oz);
          if (d < RADIO && d > .01) { const f = (1 - d / RADIO) * .9 / d; v.vx += ox * f; v.vy += oy * f; v.vz += oz * f; }
        }
        const hy = v.flota === undefined ? v.hy : v.hy + Math.sin(t * 1.6 + v.flota) * .45;
        v.vx = (v.vx + (v.hx - v.x) * RESORTE) * FRENO;
        v.vy = (v.vy + (hy - v.y) * RESORTE) * FRENO;
        v.vz = (v.vz + (v.hz - v.z) * RESORTE) * FRENO;
        v.x += v.vx; v.y += v.vy; v.z += v.vz;
      }
      // los que van rápido giran; los que llegan quedan derechos
      eu.set(v.vy * .25, v.vx * .25, v.vz * .25);
      if (v.flota !== undefined) eu.set(t * .7 + v.flota, t * .5, 0);
      q.setFromEuler(eu); pos.set(v.x, v.y, v.z); esc.setScalar(v.s);
      v.malla.setMatrixAt(v.i, m4.compose(pos, q, esc));
    }
    for (const malla of grupo.children) malla.instanceMatrix.needsUpdate = true;
    renderer.render(escena, camara);
    if (!armado && ahora > 2100) { armado = true; alArmarse(); }
    pedido = requestAnimationFrame(cuadro);
  }

  // fuera de pantalla no se dibuja
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !pedido) pedido = requestAnimationFrame(cuadro);
  }).observe(lienzo);

  lienzo.addEventListener("webglcontextlost", () => {
    visible = false; cancelAnimationFrame(pedido);
    renderer.dispose();
    alPerderse();
  }, { once: true });

  ajustar();
  pedido = requestAnimationFrame(cuadro);
  return lienzo;
}
