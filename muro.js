// El personaje del muro: Sudo, hecho de píxeles reales que se arman al cargar y se apartan cuando el visitante los toca.
// Si el equipo y la conexión dan, se arma en 3D con vóxeles (sudo3d.js trae three.js solo en ese caso).
// Si no hay WebGL, la conexión es lenta, three.js tarda más de PLAZO_3D o el visitante pidió menos movimiento,
// queda el sprite 2D de LADO x LADO: cada píxel es una partícula con resorte hacia su lugar.
import { SPRITE } from "./sprite.js";
const LADO = 88;

let lienzo = document.getElementById("pixeles");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PLAZO_3D = 2500;

function puede3D() {
  if (quieto) return false;
  const red = navigator.connection;
  if (red && (red.saveData || /2g|3g/.test(red.effectiveType || ""))) return false;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
}

let modo = null;   // "3d" o "2d": el primero que llegue se queda
if (puede3D()) {
  const plazo = setTimeout(iniciar2D, PLAZO_3D);
  import("./sudo3d.js").then(m => m.cargar()).then(m => {
    clearTimeout(plazo);
    if (modo) return;
    modo = "3d";
    const lienzo2D = lienzo;
    lienzo = m.montar(lienzo2D, () => { document.body.classList.add("listo"); }, () => {
      // se perdió el contexto WebGL: vuelve el 2D en el mismo lugar
      lienzo.replaceWith(lienzo2D); lienzo = lienzo2D; modo = null; iniciar2D();
    });
  }).catch(() => { clearTimeout(plazo); iniciar2D(); });
} else {
  iniciar2D();
}

function iniciar2D() {
  if (modo) return;
  modo = "2d";
  const ctx = lienzo.getContext("2d");
  const RESORTE = 0.075, FRENO = 0.82;
  let pixeles = [], celda = 1, origenX = 0, origenY = 0, ancho = 0, alto = 0, inicio = 0;
  const puntero = { x: -1e4, y: -1e4 };

  function medir() {
    const caja = lienzo.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    ancho = caja.width; alto = caja.height;
    lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    celda = Math.max(1, Math.floor(Math.min(ancho, alto) / (LADO + 2)));
    origenX = Math.round((ancho - celda * LADO) / 2); origenY = Math.round((alto - celda * LADO) / 2);
    for (const p of pixeles) { p.cx = origenX + p.col * celda; p.cy = origenY + p.fila * celda; }
  }

  function dispersar(fuerza) {
    for (const p of pixeles) {
      const a = Math.random() * Math.PI * 2, r = (0.6 + Math.random()) * fuerza;
      p.vx += Math.cos(a) * r; p.vy += Math.sin(a) * r;
    }
  }

  function cuadro() {
    ctx.clearRect(0, 0, ancho, alto);
    const radio = celda * 12, ahora = performance.now() - inicio;
    for (const p of pixeles) {
      if (ahora < p.retraso) { ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), celda + 0.5, celda + 0.5); continue; }
      const dx = p.x - puntero.x, dy = p.y - puntero.y, d = Math.hypot(dx, dy);
      if (d < radio && d > 0.01) { const empuje = (1 - d / radio) * celda * 0.9; p.vx += (dx / d) * empuje; p.vy += (dy / d) * empuje; }
      p.vx = (p.vx + (p.cx - p.x) * RESORTE) * FRENO;
      p.vy = (p.vy + (p.cy - p.y) * RESORTE) * FRENO;
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), celda + 0.5, celda + 0.5);
    }
    requestAnimationFrame(cuadro);
  }

  function cuadroQuieto() {
    ctx.clearRect(0, 0, ancho, alto);
    for (const p of pixeles) { ctx.fillStyle = p.color; ctx.fillRect(p.cx, p.cy, celda + 0.5, celda + 0.5); }
  }

  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = c.height = LADO;
    const cx = c.getContext("2d"); cx.drawImage(img, 0, 0);
    const datos = cx.getImageData(0, 0, LADO, LADO).data;
    for (let fila = 0; fila < LADO; fila++) for (let col = 0; col < LADO; col++) {
      const i = (fila * LADO + col) * 4;
      if (datos[i + 3] > 0) pixeles.push({ col, fila, color: `rgb(${datos[i]},${datos[i + 1]},${datos[i + 2]})`, x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, retraso: 0 });
    }
    medir();
    for (const p of pixeles) {
      if (quieto) { p.x = p.cx; p.y = p.cy; continue; }
      // llegan desde cualquier punto del muro, los de abajo primero
      p.x = Math.random() * ancho * 1.6 - ancho * 0.3; p.y = alto + Math.random() * alto * 0.8 + (LADO - p.fila) * celda;
      p.retraso = 150 + (LADO - 1 - p.fila) * 12 + Math.random() * 260;   // se arma de abajo hacia arriba en ~1,5 s
    }
    inicio = performance.now();
    if (quieto) { document.body.classList.add("listo"); cuadroQuieto(); return; }
    requestAnimationFrame(cuadro);
    setTimeout(() => document.body.classList.add("listo"), 2100);
  };
  img.src = SPRITE;

  function mover(e) { const caja = lienzo.getBoundingClientRect(); puntero.x = e.clientX - caja.left; puntero.y = e.clientY - caja.top; }
  if (!quieto) {
    lienzo.addEventListener("pointermove", mover);
    lienzo.addEventListener("pointerdown", e => { mover(e); dispersar(celda * 3.2); });
    lienzo.addEventListener("pointerleave", () => { puntero.x = puntero.y = -1e4; });
    lienzo.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") puntero.x = puntero.y = -1e4; });
  }
  addEventListener("resize", () => { medir(); if (quieto) cuadroQuieto(); });
}
