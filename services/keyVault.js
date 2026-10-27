const crypto = require('crypto');
const ProviderKey = require('../models/ProviderKey');
const { PROVIDERS } = require('./providerRegistry');

const CIPHER = 'aes-256-gcm';
function encryptionKey() {
  const secret = process.env.PROVIDER_KEY_ENCRYPTION_SECRET || '';
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('PROVIDER_KEY_ENCRYPTION_SECRET must contain at least 32 bytes');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}
function encryptKey(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(CIPHER, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64') };
}
function decryptKey(record) {
  const decipher = crypto.createDecipheriv(CIPHER, encryptionKey(), Buffer.from(record.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}
function providerById(id) {
  return PROVIDERS.find((p) => p.id === id);
}
function publicProviders() {
  return PROVIDERS.map(({ id, name, baseUrl, model, help }) => ({ id, name, baseUrl, model, help }));
}
async function listKeys(slug) {
  return ProviderKey.find({ slug }).sort({ position: 1, createdAt: 1 }).select('-ciphertext -iv -authTag').lean();
}
async function saveKey({ slug, provider, apiKey }) {
  const definition = providerById(provider);
  if (!definition) throw Object.assign(new Error('Choose a supported provider.'), { status: 400 });
  const value = String(apiKey || '').trim();
  if (value.length < 8 || value.length > 500) throw Object.assign(new Error('Enter a valid API key.'), { status: 400 });
  const encrypted = encryptKey(value); // fail before writing if encryption is not configured
  const position = await ProviderKey.countDocuments({ slug });
  return ProviderKey.create({ slug, provider, ...encrypted, last4: value.slice(-4), position, status: 'active', lastTestedAt: new Date() });
}
async function ownerProviders(slug) {
  return (await listKeys(slug)).map((key) => ({ id: String(key._id), provider: key.provider, last4: key.last4, position: key.position, status: key.status, cooldownUntil: key.cooldownUntil, lastTestedAt: key.lastTestedAt }));
}
async function loadUsableKeys(slug) {
  const docs = await ProviderKey.find({ slug, status: 'active', $or: [{ cooldownUntil: null }, { cooldownUntil: { $lte: new Date() } }] })
    .sort({ position: 1, createdAt: 1 }).select('+ciphertext +iv +authTag').lean();
  return docs.map((doc) => ({ ...doc, apiKey: decryptKey(doc), provider: providerById(doc.provider) })).filter((doc) => doc.provider);
}
module.exports = { encryptKey, decryptKey, providerById, publicProviders, listKeys, saveKey, ownerProviders, loadUsableKeys };
