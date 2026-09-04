// Generates real PNG icons (blue rounded square + white pin) with no external deps.
// Run: node scripts/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function setPixel(rgba, w, x, y, r, g, b, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (y * w + x) * 4;
  rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
}

function roundedRectMask(x, y, w, h, r, px, py) {
  // returns true if (px,py) inside rounded rect with corner radius r
  if (px < x || py < y || px >= x + w || py >= y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r + 1e-6 || (px >= x + r && px < x + w - r) || (py >= y + r && py < y + h - r);
}

function pointInPin(px, py, size) {
  // Pin (map marker) shape centered horizontally, teardrop: circle top + triangle bottom point.
  const cx = size / 2;
  const topCy = size * 0.40;
  const radius = size * 0.235;
  const tipY = size * 0.80;

  // Circle part
  const dxc = px - cx, dyc = py - topCy;
  if (dxc * dxc + dyc * dyc <= radius * radius) return true;

  // Triangle part (from the widest point of circle down to the tip)
  if (py > topCy && py <= tipY) {
    const t = (py - topCy) / (tipY - topCy); // 0..1
    const halfWidthAtY = radius * (1 - t);
    if (Math.abs(px - cx) <= halfWidthAtY) return true;
  }
  return false;
}

function pointInHole(px, py, size) {
  const cx = size / 2;
  const cy = size * 0.40;
  const r = size * 0.09;
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function makeIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [21, 101, 192]; // #1565c0
  const cornerR = maskable ? 0 : Math.round(size * 0.19); // maskable: full-bleed bg (safe zone handled by padding)
  const pad = maskable ? size * 0.12 : 0; // keep pin within safe zone for maskable icons

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inBg = maskable ? true : roundedRectMask(0, 0, size, size, cornerR, x, y);
      if (!inBg) {
        setPixel(rgba, size, x, y, 0, 0, 0, 0);
        continue;
      }
      setPixel(rgba, size, x, y, bg[0], bg[1], bg[2], 255);
    }
  }

  const pinSize = maskable ? size - pad * 2 : size;
  const offset = maskable ? pad : 0;
  for (let y = 0; y < pinSize; y++) {
    for (let x = 0; x < pinSize; x++) {
      if (pointInHole(x, y, pinSize)) continue; // leave background showing through hole
      if (pointInPin(x, y, pinSize)) {
        setPixel(rgba, size, x + offset, y + offset, 255, 255, 255, 255);
      }
    }
  }

  return encodePNG(size, size, rgba);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), makeIcon(192, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), makeIcon(512, false));
fs.writeFileSync(path.join(outDir, 'icon-192-maskable.png'), makeIcon(192, true));
fs.writeFileSync(path.join(outDir, 'icon-512-maskable.png'), makeIcon(512, true));

console.log('Icons written to', outDir);
