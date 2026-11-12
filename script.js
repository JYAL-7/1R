// ===== Navegación =====
const botones = document.querySelectorAll('#menu button');
function irA(id) {
  const sec = document.getElementById(id);
  if (!sec) return;
  const menu = sec.dataset.menu || id;   // un ejercicio mantiene activo el botón "Ejercicios"
  botones.forEach(b => b.classList.toggle('activo', b.dataset.sec === menu));
  document.querySelectorAll('.seccion').forEach(s => s.classList.toggle('visible', s.id === id));
  window.scrollTo({ top: 0 });
  sec.dispatchEvent(new Event('abrir'));
}
document.querySelectorAll('[data-sec], [data-ir]').forEach(b =>
  b.addEventListener('click', () => irA(b.dataset.sec || b.dataset.ir)));

// ===== Utilidades =====
const num = id => { const v = document.getElementById(id).value.trim(); return v === '' ? undefined : Number(v); };
const fmt = x => Number(x.toFixed(4)).toString();
const filas = lista => lista.map(([n, v, u, dado]) =>
  `<div class="fila"><span>${n}${dado ? ' (dato)' : ''}</span><span class="dato">${v === undefined ? '—' : fmt(v)} ${u}</span></div>`).join('');
const error = (id, msg) => document.getElementById(id).innerHTML = `<p class="error">${msg}</p>`;

document.querySelectorAll('[data-limpiar]').forEach(b => b.addEventListener('click', () => {
  const p = b.dataset.limpiar;
  document.querySelectorAll(`#${p} input`).forEach(i => i.value = '');
  document.getElementById(p + '-res').innerHTML = '';
  document.getElementById(p + '-graf').hidden = true;
  const an = document.getElementById(p + '-anim'); if (an) an.hidden = true;
}));

// ===== MRU: d = v·t =====
document.getElementById('mru-calc').addEventListener('click', () => {
  const o = { d: num('mru-d'), v: num('mru-v'), t: num('mru-t') };
  const dados = Object.keys(o).filter(k => o[k] !== undefined);
  if (dados.length !== 2) return error('mru-res', 'Llena exactamente dos campos y deja uno vacío.');
  const r = { ...o };
  if (r.d === undefined) r.d = r.v * r.t;
  else if (r.v === undefined) r.v = r.d / r.t;
  else r.t = r.d / r.v;
  if (r.t < 0) return error('mru-res', 'El tiempo no puede ser negativo.');
  if (![r.d, r.v, r.t].every(Number.isFinite)) return error('mru-res', 'No se puede dividir entre cero. Revisa los datos.');
  document.getElementById('mru-res').innerHTML = filas([
    ['Distancia', r.d, 'm', o.d !== undefined], ['Velocidad', r.v, 'm/s', o.v !== undefined], ['Tiempo', r.t, 's', o.t !== undefined]]);
  const T = r.t > 0 ? r.t : 1;
  document.getElementById('mru-graf').hidden = false;
  document.getElementById('mru-anim').hidden = false;
  animarCarro('mru-anim', t => r.v * t, () => r.v, T);
  grafica('mru-g1', 'Posición (m) vs tiempo', t => r.v * t, T, 't (s)', '#6A32C9');
  grafica('mru-g2', 'Velocidad (m/s) vs tiempo', () => r.v, T, 't (s)', '#3DBE8B');
});

// ===== MUA: resuelve cualquier incógnita con las 4 fórmulas =====
const raizT = o => { // ½a·t² + v0·t − d = 0 → menor tiempo positivo
  const D = Math.sqrt(o.v0 ** 2 + 2 * o.a * o.d);
  const r = [(-o.v0 + D) / o.a, (-o.v0 - D) / o.a].filter(x => x >= 0);
  return r.length ? Math.min(...r) : NaN;
};
const formulas = {
  t:  [o => (o.vf - o.v0) / o.a, o => 2 * o.d / (o.v0 + o.vf), raizT],
  vf: [o => o.v0 + o.a * o.t, o => 2 * o.d / o.t - o.v0, o => Math.sign(o.v0 || 1) * Math.sqrt(o.v0 ** 2 + 2 * o.a * o.d)],
  v0: [o => o.vf - o.a * o.t, o => (o.d - 0.5 * o.a * o.t ** 2) / o.t, o => 2 * o.d / o.t - o.vf,
       o => Math.sign(o.vf || 1) * Math.sqrt(o.vf ** 2 - 2 * o.a * o.d)],
  a:  [o => (o.vf - o.v0) / o.t, o => 2 * (o.d - o.v0 * o.t) / o.t ** 2, o => (o.vf ** 2 - o.v0 ** 2) / (2 * o.d)],
  d:  [o => o.v0 * o.t + 0.5 * o.a * o.t ** 2, o => (o.v0 + o.vf) / 2 * o.t, o => (o.vf ** 2 - o.v0 ** 2) / (2 * o.a)]
};
document.getElementById('mua-calc').addEventListener('click', () => {
  const dato = { v0: num('mua-v0'), vf: num('mua-vf'), a: num('mua-a'), t: num('mua-t'), d: num('mua-d') };
  if (Object.values(dato).filter(v => v !== undefined).length < 3) return error('mua-res', 'Llena al menos tres campos.');
  const o = { ...dato };
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const k in formulas) {
      if (o[k] !== undefined) continue;
      for (const f of formulas[k]) { // los datos faltantes son undefined → NaN → se descarta la fórmula
        const v = f(o);
        if (Number.isFinite(v)) { o[k] = v; cambio = true; break; }
      }
    }
  }
  const faltan = Object.keys(o).filter(k => o[k] === undefined);
  document.getElementById('mua-res').innerHTML = filas([
    ['Velocidad inicial', o.v0, 'm/s', dato.v0 !== undefined], ['Velocidad final', o.vf, 'm/s', dato.vf !== undefined],
    ['Aceleración', o.a, 'm/s²', dato.a !== undefined], ['Tiempo', o.t, 's', dato.t !== undefined],
    ['Distancia', o.d, 'm', dato.d !== undefined]]) +
    (faltan.length ? '<p class="error">Con esos datos no se pudo calcular todo. Prueba con otra combinación.</p>' : '');
  const ok = [o.v0, o.a, o.t].every(Number.isFinite) && o.t >= 0;
  document.getElementById('mua-graf').hidden = !ok;
  document.getElementById('mua-anim').hidden = !ok;
  if (ok) {
    const T = o.t > 0 ? o.t : 1;
    animarCarro('mua-anim', t => o.v0 * t + 0.5 * o.a * t * t, t => o.v0 + o.a * t, T);
    grafica('mua-g1', 'Posición (m) vs tiempo', t => o.v0 * t + 0.5 * o.a * t * t, T, 't (s)', '#6A32C9');
    grafica('mua-g2', 'Velocidad (m/s) vs tiempo', t => o.v0 + o.a * t, T, 't (s)', '#3DBE8B');
  }
});

// ===== Tiro parabólico =====
let anim;
document.getElementById('tp-calc').addEventListener('click', () => {
  const v0 = num('tp-v0'), ang = num('tp-ang'), h0 = num('tp-h0') ?? 0, g = num('tp-g');
  if ([v0, ang, g].some(v => v === undefined) || v0 < 0 || ang < 0 || ang > 90 || h0 < 0 || g <= 0)
    return error('tp-res', 'Revisa los datos: v0 ≥ 0, ángulo entre 0 y 90, altura ≥ 0 y gravedad > 0.');
  const rad = ang * Math.PI / 180, vx = v0 * Math.cos(rad), vy = v0 * Math.sin(rad);
  const tSub = vy / g, hmax = h0 + vy ** 2 / (2 * g);
  const tv = (vy + Math.sqrt(vy ** 2 + 2 * g * h0)) / g;
  const alcance = vx * tv, vyf = vy - g * tv, vimp = Math.hypot(vx, vyf);
  const angImp = Math.atan2(Math.abs(vyf), vx) * 180 / Math.PI;
  document.getElementById('tp-res').innerHTML = filas([
    ['Velocidad horizontal (vx)', vx, 'm/s'], ['Velocidad vertical inicial (vy)', vy, 'm/s'],
    ['Tiempo hasta la altura máxima', tSub, 's'], ['Altura máxima', hmax, 'm'],
    ['Tiempo de vuelo', tv, 's'], ['Alcance horizontal', alcance, 'm'],
    ['Velocidad al impactar', vimp, 'm/s'], ['Ángulo al impactar', angImp, '°']]);
  dibujar({ vx, vy, v0, rad, h0, g, tv, tSub, alcance, hmax });
  const T = tv > 0 ? tv : 1;
  document.getElementById('tp-graf').hidden = false;
  grafica('tp-g1', 'Altura (m) vs tiempo', t => h0 + vy * t - 0.5 * g * t * t, T, 't (s)', '#6A32C9');
  grafica('tp-g2', 'Velocidad vertical (m/s) vs tiempo', t => vy - g * t, T, 't (s)', '#3DBE8B');
});

function flecha(x, x1, y1, x2, y2, col) {
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  const a = Math.atan2(y2 - y1, x2 - x1);
  x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 3;
  x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  x.beginPath(); x.moveTo(x2, y2);
  x.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
  x.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
  x.closePath(); x.fill();
}

// Simulación del lanzamiento: cañón, plataforma, trayectoria, vectores de velocidad en vivo
function dibujar(p) {
  const c = document.getElementById('tp-canvas'), x = c.getContext('2d'), W = c.width, H = c.height, m = 50;
  const s = Math.min((W - 2 * m) / Math.max(p.alcance, 1), (H - 2 * m - 20) / Math.max(p.hmax, 1));
  const X = t => m + p.vx * t * s, Y = t => H - m - (p.h0 + p.vy * t - 0.5 * p.g * t * t) * s;
  const suelo = H - m, y0 = Y(0), dur = 4000, k = p.v0 > 0 ? 55 / p.v0 : 0;
  cancelAnimationFrame(anim);
  let ini = null;
  function cuadro(ahora) {
    if (ini === null) ini = ahora;
    const f = Math.min((ahora - ini) / dur, 1), t = p.tv * f;
    const bx = X(t), by = Y(t), vyt = p.vy - p.g * t;
    x.clearRect(0, 0, W, H);
    x.font = '13px "IBM Plex Mono", monospace';
    // suelo y plataforma
    x.fillStyle = '#D3F0E2'; x.fillRect(0, suelo, W, H - suelo);
    x.fillStyle = '#2B1650'; x.fillRect(0, suelo, W, 3);
    if (p.h0 > 0) { x.fillStyle = '#B7A6D9'; x.fillRect(m - 16, y0, 32, suelo - y0); }
    // trayectoria completa (punteada) y tramo recorrido (continuo)
    x.strokeStyle = '#B7A6D9'; x.lineWidth = 2; x.setLineDash([6, 6]); x.beginPath();
    for (let i = 0; i <= 100; i++) { const ti = p.tv * i / 100; i ? x.lineTo(X(ti), Y(ti)) : x.moveTo(X(ti), Y(ti)); }
    x.stroke(); x.setLineDash([]);
    x.strokeStyle = '#6A32C9'; x.lineWidth = 3; x.beginPath();
    for (let i = 0; i <= 100; i++) { const ti = t * i / 100; i ? x.lineTo(X(ti), Y(ti)) : x.moveTo(X(ti), Y(ti)); }
    x.stroke();
    // marca de altura máxima y alcance
    x.fillStyle = '#2B1650'; x.textAlign = 'center';
    if (p.vy > 0) {
      x.strokeStyle = '#3DBE8B'; x.lineWidth = 1.5; x.setLineDash([4, 4]);
      x.beginPath(); x.moveTo(X(p.tSub), Y(p.tSub)); x.lineTo(X(p.tSub), suelo); x.stroke(); x.setLineDash([]);
      x.fillText('h máx = ' + fmt(p.hmax) + ' m', X(p.tSub), Math.max(Y(p.tSub) - 8, 14));
    }
    x.fillText('alcance = ' + fmt(p.alcance) + ' m', Math.min(Math.max(X(p.tv), 70), W - 70), suelo + 26);
    x.beginPath(); x.moveTo(X(p.tv), suelo); x.lineTo(X(p.tv), suelo + 8); x.stroke();
    // cañón
    x.strokeStyle = '#2B1650'; x.lineWidth = 8; x.lineCap = 'round';
    x.beginPath(); x.moveTo(m, y0); x.lineTo(m + 30 * Math.cos(p.rad), y0 - 30 * Math.sin(p.rad)); x.stroke();
    x.lineCap = 'butt'; x.fillStyle = '#2B1650'; x.beginPath(); x.arc(m, y0, 9, 0, 7); x.fill();
    // proyectil y vectores de velocidad
    x.fillStyle = '#3DBE8B'; x.beginPath(); x.arc(bx, by, 8, 0, 7); x.fill();
    if (f > 0 && f < 1) {
      flecha(x, bx, by, bx + p.vx * k, by, '#6A32C9');
      flecha(x, bx, by, bx, by - vyt * k, '#B42318');
      flecha(x, bx, by, bx + p.vx * k, by - vyt * k, '#2B1650');
    }
    // datos en vivo y leyenda
    const h = Math.max(0, p.h0 + p.vy * t - 0.5 * p.g * t * t);
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('t = ' + fmt(t) + ' s   x = ' + fmt(p.vx * t) + ' m   y = ' + fmt(h) + ' m', 12, 22);
    x.textAlign = 'right';
    x.fillStyle = '#6A32C9'; x.fillText('vx', W - 90, 22);
    x.fillStyle = '#B42318'; x.fillText('vy', W - 55, 22);
    x.fillStyle = '#2B1650'; x.fillText('v', W - 20, 22);
    if (f < 1) anim = requestAnimationFrame(cuadro);
  }
  anim = requestAnimationFrame(cuadro);
}

// Simulación de un carro sobre una pista (MRU y MUA): deja una marca cada T/10 para ver el patrón
const animCarro = {};
function animarCarro(id, pos, vel, T) {
  const c = document.getElementById(id), x = c.getContext('2d'), W = c.width, H = c.height, m = 50, suelo = 150;
  const ps = Array.from({ length: 101 }, (_, i) => pos(T * i / 100));
  const pmin = Math.min(0, ...ps), pmax = Math.max(0, ...ps), rango = (pmax - pmin) || 1;
  const vmax = Math.max(1e-9, ...Array.from({ length: 101 }, (_, i) => Math.abs(vel(T * i / 100))));
  const X = p => m + (W - 2 * m) * (p - pmin) / rango;
  const raw = rango / 6, pot = 10 ** Math.floor(Math.log10(raw));
  const paso = [1, 2, 5, 10].map(q => q * pot).find(q => q >= raw);
  cancelAnimationFrame(animCarro[id]);
  let ini = null;
  function cuadro(ahora) {
    if (ini === null) ini = ahora;
    const f = Math.min((ahora - ini) / 4000, 1), t = T * f, p = pos(t), v = vel(t), cx = X(p);
    x.clearRect(0, 0, W, H);
    x.font = '13px "IBM Plex Mono", monospace';
    // pista con marcas en metros
    x.fillStyle = '#D3F0E2'; x.fillRect(0, suelo, W, H - suelo);
    x.fillStyle = '#2B1650'; x.fillRect(0, suelo, W, 3);
    x.textAlign = 'center'; x.lineWidth = 1; x.strokeStyle = '#2B1650';
    for (let u = Math.ceil(pmin / paso) * paso; u <= pmax + 1e-9; u += paso) {
      x.beginPath(); x.moveTo(X(u), suelo); x.lineTo(X(u), suelo + 8); x.stroke();
      x.fillText(fmt(+u.toPrecision(6)), X(u), suelo + 22);
    }
    // recorrido y bandera de salida
    x.strokeStyle = '#6A32C9'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(X(0), suelo - 2); x.lineTo(cx, suelo - 2); x.stroke();
    x.strokeStyle = '#2B1650'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(X(0), suelo); x.lineTo(X(0), suelo - 52); x.stroke();
    x.fillStyle = '#B42318'; x.fillRect(X(0), suelo - 52, 16, 10);
    // marcas estroboscópicas cada T/10
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('marcas cada ' + fmt(T / 10) + ' s', 12, 225);
    for (let i = 0; i <= 10; i++) {
      if (T * i / 10 > t + 1e-9) break;
      x.beginPath(); x.arc(X(pos(T * i / 10)), 192, 4, 0, 7); x.fill();
    }
    // carro
    x.fillStyle = '#3DBE8B'; x.fillRect(cx - 28, suelo - 28, 56, 16); x.fillRect(cx - 14, suelo - 40, 28, 12);
    x.fillStyle = '#2B1650';
    [-16, 16].forEach(d => { x.beginPath(); x.arc(cx + d, suelo - 7, 7, 0, 7); x.fill(); });
    // flecha de velocidad (su longitud es proporcional a |v|)
    const L = Math.abs(v) / vmax * 70 * Math.sign(v);
    flecha(x, cx, suelo - 62, cx + L, suelo - 62, '#B42318');
    // datos en vivo
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('t = ' + fmt(t) + ' s   x = ' + fmt(p) + ' m   v = ' + fmt(v) + ' m/s', 12, 22);
    if (f < 1) animCarro[id] = requestAnimationFrame(cuadro);
  }
  animCarro[id] = requestAnimationFrame(cuadro);
}

// ===== Gráfica de línea (canvas, sin librerías): una o varias curvas =====
function grafica(id, titulo, f, T, ejeX, color) {
  graficaMulti(id, titulo, [{ f, T, color, nombre: '' }], ejeX);
}
function graficaMulti(id, titulo, series, ejeX) {
  const c = document.getElementById(id), x = c.getContext('2d'), W = c.width, H = c.height;
  const conLeyenda = series.some(s => s.nombre);
  const ml = 56, mb = 44, mt = conLeyenda ? 54 : 36, mr = 16;
  const T = Math.max(...series.map(s => s.T));
  const pts = series.map(s => Array.from({ length: 101 }, (_, i) => { const t = s.T * i / 100; return [t, s.f(t)]; }));
  const ys = pts.flat().map(p => p[1]);
  let ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
  if (ymax === ymin) ymax += 1;
  const X = t => ml + (W - ml - mr) * t / T;
  const Y = v => H - mb - (H - mb - mt) * (v - ymin) / (ymax - ymin);
  x.clearRect(0, 0, W, H);
  x.font = '12px "IBM Plex Mono", monospace'; x.fillStyle = '#2B1650'; x.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {            // rejilla y marcas de los ejes
    const v = ymin + (ymax - ymin) * i / 5, t = T * i / 5;
    x.strokeStyle = '#DDD2EE';
    x.beginPath(); x.moveTo(ml, Y(v)); x.lineTo(W - mr, Y(v)); x.stroke();
    x.beginPath(); x.moveTo(X(t), mt); x.lineTo(X(t), H - mb); x.stroke();
    x.textAlign = 'right'; x.fillText(fmt(+v.toPrecision(3)), ml - 6, Y(v) + 4);
    x.textAlign = 'center'; x.fillText(fmt(+t.toPrecision(3)), X(t), H - mb + 16);
  }
  x.strokeStyle = '#2B1650'; x.lineWidth = 1.5;   // eje en cero
  x.beginPath(); x.moveTo(ml, Y(0)); x.lineTo(W - mr, Y(0)); x.stroke();
  series.forEach((s, k) => {                      // curvas
    x.strokeStyle = s.color; x.lineWidth = 3; x.setLineDash(s.dash || []); x.beginPath();
    pts[k].forEach(([t, v], i) => i ? x.lineTo(X(t), Y(v)) : x.moveTo(X(t), Y(v)));
    x.stroke();
  });
  x.setLineDash([]);
  x.fillStyle = '#2B1650'; x.textAlign = 'left'; x.font = '600 14px "IBM Plex Sans", sans-serif';
  x.fillText(titulo, ml, 22);
  x.font = '12px "IBM Plex Sans", sans-serif';
  if (conLeyenda) {
    let px = ml;
    series.forEach(s => {
      x.fillStyle = s.color; x.fillRect(px, 33, 12, 4); px += 16;
      x.fillStyle = '#2B1650'; x.fillText(s.nombre, px, 38); px += x.measureText(s.nombre).width + 14;
    });
  }
  x.textAlign = 'center'; x.fillStyle = '#2B1650';
  x.fillText(ejeX, (ml + W - mr) / 2, H - 6);
}

// ===== Ejercicio: cañón y tanque =====
// Impacto: alcance del proyectil + recorrido del tanque durante el vuelo = distancia inicial d
const RAD = Math.PI / 180;
const ETI = { v0: 'et-v0', ang: 'et-ang', vt: 'et-vt', d: 'et-d', g: 'et-g' };
const ETEJEMPLO = { v0: 60, ang: '', vt: 35, d: 600, g: 9.81 };
const cierre = (v0, th, vt, g) => 2 * v0 * Math.sin(th) * (v0 * Math.cos(th) + vt) / g;

function crearEsc(v0, th, vt, d, g, nombre, color) {
  const vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), T = 2 * vy / g, R = vx * T, xt = d - vt * T;
  return { nombre, color, v0, th, vt, d, g, vx, vy, T, R, xt, hmax: vy * vy / (2 * g), impacto: Math.abs(R - xt) < 0.5 };
}

// Recibe {v0, ang(°), vt, d, g} con undefined en lo que falta. Devuelve {k: incógnita, escs: escenarios}
function resolverEt(o) {
  const falta = ['v0', 'ang', 'vt', 'd'].filter(k => o[k] === undefined);
  if (o.g === undefined || !(o.g > 0)) throw 'La gravedad es obligatoria y debe ser mayor que 0.';
  if (falta.length > 1) throw 'Faltan datos: llena la gravedad y al menos tres de los otros cuatro campos.';
  if (o.v0 !== undefined && !(o.v0 > 0)) throw 'La velocidad del proyectil debe ser mayor que 0.';
  if (o.d !== undefined && !(o.d > 0)) throw 'La distancia inicial debe ser mayor que 0.';
  if (o.ang !== undefined && !(o.ang > 0 && o.ang < 90)) throw 'El ángulo debe estar entre 0° y 90°, sin incluirlos.';
  const g = o.g, k = falta[0], th = o.ang * RAD;
  let { v0, vt, d } = o;
  if (k === 'd') d = cierre(v0, th, vt, g);
  else if (k === 'vt') vt = d * g / (2 * v0 * Math.sin(th)) - v0 * Math.cos(th);
  else if (k === 'v0') {
    const a = 2 * Math.sin(th) * Math.cos(th) / g, b = 2 * vt * Math.sin(th) / g;
    v0 = (-b + Math.sqrt(b * b + 4 * a * d)) / (2 * a);
  }
  if (k !== 'ang') {
    if (!(d > 0)) throw 'Con esos datos la distancia resulta negativa. Revisa los valores.';
    return { k, escs: [crearEsc(v0, th, vt, d, g, 'θ', '#6A32C9')] };
  }
  // Ángulo desconocido: se buscan los cruces de cierre(θ) = d (hay hasta dos) con bisección
  const F = a => cierre(v0, a, vt, g) - d, N = 1800, raices = [];
  for (let i = 1; i <= N; i++) {
    let lo = (i - 1) / N * Math.PI / 2, hi = i / N * Math.PI / 2;
    const f1 = F(lo), f2 = F(hi);
    if ((f1 < 0 && f2 >= 0) || (f1 > 0 && f2 <= 0)) {
      for (let j = 0; j < 60; j++) { const mid = (lo + hi) / 2; F(lo) * F(mid) <= 0 ? hi = mid : lo = mid; }
      raices.push((lo + hi) / 2);
    }
  }
  if (!raices.length) {
    let mejor = 0, am = 0;
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI / 2, q = cierre(v0, a, vt, g); if (q > mejor) { mejor = q; am = a; } }
    throw `Ningún ángulo logra el impacto: con esos datos el cañón solo alcanza un blanco a ${fmt(mejor)} m como máximo (con θ ≈ ${fmt(am / RAD)}°) y pediste d = ${fmt(d)} m.`;
  }
  const col = ['#3DBE8B', '#6A32C9'];
  return { k, escs: raices.map((a, i) => crearEsc(v0, a, vt, d, g, raices.length > 1 ? 'θ' + (i + 1) : 'θ', raices.length > 1 ? col[i] : col[1])) };
}

let animEt;
function ocultarEt() {
  cancelAnimationFrame(animEt);
  document.getElementById('et-anim').hidden = true;
  document.getElementById('et-graf').hidden = true;
  document.getElementById('et-tabla').innerHTML = '';
}
function cargarEjemploEt() { for (const k in ETI) document.getElementById(ETI[k]).value = ETEJEMPLO[k]; }

function calcEt() {
  const o = {};
  for (const k in ETI) o[k] = num(ETI[k]);
  let r;
  try { r = resolverEt(o); } catch (e) { ocultarEt(); return error('et-res', String(e)); }
  mostrarEt(r);
}

function tablaEt(e, titulo) {
  let filasT = '';
  for (let i = 0; i <= 10; i++) {
    const t = e.T * i / 10, xp = e.vx * t, yp = Math.max(0, e.vy * t - 0.5 * e.g * t * t);
    const v = Math.hypot(e.vx, e.vy - e.g * t), xt = e.d - e.vt * t;
    filasT += `<tr><td>${fmt(t)}</td><td>${fmt(xp)}</td><td>${fmt(yp)}</td><td>${fmt(v)}</td><td>${fmt(xt)}</td><td>${fmt(xt - xp)}</td></tr>`;
  }
  return `<h4 class="sub" style="border-left:6px solid ${e.color}">${titulo}</h4><div class="tabla-wrap"><table class="tabla"><thead><tr>` +
    '<th>t (s)</th><th>x proyectil (m)</th><th>y proyectil (m)</th><th>v (m/s)</th><th>x tanque (m)</th><th>separación (m)</th>' +
    `</tr></thead><tbody>${filasT}</tbody></table></div>`;
}

function mostrarEt({ k, escs }) {
  const e0 = escs[0], dos = escs.length > 1;
  let html = filas([
    ['Velocidad inicial v0', e0.v0, 'm/s', k !== 'v0'],
    ...(dos ? escs.map(e => ['Ángulo ' + e.nombre, e.th / RAD, '°', false]) : [['Ángulo θ', e0.th / RAD, '°', k !== 'ang']]),
    ['Velocidad del tanque', e0.vt, 'm/s', k !== 'vt'],
    ['Distancia inicial d', e0.d, 'm', k !== 'd'],
    ['Gravedad g', e0.g, 'm/s²', true]]);
  if (e0.vt < 0) html += '<p class="error">La velocidad del tanque salió negativa: significa que el tanque se aleja del cañón.</p>';
  escs.forEach((e, i) => {
    const miss = e.R - e.xt;
    html += `<h4 class="sub" style="border-left:6px solid ${e.color}">${dos ? 'Solución ' + (i + 1) + ': ' : ''}θ = ${fmt(e.th / RAD)}°</h4>` + filas([
      ['Tiempo de vuelo', e.T, 's'], ['Alcance del proyectil', e.R, 'm'], ['Altura máxima', e.hmax, 'm'],
      ['Recorrido del tanque', e.vt * e.T, 'm'], ['Posición del tanque al caer el proyectil', e.xt, 'm']]) +
      (e.impacto ? '<p class="ok">El proyectil impacta en el tanque.</p>'
        : `<p class="error">El proyectil falla: ${miss > 0 ? 'se pasa' : 'se queda corto'} ${fmt(Math.abs(miss))} m.</p>`);
  });
  document.getElementById('et-res').innerHTML = html;

  const Tm = Math.max(...escs.map(e => e.T));
  document.getElementById('et-graf').hidden = false;
  graficaMulti('et-g1', 'Altura (m) vs tiempo',
    escs.map(e => ({ f: t => e.vy * t - 0.5 * e.g * t * t, T: e.T, color: e.color, nombre: e.nombre })), 't (s)');
  graficaMulti('et-g2', 'Posición horizontal (m) vs tiempo', [
    ...escs.map(e => ({ f: t => e.vx * t, T: e.T, color: e.color, nombre: 'proyectil ' + e.nombre })),
    { f: t => e0.d - e0.vt * t, T: Tm, color: '#B42318', nombre: 'tanque' }], 't (s)');
  document.getElementById('et-tabla').innerHTML = '<h3>Tabulación</h3>' +
    escs.map((e, i) => tablaEt(e, dos ? 'Solución ' + (i + 1) + ': θ = ' + fmt(e.th / RAD) + '°' : 'θ = ' + fmt(e.th / RAD) + '°')).join('');
  document.getElementById('et-anim').hidden = false;
  animarEjercicio(escs);
}

// Simulación: cañón, tanque que avanza, trayectorias y explosiones
function animarEjercicio(escs) {
  const c = document.getElementById('et-anim'), x = c.getContext('2d'), W = c.width, H = c.height, m = 50, suelo = 350;
  const d = escs[0].d, vt = escs[0].vt, Tm = Math.max(...escs.map(e => e.T));
  const xmax = Math.max(d, ...escs.map(e => e.R)), xmin = Math.min(0, d - vt * Tm);
  const hm = Math.max(1, ...escs.map(e => e.hmax));
  const s = Math.min((W - 2 * m) / (xmax - xmin), (suelo - 80) / hm);
  const X = u => m + (u - xmin) * s, Y = h => suelo - h * s;
  const raw = (xmax - xmin) / 8, pot = 10 ** Math.floor(Math.log10(raw));
  const paso = [1, 2, 5, 10].map(q => q * pot).find(q => q >= raw);

  const tanque = (cx, alfa) => {
    x.globalAlpha = alfa;
    x.fillStyle = '#5B6B3A'; x.fillRect(cx - 38, suelo - 26, 76, 14); x.fillRect(cx - 14, suelo - 38, 30, 12);
    x.fillStyle = '#3D4A28'; x.fillRect(cx - 54, suelo - 34, 40, 4); x.fillRect(cx - 44, suelo - 12, 88, 12);
    x.fillStyle = '#D3F0E2';
    for (let i = -3; i <= 3; i++) { x.beginPath(); x.arc(cx + i * 12, suelo - 6, 4, 0, 7); x.fill(); }
    x.globalAlpha = 1;
  };
  const estrella = (px, py, r, col) => {
    x.beginPath();
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * 0.5 : r; x.lineTo(px + rr * Math.cos(a), py + rr * Math.sin(a)); }
    x.closePath(); x.fillStyle = col; x.fill();
  };

  cancelAnimationFrame(animEt);
  let ini = null;
  function cuadro(ahora) {
    if (ini === null) ini = ahora;
    const f = Math.min((ahora - ini) / 6000, 1), t = Tm * f, xt = d - vt * t;
    x.clearRect(0, 0, W, H);
    x.font = '13px "IBM Plex Mono", monospace';
    // suelo, marcas en metros y distancia inicial
    x.fillStyle = '#58B88B'; x.fillRect(0, suelo, W, 18);
    x.fillStyle = '#2B1650'; x.textAlign = 'center'; x.lineWidth = 1; x.strokeStyle = '#2B1650';
    for (let u = Math.ceil(xmin / paso) * paso; u <= xmax + 1e-9; u += paso) {
      x.beginPath(); x.moveTo(X(u), suelo + 18); x.lineTo(X(u), suelo + 24); x.stroke();
      x.fillText(fmt(+u.toPrecision(6)), X(u), suelo + 38);
    }
    const ya = suelo + 62, xm = (X(0) + X(d)) / 2;
    flecha(x, xm, ya, X(0), ya, '#2B1650'); flecha(x, xm, ya, X(d), ya, '#2B1650');
    x.fillText('distancia inicial = ' + fmt(d) + ' m', xm, ya + 20);
    // cañón con un cañón por cada ángulo
    const px = X(0), py = suelo - 16;
    escs.forEach(e => {
      x.lineCap = 'round';
      x.strokeStyle = '#2B1650'; x.lineWidth = 10;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + 34 * Math.cos(e.th), py - 34 * Math.sin(e.th)); x.stroke();
      x.strokeStyle = e.color; x.lineWidth = 5;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + 34 * Math.cos(e.th), py - 34 * Math.sin(e.th)); x.stroke();
      x.lineCap = 'butt';
      flecha(x, px + 38 * Math.cos(e.th), py - 38 * Math.sin(e.th), px + 100 * Math.cos(e.th), py - 100 * Math.sin(e.th), e.color);
      x.fillStyle = '#2B1650'; x.textAlign = 'left';
      x.fillText(e.nombre + ' = ' + fmt(e.th / RAD) + '°', px + 106 * Math.cos(e.th), py - 106 * Math.sin(e.th));
    });
    x.fillStyle = '#2B1650'; x.fillRect(px - 24, suelo - 16, 48, 16);
    x.beginPath(); x.arc(px, suelo - 16, 10, 0, 7); x.fill();
    // tanque inicial (fantasma) y tanque en movimiento
    tanque(X(d), 0.3);
    tanque(X(xt), 1);
    flecha(x, X(xt) + 36, suelo - 62, X(xt) - 36, suelo - 62, '#B42318');
    x.fillStyle = '#B42318'; x.textAlign = 'center';
    x.fillText('v tanque = ' + fmt(vt) + ' m/s', X(xt), suelo - 72);
    // trayectorias, proyectiles y explosiones
    escs.forEach(e => {
      x.strokeStyle = e.color; x.lineWidth = 2; x.globalAlpha = 0.45; x.setLineDash([6, 6]); x.beginPath();
      for (let i = 0; i <= 100; i++) { const ti = e.T * i / 100; i ? x.lineTo(X(e.vx * ti), Y(e.vy * ti - 0.5 * e.g * ti * ti)) : x.moveTo(X(0), Y(0)); }
      x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
      const te = Math.min(t, e.T);
      x.lineWidth = 3; x.beginPath();
      for (let i = 0; i <= 100; i++) { const ti = te * i / 100; i ? x.lineTo(X(e.vx * ti), Y(e.vy * ti - 0.5 * e.g * ti * ti)) : x.moveTo(X(0), Y(0)); }
      x.stroke();
      if (t < e.T) {
        x.fillStyle = e.color; x.beginPath(); x.arc(X(e.vx * t), Y(e.vy * t - 0.5 * e.g * t * t), 7, 0, 7); x.fill();
      } else if (e.impacto) {
        const r = 16 + 10 * Math.min(1, (t - e.T) / (0.12 * Tm));
        estrella(X(e.R), suelo - 14, r, '#F59E0B'); estrella(X(e.R), suelo - 14, r * 0.55, '#FDE047');
      } else {
        x.fillStyle = e.color; x.beginPath(); x.arc(X(e.R), suelo - 4, 6, 0, 7); x.fill();
      }
    });
    // datos en vivo
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('t = ' + fmt(t) + ' s   tanque a ' + fmt(xt) + ' m del cañón', 12, 22);
    x.fillText('v0 = ' + fmt(escs[0].v0) + ' m/s   g = ' + fmt(escs[0].g) + ' m/s²', 12, 42);
    if (f < 1) animEt = requestAnimationFrame(cuadro);
  }
  animEt = requestAnimationFrame(cuadro);
}

document.getElementById('et-calc').addEventListener('click', calcEt);
document.getElementById('et-ejemplo').addEventListener('click', () => { cargarEjemploEt(); calcEt(); });
document.getElementById('et-limpiar').addEventListener('click', () => {
  for (const k in ETI) document.getElementById(ETI[k]).value = k === 'g' ? 9.81 : '';
  document.getElementById('et-res').innerHTML = '';
  ocultarEt();
});
// Al abrir el ejercicio desde la lista, se carga el ejemplo y se muestra todo de nuevo
document.getElementById('ej-tanque').addEventListener('abrir', () => { cargarEjemploEt(); calcEt(); });

// ===== Caída libre: MUA con a = g (sentido positivo hacia abajo) =====
function resolverMua(dato) {
  const o = { ...dato };
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const k in formulas) {
      if (o[k] !== undefined) continue;
      for (const f of formulas[k]) {
        const v = f(o);
        if (Number.isFinite(v)) { o[k] = v; cambio = true; break; }
      }
    }
  }
  return o;
}

const animCaida = {};
function animarCaida(id, pos, vel, T) {
  const c = document.getElementById(id), x = c.getContext('2d'), W = c.width, H = c.height, top = 50, bot = H - 50;
  const ps = Array.from({ length: 101 }, (_, i) => pos(T * i / 100));
  const pmin = Math.min(0, ...ps), pmax = Math.max(0, ...ps), rango = (pmax - pmin) || 1, s = (bot - top) / rango;
  const Y = p => top + (p - pmin) * s;
  const vmax = Math.max(1e-9, ...Array.from({ length: 101 }, (_, i) => Math.abs(vel(T * i / 100))));
  const raw = rango / 6, pot = 10 ** Math.floor(Math.log10(raw));
  const paso = [1, 2, 5, 10].map(q => q * pot).find(q => q >= raw);
  const yg = Y(pos(T)), bx = 300;
  cancelAnimationFrame(animCaida[id]);
  let ini = null;
  function cuadro(ahora) {
    if (ini === null) ini = ahora;
    const f = Math.min((ahora - ini) / 4000, 1), t = T * f, p = pos(t), v = vel(t);
    x.clearRect(0, 0, W, H);
    x.font = '13px "IBM Plex Mono", monospace';
    // suelo
    x.fillStyle = '#58B88B'; x.fillRect(0, yg, W, H - yg);
    x.fillStyle = '#2B1650'; x.fillRect(0, yg, W, 3);
    // regla en metros
    x.strokeStyle = '#2B1650'; x.fillStyle = '#2B1650'; x.lineWidth = 1; x.textAlign = 'right';
    x.beginPath(); x.moveTo(130, Y(pmin)); x.lineTo(130, Y(pmax)); x.stroke();
    for (let u = Math.ceil(pmin / paso) * paso; u <= pmax + 1e-9; u += paso) {
      x.beginPath(); x.moveTo(130, Y(u)); x.lineTo(138, Y(u)); x.stroke();
      x.fillText(fmt(+u.toPrecision(6)) + ' m', 122, Y(u) + 4);
    }
    // línea de salida y recorrido
    x.strokeStyle = '#B7A6D9'; x.setLineDash([6, 6]);
    x.beginPath(); x.moveTo(130, Y(0)); x.lineTo(520, Y(0)); x.stroke(); x.setLineDash([]);
    x.textAlign = 'left'; x.fillText('salida', 528, Y(0) + 4);
    x.strokeStyle = '#6A32C9'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(bx, Y(0)); x.lineTo(bx, Y(p)); x.stroke();
    // marcas cada T/10 (la separación crece porque el cuerpo acelera)
    x.fillStyle = '#2B1650';
    for (let i = 0; i <= 10; i++) {
      if (T * i / 10 > t + 1e-9) break;
      x.beginPath(); x.arc(440, Y(pos(T * i / 10)), 4, 0, 7); x.fill();
    }
    x.textAlign = 'center'; x.fillText('marcas cada ' + fmt(T / 10) + ' s', 440, H - 14);
    // cuerpo y flecha de velocidad
    x.fillStyle = '#3DBE8B'; x.beginPath(); x.arc(bx, Y(p), 12, 0, 7); x.fill();
    x.strokeStyle = '#2B1650'; x.lineWidth = 2; x.stroke();
    flecha(x, bx + 34, Y(p), bx + 34, Y(p) + v / vmax * 70, '#B42318');
    // datos en vivo
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('t = ' + fmt(t) + ' s   y = ' + fmt(p) + ' m   v = ' + fmt(v) + ' m/s', 12, 22);
    if (f < 1) animCaida[id] = requestAnimationFrame(cuadro);
  }
  animCaida[id] = requestAnimationFrame(cuadro);
}

function ocultarCl() {
  cancelAnimationFrame(animCaida['cl-anim']);
  document.getElementById('cl-anim').hidden = true;
  document.getElementById('cl-graf').hidden = true;
}
document.getElementById('cl-calc').addEventListener('click', () => {
  const g = num('cl-g');
  if (g === undefined || !(g > 0)) { ocultarCl(); return error('cl-res', 'La gravedad es obligatoria y debe ser mayor que 0.'); }
  const dato = { v0: num('cl-v0'), vf: num('cl-vf'), a: g, t: num('cl-t'), d: num('cl-d') };
  if (Object.values(dato).filter(v => v !== undefined).length < 3) { ocultarCl(); return error('cl-res', 'Llena la gravedad y al menos dos datos más (por ejemplo, v0 y la altura).'); }
  const o = resolverMua(dato);
  if (![o.v0, o.vf, o.t, o.d].every(Number.isFinite) || o.t < 0) { ocultarCl(); return error('cl-res', 'Con esos datos no se pudo calcular todo. Prueba con otra combinación.'); }
  document.getElementById('cl-res').innerHTML = filas([
    ['Altura recorrida h', o.d, 'm', dato.d !== undefined], ['Tiempo de caída', o.t, 's', dato.t !== undefined],
    ['Velocidad inicial v0', o.v0, 'm/s', dato.v0 !== undefined], ['Velocidad final vf', o.vf, 'm/s', dato.vf !== undefined],
    ['Gravedad g', g, 'm/s²', true]]);
  const T = o.t > 0 ? o.t : 1;
  document.getElementById('cl-anim').hidden = false;
  document.getElementById('cl-graf').hidden = false;
  animarCaida('cl-anim', t => o.v0 * t + 0.5 * g * t * t, t => o.v0 + g * t, T);
  grafica('cl-g1', 'Distancia recorrida (m) vs tiempo', t => o.v0 * t + 0.5 * g * t * t, T, 't (s)', '#6A32C9');
  grafica('cl-g2', 'Velocidad (m/s) vs tiempo', t => o.v0 + g * t, T, 't (s)', '#3DBE8B');
});
document.getElementById('cl-limpiar').addEventListener('click', () => {
  ['cl-d', 'cl-t', 'cl-vf'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('cl-v0').value = 0; document.getElementById('cl-g').value = 9.81;
  document.getElementById('cl-res').innerHTML = '';
  ocultarCl();
});

// ===== Ejercicio: colisión de dos proyectiles =====
// Choque: misma x y misma y a la vez → v1·senθ1 = v2·senθ2 y t = d / (v1·cosθ1 + v2·cosθ2)
const CPI = { v1: 'cp-v1', v2: 'cp-v2', d: 'cp-d', g: 'cp-g', a1: 'cp-a1', a2: 'cp-a2', t: 'cp-t', h: 'cp-h' };
const CPEJEMPLO = { v1: 80, v2: 65, d: 500, g: 9.81, a1: 30, a2: '', t: '', h: '' };
let cpEscs = [], cpK = null, animCp;

function crearCol(v1, v2, th1, th2, d, g, nombre) {
  const vx1 = v1 * Math.cos(th1), vy1 = v1 * Math.sin(th1), vx2 = v2 * Math.cos(th2), vy2 = v2 * Math.sin(th2);
  const A = vx1 + vx2, B = vy1 - vy2, T1 = 2 * vy1 / g, T2 = 2 * vy2 / g;
  // instante de mayor acercamiento mientras ambos siguen en el aire
  const ts = Math.min(Math.max(d * A / (A * A + B * B), 0), Math.min(T1, T2));
  const dmin = Math.hypot(d - A * ts, B * ts);
  return { nombre, v1, v2, th1, th2, vx1, vy1, vx2, vy2, d, g, T1, T2, tc: ts, dmin, choque: dmin < 0.5,
           xc: vx1 * ts, yc: vy1 * ts - 0.5 * g * ts * ts };
}

// o = {v1, v2, d, g, a1(°), a2(°), t, h} con undefined en lo que no se llenó
function resolverCol(o) {
  if (['v1', 'v2', 'd', 'g'].some(k => !(o[k] > 0))) throw 'Llena v1, v2, la separación d y la gravedad (obligatoria). Todos deben ser mayores que 0.';
  const ex = ['a1', 'a2', 't', 'h'].filter(k => o[k] !== undefined);
  if (!ex.length) throw 'Con esos datos solos el problema no tiene una única solución: falta una condición adicional. Llena θ1, θ2, el tiempo del choque o la altura del choque.';
  for (const a of ['a1', 'a2']) if (o[a] !== undefined && !(o[a] > 0 && o[a] < 90)) throw 'Los ángulos deben estar entre 0° y 90°, sin incluirlos.';
  if (o.t !== undefined && !(o.t > 0)) throw 'El tiempo del choque debe ser mayor que 0.';
  if (o.h !== undefined && o.h < 0) throw 'La altura del choque no puede ser negativa.';
  const { v1, v2, d, g } = o, vmin = Math.min(v1, v2);
  if (ex.length === 2 && ex.includes('a1') && ex.includes('a2'))
    return { k: 'ver', escs: [crearCol(v1, v2, o.a1 * RAD, o.a2 * RAD, d, g, 'Comprobación')] };
  if (ex.length > 1) throw 'Llena solo una condición adicional (θ1, θ2, tiempo o altura). Si llenas los dos ángulos, el simulador comprueba si hay choque.';

  const k = ex[0], S = vy => Math.sqrt(Math.max(0, v1 * v1 - vy * vy)) + Math.sqrt(Math.max(0, v2 * v2 - vy * vy));
  let vys = [];   // componente vertical común de ambos proyectiles
  if (k === 'a1' || k === 'a2') {
    const vyD = (k === 'a1' ? v1 : v2) * Math.sin(o[k] * RAD), otra = k === 'a1' ? v2 : v1;
    if (vyD > otra) throw `Con ese ángulo la componente vertical es ${fmt(vyD)} m/s, mayor que la rapidez del otro proyectil (${fmt(otra)} m/s): no puede igualar esa altura.`;
    vys = [vyD];
  } else if (k === 't') {
    const meta = d / o.t, lo = Math.sqrt(Math.abs(v1 * v1 - v2 * v2)), hi = v1 + v2;
    if (meta < lo - 1e-9 || meta > hi + 1e-9)
      throw `Con esas rapideces el choque solo puede ocurrir entre ${fmt(d / hi)} s y ${lo > 0 ? fmt(d / lo) + ' s' : 'un tiempo sin límite'}.`;
    let a = 0, b = vmin;
    for (let j = 0; j < 80; j++) { const mid = (a + b) / 2; S(mid) > meta ? a = mid : b = mid; }
    vys = [(a + b) / 2];
  } else {        // k === 'h': buscar las componentes verticales cuya altura de choque es h
    const yc = vy => { const t = d / S(vy); return vy * t - 0.5 * g * t * t; };
    const N = 2000, tope = vmin * (1 - 1e-9);
    let mejor = yc(0), vm = 0, prevV = 0, prevF = yc(0) - o.h;
    for (let i = 1; i <= N; i++) {
      const vy = tope * i / N, q = yc(vy), f = q - o.h;
      if (q > mejor) { mejor = q; vm = vy; }
      if ((prevF < 0 && f >= 0) || (prevF > 0 && f <= 0)) {
        let a = prevV, b = vy;
        for (let j = 0; j < 60; j++) { const mid = (a + b) / 2; (yc(a) - o.h) * (yc(mid) - o.h) <= 0 ? b = mid : a = mid; }
        vys.push((a + b) / 2);
      }
      prevV = vy; prevF = f;
    }
    if (!vys.length) throw `Ningún choque ocurre a h = ${fmt(o.h)} m: con esas rapideces la mayor altura posible es ${fmt(mejor)} m (con una componente vertical de ${fmt(vm)} m/s).`;
  }
  const escs = vys.map((vy, i) => crearCol(v1, v2, Math.asin(Math.min(1, vy / v1)), Math.asin(Math.min(1, vy / v2)), d, g,
    vys.length > 1 ? 'Solución ' + (i + 1) : 'Solución')).filter(e => e.choque);
  if (!escs.length) throw 'Con esos datos los proyectiles caen al suelo antes de encontrarse. Prueba con más rapidez o menos separación.';
  return { k, escs };
}

function ocultarCp() {
  cancelAnimationFrame(animCp);
  ['cp-anim', 'cp-graf', 'cp-sel'].forEach(i => document.getElementById(i).hidden = true);
  ['cp-sol', 'cp-tabla'].forEach(i => document.getElementById(i).innerHTML = '');
}
function cargarEjemploCp() { for (const k in CPI) document.getElementById(CPI[k]).value = CPEJEMPLO[k]; }

function calcCp() {
  const o = {};
  for (const k in CPI) o[k] = num(CPI[k]);
  let r;
  try { r = resolverCol(o); } catch (e) { ocultarCp(); return error('cp-res', String(e)); }
  mostrarCp(r);
}

function mostrarCp(r) {
  cpEscs = r.escs; cpK = r.k;
  const e0 = r.escs[0];
  let msg;
  if (r.k === 'ver') msg = e0.choque ? '<p class="ok">Con esos ángulos los proyectiles sí chocan.</p>'
    : `<p class="error">Con esos ángulos los proyectiles no chocan: su distancia mínima es ${fmt(e0.dmin)} m (a los ${fmt(e0.tc)} s).</p>`;
  else msg = r.escs.length > 1 ? `<p class="ok">Hay ${r.escs.length} soluciones. Elige una para ver su simulación.</p>` : '<p class="ok">Los proyectiles chocan.</p>';
  document.getElementById('cp-res').innerHTML = msg;
  const sel = document.getElementById('cp-sel');
  sel.hidden = r.escs.length < 2;
  sel.innerHTML = r.escs.map((e, i) => `<button class="secundario" data-i="${i}">${e.nombre}: θ1 = ${fmt(e.th1 / RAD)}°, θ2 = ${fmt(e.th2 / RAD)}°</button>`).join('');
  sel.querySelectorAll('button').forEach(b => b.addEventListener('click', () => verCp(+b.dataset.i)));
  verCp(0);
}

function resumenCol(e) {
  const filasR = [['Rapidez inicial (m/s)', e.v1, e.v2], ['Ángulo de lanzamiento (°)', e.th1 / RAD, e.th2 / RAD],
    ['Componente horizontal (m/s)', e.vx1, e.vx2], ['Componente vertical (m/s)', e.vy1, e.vy2], ['Tiempo de vuelo total (s)', e.T1, e.T2]];
  if (e.choque) filasR.push(['Tiempo hasta el choque (s)', e.tc, e.tc],
    ['Posición horizontal al chocar (m)', e.vx1 * e.tc, e.d - e.vx2 * e.tc],
    ['Altura al chocar (m)', e.vy1 * e.tc - 0.5 * e.g * e.tc ** 2, e.vy2 * e.tc - 0.5 * e.g * e.tc ** 2]);
  return '<h4 class="sub" style="border-left:6px solid #6A32C9">Resumen</h4><div class="tabla-wrap"><table class="tabla resumen"><thead><tr><th>Magnitud</th><th>Proyectil 1</th><th>Proyectil 2</th></tr></thead><tbody>' +
    filasR.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1])}</td><td>${fmt(r[2])}</td></tr>`).join('') + '</tbody></table></div>';
}

function tablaCol(e) {
  const Tt = e.choque ? e.tc : Math.min(e.T1, e.T2);
  let f = '';
  for (let i = 0; i <= 10; i++) {
    const t = Tt * i / 10, x1 = e.vx1 * t, y1 = Math.max(0, e.vy1 * t - 0.5 * e.g * t * t);
    const x2 = e.d - e.vx2 * t, y2 = Math.max(0, e.vy2 * t - 0.5 * e.g * t * t);
    f += `<tr><td>${fmt(t)}</td><td>${fmt(x1)}</td><td>${fmt(y1)}</td><td>${fmt(x2)}</td><td>${fmt(y2)}</td><td>${fmt(Math.hypot(x2 - x1, y2 - y1))}</td></tr>`;
  }
  return '<h3>Tabulación</h3><div class="tabla-wrap"><table class="tabla"><thead><tr>' +
    '<th>t (s)</th><th>x₁ (m)</th><th>y₁ (m)</th><th>x₂ (m)</th><th>y₂ (m)</th><th>distancia entre ellos (m)</th>' +
    `</tr></thead><tbody>${f}</tbody></table></div>`;
}

function verCp(i) {
  const e = cpEscs[i], k = cpK;
  document.querySelectorAll('#cp-sel button').forEach((b, j) => b.classList.toggle('activo', j === i));
  const rows = [['Ángulo del proyectil 1 (θ1)', e.th1 / RAD, '°', k === 'a1' || k === 'ver'],
                ['Ángulo del proyectil 2 (θ2)', e.th2 / RAD, '°', k === 'a2' || k === 'ver']];
  if (e.choque) rows.push(['Tiempo del choque', e.tc, 's', k === 't'], ['Altura del choque', e.yc, 'm', k === 'h'],
                          ['Posición horizontal del choque', e.xc, 'm']);
  else rows.push(['Distancia mínima entre proyectiles', e.dmin, 'm'], ['Instante de mayor acercamiento', e.tc, 's']);
  document.getElementById('cp-sol').innerHTML = filas(rows) + resumenCol(e);
  const tg = e.choque ? Math.min(e.tc * 1.3, Math.min(e.T1, e.T2)) : Math.min(e.T1, e.T2);
  document.getElementById('cp-graf').hidden = false;
  graficaMulti('cp-g1', 'Altura (m) vs tiempo', [
    { f: t => e.vy1 * t - 0.5 * e.g * t * t, T: tg, color: '#6A32C9', nombre: 'proyectil 1' },
    { f: t => e.vy2 * t - 0.5 * e.g * t * t, T: tg, color: '#3DBE8B', nombre: 'proyectil 2', dash: [8, 6] }], 't (s)');
  graficaMulti('cp-g2', 'Posición horizontal (m) vs tiempo', [
    { f: t => e.vx1 * t, T: tg, color: '#6A32C9', nombre: 'proyectil 1' },
    { f: t => e.d - e.vx2 * t, T: tg, color: '#3DBE8B', nombre: 'proyectil 2' }], 't (s)');
  document.getElementById('cp-tabla').innerHTML = tablaCol(e);
  document.getElementById('cp-anim').hidden = false;
  animarColision(e);
}

function estrellaG(x, px, py, r, col) {
  x.beginPath();
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * 0.5 : r; x.lineTo(px + rr * Math.cos(a), py + rr * Math.sin(a)); }
  x.closePath(); x.fillStyle = col; x.fill();
}

// Simulación: dos cañones frente a frente, trayectorias, choque y explosión
function animarColision(e) {
  const c = document.getElementById('cp-anim'), x = c.getContext('2d'), W = c.width, H = c.height, m = 50, suelo = 350;
  const R1 = e.vx1 * e.T1, R2 = e.vx2 * e.T2, hm = Math.max(1, e.vy1 ** 2 / (2 * e.g), e.vy2 ** 2 / (2 * e.g));
  const xmax = Math.max(e.d, R1), xmin = Math.min(0, e.d - R2);
  const s = Math.min((W - 2 * m) / (xmax - xmin), (suelo - 80) / hm);
  const X = u => m + (u - xmin) * s, Y = h => suelo - h * s;
  const P1 = t => [X(e.vx1 * t), Y(e.vy1 * t - 0.5 * e.g * t * t)];
  const P2 = t => [X(e.d - e.vx2 * t), Y(e.vy2 * t - 0.5 * e.g * t * t)];
  const Tfin = e.choque ? e.tc * 1.25 : Math.max(e.T1, e.T2);
  const raw = (xmax - xmin) / 8, pot = 10 ** Math.floor(Math.log10(raw));
  const paso = [1, 2, 5, 10].map(q => q * pot).find(q => q >= raw);
  const col1 = '#6A32C9', col2 = '#3DBE8B';
  const traza = (P, hasta) => {
    x.beginPath();
    for (let i = 0; i <= 100; i++) { const [px, py] = P(hasta * i / 100); i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  };
  const canon = (px, th, dir, col, txt) => {
    const py = suelo - 16, co = Math.cos(th), si = Math.sin(th);
    x.lineCap = 'round';
    x.strokeStyle = '#2B1650'; x.lineWidth = 10; x.beginPath(); x.moveTo(px, py); x.lineTo(px + dir * 34 * co, py - 34 * si); x.stroke();
    x.strokeStyle = col; x.lineWidth = 5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + dir * 34 * co, py - 34 * si); x.stroke();
    x.lineCap = 'butt';
    flecha(x, px + dir * 38 * co, py - 38 * si, px + dir * 100 * co, py - 100 * si, col);
    x.fillStyle = '#2B1650'; x.textAlign = dir > 0 ? 'left' : 'right';
    x.fillText(txt, px + dir * 106 * co, py - 106 * si);
    x.fillRect(px - 24, suelo - 16, 48, 16); x.beginPath(); x.arc(px, suelo - 16, 10, 0, 7); x.fill();
  };

  cancelAnimationFrame(animCp);
  let ini = null;
  function cuadro(ahora) {
    if (ini === null) ini = ahora;
    const f = Math.min((ahora - ini) / 6000, 1), t = Tfin * f, tt = e.choque ? Math.min(t, e.tc) : t;
    x.clearRect(0, 0, W, H);
    x.font = '13px "IBM Plex Mono", monospace';
    // suelo, marcas en metros y separación inicial
    x.fillStyle = '#58B88B'; x.fillRect(0, suelo, W, 18);
    x.fillStyle = '#2B1650'; x.textAlign = 'center'; x.lineWidth = 1; x.strokeStyle = '#2B1650';
    for (let u = Math.ceil(xmin / paso) * paso; u <= xmax + 1e-9; u += paso) {
      x.beginPath(); x.moveTo(X(u), suelo + 18); x.lineTo(X(u), suelo + 24); x.stroke();
      x.fillText(fmt(+u.toPrecision(6)), X(u), suelo + 38);
    }
    const ya = suelo + 62, xm = (X(0) + X(e.d)) / 2;
    flecha(x, xm, ya, X(0), ya, '#2B1650'); flecha(x, xm, ya, X(e.d), ya, '#2B1650');
    x.fillText('separación inicial = ' + fmt(e.d) + ' m', xm, ya + 20);
    // cañones
    canon(X(0), e.th1, 1, col1, 'θ1 = ' + fmt(e.th1 / RAD) + '°');
    canon(X(e.d), e.th2, -1, col2, 'θ2 = ' + fmt(e.th2 / RAD) + '°');
    // trayectorias y proyectiles
    [[P1, e.T1, col1], [P2, e.T2, col2]].forEach(([P, T, col]) => {
      x.strokeStyle = col; x.lineWidth = 2; x.globalAlpha = 0.45; x.setLineDash([6, 6]); traza(P, T);
      x.setLineDash([]); x.globalAlpha = 1;
      x.lineWidth = 3; traza(P, Math.min(tt, T));
      if (t < T && !(e.choque && t >= e.tc)) {
        const [px, py] = P(t);
        x.fillStyle = col; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill();
        x.strokeStyle = '#2B1650'; x.lineWidth = 2; x.stroke();
      } else if (!e.choque) {
        const [px, py] = P(T);
        x.fillStyle = col; x.beginPath(); x.arc(px, suelo - 4, 6, 0, 7); x.fill();
      }
    });
    if (e.choque && t >= e.tc) {
      const [px, py] = P1(e.tc), r = 16 + 12 * Math.min(1, (t - e.tc) / (0.1 * Tfin));
      estrellaG(x, px, py, r, '#F59E0B'); estrellaG(x, px, py, r * 0.55, '#FDE047');
    }
    // datos en vivo y leyenda
    const y1 = Math.max(0, e.vy1 * tt - 0.5 * e.g * tt * tt), y2 = Math.max(0, e.vy2 * tt - 0.5 * e.g * tt * tt);
    const dist = Math.hypot(e.d - (e.vx1 + e.vx2) * tt, y2 - y1);
    x.fillStyle = '#2B1650'; x.textAlign = 'left';
    x.fillText('t = ' + fmt(tt) + ' s   distancia entre proyectiles = ' + fmt(dist) + ' m', 12, 22);
    x.textAlign = 'right';
    x.fillStyle = col1; x.fillText('● proyectil 1 (v = ' + fmt(e.v1) + ' m/s)', W - 12, 22);
    x.fillStyle = col2; x.fillText('● proyectil 2 (v = ' + fmt(e.v2) + ' m/s)', W - 12, 42);
    if (f < 1) animCp = requestAnimationFrame(cuadro);
  }
  animCp = requestAnimationFrame(cuadro);
}

document.getElementById('cp-calc').addEventListener('click', calcCp);
document.getElementById('cp-ejemplo').addEventListener('click', () => { cargarEjemploCp(); calcCp(); });
document.getElementById('cp-limpiar').addEventListener('click', () => {
  for (const k in CPI) document.getElementById(CPI[k]).value = k === 'g' ? 9.81 : '';
  document.getElementById('cp-res').innerHTML = '';
  ocultarCp();
});
// Al abrir el ejercicio desde la lista, se carga el ejemplo y se muestra todo de nuevo
document.getElementById('ej-colision').addEventListener('abrir', () => { cargarEjemploCp(); calcCp(); });