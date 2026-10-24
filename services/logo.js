// Logo uploads. The browser shrinks the image (max 256 px) and sends it as base64. The server does not
// trust that: it checks size and file signature, and only ever serves PNG, JPEG or WebP.
// SVG is NOT accepted: an SVG file can carry scripts.
const MAX_BYTES = 150 * 1024;

function detectType(buf) {
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function parseLogo(base64) {
  if (typeof base64 !== 'string' || !/^[A-Za-z0-9+/=\s]+$/.test(base64) || base64.length > Math.ceil(MAX_BYTES * 1.4)) return { error: 'The logo is too large (max 150 KB after resizing).' };
  const data = Buffer.from(base64, 'base64');
  if (!data.length || data.length > MAX_BYTES) return { error: 'The logo is too large (max 150 KB after resizing).' };
  const contentType = detectType(data);
  if (!contentType) return { error: 'The logo must be a PNG, JPEG or WebP image.' };
  if (contentType === 'image/png' && (data.readUInt32BE(16) > 2000 || data.readUInt32BE(20) > 2000)) return { error: 'The logo dimensions are too large.' };
  return { data, contentType };
}

module.exports = { parseLogo, detectType, MAX_BYTES };
