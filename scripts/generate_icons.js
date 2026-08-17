const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  // RGBA buffer
  const width = size;
  const height = size;
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const r = size * 0.42;
  const strokeW = Math.max(1.5, size * 0.08);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check circle ring
      const ringDist = Math.abs(dist - r);
      let ringAlpha = 0;
      if (ringDist <= strokeW / 2 + 0.75) {
        ringAlpha = Math.max(0, Math.min(1, (strokeW / 2 + 0.75 - ringDist) / 1.0));
      }

      // Check triangle play button
      // Triangle vertices:
      // Left-Top: cx - r*0.35, cy - r*0.55
      // Left-Bottom: cx - r*0.35, cy + r*0.55
      // Right-Point: cx + r*0.55, cy
      const tx1 = cx - r * 0.35, ty1 = cy - r * 0.55;
      const tx2 = cx - r * 0.35, ty2 = cy + r * 0.55;
      const tx3 = cx + r * 0.55, ty3 = cy;

      function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
        return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
      }

      const px = x + 0.5, py = y + 0.5;
      const d1 = sign(px, py, tx1, ty1, tx2, ty2);
      const d2 = sign(px, py, tx2, ty2, tx3, ty3);
      const d3 = sign(px, py, tx3, ty3, tx1, ty1);

      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
      const inTriangle = !(hasNeg && hasPos);

      let triAlpha = 0;
      if (inTriangle) {
        triAlpha = 1.0;
      }

      const finalAlpha = Math.max(ringAlpha, triAlpha);
      if (finalAlpha > 0) {
        // Red color #e62117 -> 230, 33, 23
        buffer[idx] = 230;     // R
        buffer[idx + 1] = 33;  // G
        buffer[idx + 2] = 23;  // B
        buffer[idx + 3] = Math.round(finalAlpha * 255); // A
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  return encodePNG(width, height, buffer);
}

function encodePNG(width, height, rgbaBuffer) {
  // Raw image data with filter byte 0 at start of each scanline
  const rowBytes = width * 4;
  const filtered = Buffer.alloc(height * (rowBytes + 1));

  for (let y = 0; y < height; y++) {
    const srcOffset = y * rowBytes;
    const destOffset = y * (rowBytes + 1);
    filtered[destOffset] = 0; // Filter: None
    rgbaBuffer.copy(filtered, destOffset + 1, srcOffset, srcOffset + rowBytes);
  }

  const compressed = zlib.deflateSync(filtered, { level: 9 });

  // CRC calculation
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(4 + 4 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crcVal = crc32(chunk.subarray(4, 8 + len));
    chunk.writeUInt32BE(crcVal, 8 + len);
    return chunk;
  }

  // Header: 8 bytes
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const png = createPNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Generated ${filename} (${png.length} bytes)`);
});
