/**
 * Seal src/config.json → wxen.enc
 * Key is local only: .wxen-db.key or WXEN_DB_KEY. Never commit it.
 *
 *   node scripts/seal.js
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const MAGIC = Buffer.from('WXEN1');
const IV_LEN = 16;
const TAG_LEN = 32;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function loadKey() {
  const fromEnv = (process.env.WXEN_DB_KEY || '').trim();
  const fromFile = path.join(root, '.wxen-db.key');
  const raw = fromEnv || (fs.existsSync(fromFile) ? fs.readFileSync(fromFile, 'utf8').trim() : '');
  if (!raw) throw new Error('Missing WXEN_DB_KEY or .wxen-db.key (do not commit this)');
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return sha256(Buffer.from(raw, 'utf8'));
}

function keystream(key, iv, length) {
  const out = Buffer.alloc(length);
  let off = 0;
  let block = 0;
  while (off < length) {
    const ctr = Buffer.alloc(4);
    ctr.writeUInt32BE(block);
    const chunk = sha256(Buffer.concat([key, Buffer.from('ctr'), iv, ctr]));
    const n = Math.min(chunk.length, length - off);
    chunk.copy(out, off, 0, n);
    off += n;
    block += 1;
  }
  return out;
}

function xor(a, b) {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

function seal(plain, key) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = xor(plain, keystream(key, iv, plain.length));
  const tag = sha256(Buffer.concat([key, Buffer.from('mac'), iv, cipher]));
  return Buffer.concat([MAGIC, iv, tag, cipher]);
}

function open(blob, key) {
  if (blob.length < MAGIC.length + IV_LEN + TAG_LEN) throw new Error('short blob');
  if (!blob.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('bad magic');
  const iv = blob.subarray(MAGIC.length, MAGIC.length + IV_LEN);
  const tag = blob.subarray(MAGIC.length + IV_LEN, MAGIC.length + IV_LEN + TAG_LEN);
  const cipher = blob.subarray(MAGIC.length + IV_LEN + TAG_LEN);
  const expect = sha256(Buffer.concat([key, Buffer.from('mac'), iv, cipher]));
  if (!crypto.timingSafeEqual(tag, expect)) throw new Error('bad tag');
  return xor(cipher, keystream(key, iv, cipher.length));
}

const key = loadKey();
const srcPath = path.join(root, 'src', 'config.json');
if (!fs.existsSync(srcPath)) throw new Error('Create src/config.json first');
const plain = fs.readFileSync(srcPath);
JSON.parse(plain.toString('utf8'));
const blob = seal(plain, key);
if (!open(blob, key).equals(plain)) throw new Error('round-trip failed');
fs.writeFileSync(path.join(root, 'wxen.enc'), blob.toString('base64') + '\n');
console.log('[seal] wrote wxen.enc');
