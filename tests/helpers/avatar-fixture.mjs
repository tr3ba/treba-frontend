// An asymmetric, non-personal image for crop and multipart checks.
import { deflateSync } from "node:zlib";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, crc]);
}
export function avatarFixturePng(width = 900, height = 600) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      const color = x < width / 3 ? [61, 87, 239] : x > width * 2 / 3 ? [244, 153, 93] : [57, 182, 170];
      const marker = (x - width * .6) ** 2 + (y - height * .4) ** 2 < (height * .17) ** 2;
      pixels.set(marker ? [255, 255, 255] : color.map(channel => Math.round(channel * (.7 + .3 * y / height))), offset);
    }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);
}
