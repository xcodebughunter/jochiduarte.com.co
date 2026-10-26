// Sudo en 3D: el mismo personaje del sprite, hecho de vóxeles (cubos) que se arman de abajo hacia arriba,
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

const C = {
  hoodie: "#6B3FA0", hoodieL: "#8A5CC4", hoodieD: "#4B2A75", sombra: "#0F0C18",
  p1: "#9FF3FF", p2: "#2B6F86", costura: "#F5C542", ojo: "#F4F1FA", tinta: "#1A1622", sello: "#FF3355",
  pantalon: "#1B1820", pantalonL: "#2E2A36", suela: "#ECE8F2", piel: "#C68B5E", pielD: "#9C6640", cordon: "#ECE8F2", pelo: "#1E1824",
};

// x a lo ancho (derecha de Sudo = +x), y hacia arriba desde el piso, z hacia el frente
function construir() {
  const V = new Map();
  const k = (x, y, z) => x + "," + y + "," + z;
  const set = (x, y, z, c, g) => V.set(k(x, y, z), { x, y, z, c, g: g ? 1 : 0 });
  const del = (x, y, z) => V.delete(k(x, y, z));
  const fill = (x0, x1, y0, y1, z0, z1, c, g) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) set(x, y, z, c, g); };
  const pix = (x, y, z) => ((x + y + z) & 1) ? C.p1 : C.p2;

  // zapatos morados con suela blanca
  fill(-4, -1, 0, 2, -2, 3, C.hoodie); fill(-4, -1, 0, 0, -2, 3, C.suela); fill(-4, -1, 2, 2, 2, 3, C.hoodieL);
  fill(1, 4, 0, 2, -2, 3, C.hoodie); fill(1, 4, 0, 0, -2, 3, C.suela); fill(1, 4, 2, 2, 2, 3, C.hoodieL);
  // pantalón negro
  fill(-4, -1, 3, 13, -1, 1, C.pantalon); fill(1, 4, 3, 13, -1, 1, C.pantalon);
  fill(-4, -4, 4, 12, -1, 1, C.pantalonL); fill(4, 4, 4, 12, -1, 1, C.pantalonL);
  fill(-4, 4, 13, 14, -2, 2, C.pantalon);
  // hoodie con greca amarilla, bolsillo canguro, cordones y su tag
  fill(-5, 5, 14, 26, -3, 2, C.hoodie);
  fill(-5, 5, 14, 14, -3, 3, C.hoodieD);
  for (let x = -5; x <= 5; x++) { const p = (x + 8) % 4; if (p < 2) set(x, 15, 3, C.costura); if (p >= 1 && p <= 2) set(x, 14, 3, C.costura); }
  fill(-3, 3, 16, 19, 3, 3, C.hoodieD);
  fill(-1, -1, 21, 24, 3, 3, C.cordon); fill(1, 1, 21, 24, 3, 3, C.cordon);
  [[2, 22], [4, 22], [3, 23], [2, 24], [4, 24]].forEach(([x, y]) => set(x, y, 3, C.sello, 1));
  // hombros y brazos; mano izquierda de piel, mano derecha de pixeles
  fill(-7, -6, 16, 26, -1, 1, C.hoodie); fill(6, 7, 16, 26, -1, 1, C.hoodie);
  fill(-7, -6, 16, 16, -1, 1, C.hoodieD); fill(6, 7, 16, 16, -1, 1, C.hoodieD);
  fill(-7, -6, 13, 15, -1, 1, C.piel); fill(-7, -6, 13, 13, -1, 1, C.pielD);
  for (let x = 6; x <= 7; x++) for (let y = 13; y <= 15; y++) for (let z = -1; z <= 1; z++) set(x, y, z, pix(x, y, z), 1);
  // cuello y capucha
  fill(-2, 2, 27, 27, -1, 1, C.hoodieD);
  for (let x = -7; x <= 7; x++) for (let y = 26; y <= 40; y++) for (let z = -7; z <= 5; z++) {
    if ((x / 5.9) ** 2 + ((y - 33) / 6.4) ** 2 + ((z + .8) / 5.4) ** 2 <= 1) set(x, y, z, y >= 38 ? C.hoodieL : (y <= 28 ? C.hoodieD : C.hoodie));
  }
  for (let z = -6; z <= -3; z++) fill(-3, 3, 27, 29, z, z, C.hoodie);
  const hueco = (x, y) => (x / 3.9) ** 2 + ((y - 32.5) / 4.6) ** 2 <= 1;
  for (let x = -5; x <= 5; x++) for (let y = 27; y <= 39; y++) if (hueco(x, y)) { for (let z = 1; z <= 6; z++) del(x, y, z); set(x, y, 0, C.sombra); }
  // cara humana: piel, flequillo, cejas, ojo humano, ojo pixel que brilla y pañoleta de grafitero
  const cara = (x, y) => (x / 3.4) ** 2 + ((y - 32.5) / 4.1) ** 2 <= 1;
  for (let x = -4; x <= 4; x++) for (let y = 27; y <= 38; y++) if (cara(x, y)) set(x, y, 1, y <= 31 ? C.pantalon : C.piel);
  for (let x = -4; x <= 4; x++) if (cara(x, 36)) set(x, 36, 1, C.pelo);
  set(-2, 35, 1, C.pelo); set(1, 35, 1, C.pelo); set(3, 35, 1, C.pelo);
  fill(-3, -1, 34, 34, 1, 1, C.pelo); fill(1, 3, 34, 34, 1, 1, C.pelo);
  set(-3, 33, 1, C.ojo); set(-2, 33, 1, C.tinta); set(-1, 33, 1, C.ojo);
  set(1, 33, 1, C.p2, 1); set(2, 33, 1, C.p1, 1); set(3, 33, 1, C.p2, 1); set(4, 33, 1, C.p1, 1);
  for (let x = -3; x <= 3; x++) set(x, 31, 2, C.pantalonL);
  for (let x = -2; x <= 2; x++) for (let y = 28; y <= 30; y++) set(x, y, 2, C.pantalon);
  set(-1, 29, 3, C.hoodieL); set(1, 28, 3, C.hoodieL);

  const lista = [...V.values()];
  // el brazo pixel suelta algunos cubos que flotan junto a la mano
  for (let i = 0; i < 6; i++) lista.push({ x: 8.6 + (i % 3) * .7, y: 12 + i * .8, z: -1 + (i % 3), c: i % 2 ? C.p1 : C.p2, g: 1, flota: i * .9, s: .5 });
  return lista;
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
  const camara = new T.PerspectiveCamera(30, 1, 1, 400);
  const CENTRO = new T.Vector3(0, 19.5, 0);
  escena.add(new T.HemisphereLight(0xC8BEE8, 0x16141B, .8));
  const sol = new T.DirectionalLight(0xffffff, .7); sol.position.set(20, 50, 34); escena.add(sol);
  const frente = new T.DirectionalLight(0xffffff, .25); frente.position.set(0, 20, 60); escena.add(frente);
  const contra = new T.PointLight(0x8A5CC4, 1.2, 110); contra.position.set(-24, 34, -24); escena.add(contra);

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
      v.x = (Math.random() - .5) * 70; v.y = -30 - Math.random() * 40 - v.hy * .6; v.z = (Math.random() - .5) * 40;
      v.retraso = 150 + v.hy * 30 + Math.random() * 260;
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
    const d = Math.max(23.5 / media, 13 / (media * camara.aspect));
    camara.position.set(0, CENTRO.y + d * .1, d);
    camara.lookAt(CENTRO);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(lienzo);

  // puntero: un rayo desde la cámara; los vóxeles cerca del rayo se apartan
  const RESORTE = 0.075, FRENO = 0.82, RADIO = 5;
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
  lienzo.addEventListener("pointerdown", e => { mover(e); dispersar(3.2); });
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
