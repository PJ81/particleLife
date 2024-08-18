const
  canvas = document.createElement("canvas");

canvas.width = 800;
canvas.height = 900;
document.body.appendChild(canvas);
canvas.addEventListener("click", () => setParams());

const
  clr = [], //0xffff0000, 0xff00ff00, 0xff0000ff, 0xffff00ff, 0xffffff00, 0xff00ffff],
  frictionHalfLife = .04,
  n = 2500,
  dt = .02,
  rMax = .1,
  m = 6,
  matrix = [],
  forceFactor = 10,
  frictionFactor = Math.pow(.5, dt / frictionHalfLife),
  ctx = canvas.getContext("2d", {
    willReadFrequently: true
  }),
  data = ctx.createImageData(canvas.width, canvas.height),
  buf = new Uint32Array(data.data.buffer);

ctx.font = "14px Consolas";
ctx.fillStyle = "#fff";

function hslToInt32(h, s, l) {

  const k = (n) => (n + h / 30) % 12,
    a = s * Math.min(l, 1 - l),
    f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))),

    r = Math.round(255 * f(0)),
    g = Math.round(255 * f(8)),
    b = Math.round(255 * f(4));

  return (0xff << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);

}

function createColors() {
  for (let r = 0; r < m; r++) {
    clr.push(hslToInt32(360 / m * r, 1, .5));
  }
}

function random(i = 1, a) {
  if (!a) return Math.random() * i;
  return Math.random() * (a - i) + i;
}

function setParams() {
  matrix.length = 0;

  for (let i = 0; i < m; i++) {
    const row = [];

    for (let j = 0; j < m; j++) {
      let c = random(.3, 1);
      c = random() < .5 ? c : -c;
      row.push(c);
    }

    matrix.push(row);
  }
}

const
  colors = new Int32Array(n),
  positionsX = new Float32Array(n),
  positionsY = new Float32Array(n),
  velocitiesX = new Float32Array(n),
  velocitiesY = new Float32Array(n);

for (let i = 0; i < n; i++) {
  colors[i] = Math.floor(Math.random() * m);
  positionsX[i] = Math.random();
  positionsY[i] = Math.random();
  velocitiesX[i] = 0;
  velocitiesY[i] = 0;
}

function force(r, a) {
  const beta = .3;
  if (r < beta) {
    return r / beta - 1;
  } else if (beta < r && r < 1) {
    return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta));
  } else {
    return 0;
  }
}

function correctBrdSideEfx(x, y) {
  x += x > .5 ? -1 : x < -.5 ? 1 : 0;
  y += y > .5 ? -1 : y < -.5 ? 1 : 0;
  return [x, y];
}

function updateParticles() {
  let totalForceX, totalForceY,
    rx, ry, r, f;

  for (let i = 0; i < n; i++) {
    totalForceX = 0;
    totalForceY = 0;

    for (let j = 0; j < n; j++) {
      if (j === i) continue;

      [rx, ry] = correctBrdSideEfx(positionsX[j] - positionsX[i], positionsY[j] - positionsY[i]);

      r = Math.hypot(rx, ry);

      if (r > 0 && r < rMax) {
        f = force(r / rMax, matrix[colors[i]][colors[j]]);
        totalForceX += rx / r * f;
        totalForceY += ry / r * f;
      }
    }

    totalForceX *= rMax * forceFactor;
    totalForceY *= rMax * forceFactor;

    velocitiesX[i] *= frictionFactor;
    velocitiesY[i] *= frictionFactor;

    velocitiesX[i] += totalForceX * dt;
    velocitiesY[i] += totalForceY * dt;
  }

  for (let i = 0; i < n; i++) {
    positionsX[i] += velocitiesX[i] * dt;
    positionsY[i] += velocitiesY[i] * dt;

    // wrap around
    positionsX[i] = (positionsX[i] + 1) % 1;
    positionsY[i] = (positionsY[i] + 1) % 1;
  }
}

function loop() {
  const d = Date.now();

  updateParticles();

  buf.fill(0xff000000);

  for (let i = 0; i < n; i++) {
    const
      screenX = positionsX[i] * canvas.width,
      screenY = positionsY[i] * canvas.height;

    buf[~~screenX + ~~screenY * canvas.width] = clr[colors[i]]
  }

  ctx.putImageData(data, 0, 0);
  //ctx.fillText(`frame speed: ${Date.now() - d}`, 10, 20);

  requestAnimationFrame(loop);
}

setParams();
createColors();

requestAnimationFrame(loop);