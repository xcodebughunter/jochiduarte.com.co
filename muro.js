// El personaje del muro: cada píxel del sprite de 48x48 es una partícula con resorte hacia su lugar.
// Al cargar llegan desde todo el muro y se arman; el cursor (o el dedo) los aparta; un clic los hace estallar.
import { SPRITE } from "./sprite.js";

const lienzo = document.getElementById("pixeles");
const ctx = lienzo.getContext("2d");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const RESORTE = 0.075, FRENO = 0.82;
let pixeles = [], celda = 1, origenX = 0, origenY = 0, ancho = 0, alto = 0, inicio = 0;
const puntero = { x: -1e4, y: -1e4 };

function medir() {
  const caja = lienzo.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  ancho = caja.width; alto = caja.height;
  lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  celda = Math.floor(Math.min(ancho, alto) / 50);
  origenX = Math.round((ancho - celda * 48) / 2); origenY = Math.round((alto - celda * 48) / 2);
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
  const radio = celda * 7, ahora = performance.now() - inicio;
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

const img = new Image();
img.onload = () => {
  const c = document.createElement("canvas"); c.width = c.height = 48;
  const cx = c.getContext("2d"); cx.drawImage(img, 0, 0);
  const datos = cx.getImageData(0, 0, 48, 48).data;
  for (let fila = 0; fila < 48; fila++) for (let col = 0; col < 48; col++) {
    const i = (fila * 48 + col) * 4;
    if (datos[i + 3] > 0) pixeles.push({ col, fila, color: `rgb(${datos[i]},${datos[i + 1]},${datos[i + 2]})`, x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, retraso: 0 });
  }
  medir();
  for (const p of pixeles) {
    if (quieto) { p.x = p.cx; p.y = p.cy; continue; }
    // llegan desde cualquier punto del muro, los de abajo primero
    p.x = Math.random() * ancho * 1.6 - ancho * 0.3; p.y = alto + Math.random() * alto * 0.8 + (48 - p.fila) * celda;
    p.retraso = 150 + (47 - p.fila) * 22 + Math.random() * 260;   // se arma de abajo hacia arriba en ~1,5 s
  }
  inicio = performance.now();
  if (quieto) { document.body.classList.add("listo"); cuadroQuieto(); return; }
  requestAnimationFrame(cuadro);
  setTimeout(() => document.body.classList.add("listo"), 2100);
};
img.src = SPRITE;

function cuadroQuieto() {
  ctx.clearRect(0, 0, ancho, alto);
  for (const p of pixeles) { ctx.fillStyle = p.color; ctx.fillRect(p.cx, p.cy, celda + 0.5, celda + 0.5); }
}

function mover(e) { const caja = lienzo.getBoundingClientRect(); puntero.x = e.clientX - caja.left; puntero.y = e.clientY - caja.top; }
if (!quieto) {
  lienzo.addEventListener("pointermove", mover);
  lienzo.addEventListener("pointerdown", e => { mover(e); dispersar(celda * 3.2); });
  lienzo.addEventListener("pointerleave", () => { puntero.x = puntero.y = -1e4; });
  lienzo.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") puntero.x = puntero.y = -1e4; });
}
addEventListener("resize", () => { medir(); if (quieto) cuadroQuieto(); });
