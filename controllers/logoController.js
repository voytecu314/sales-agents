const Agent = require('../models/Agent');
const Logo = require('../models/Logo');
const { parseLogo } = require('../services/logo');
const { isValidSlug } = require('../services/slug');
const { invalidate } = require('../services/agentCache');

// GET /api/agents/:slug/logo : public. The URL carries ?v=<version>, so the CDN and browsers can keep it for a year.
async function getLogo(req, res) {
  try {
    const slug = String(req.params.slug || '');
    const doc = isValidSlug(slug) ? await Logo.findOne({ slug }).lean() : null;
    if (!doc) return res.status(404).end();
    const bytes = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer || doc.data);
    res.set({
      'Content-Type': doc.contentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox", // an image can never run anything
      'Cache-Control': req.query.v ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
    });
    res.send(bytes);
  } catch (err) {
    console.error('Logo read failed:', err.message);
    res.status(503).end();
  }
}

// PUT /api/agents/:slug/logo  { image: <base64> }   (owner)
async function putLogo(req, res) {
  const parsed = parseLogo(req.body?.image);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const slug = req.agentDoc.slug;
    const version = Date.now();
    await Logo.findOneAndUpdate({ slug }, { $set: { contentType: parsed.contentType, data: parsed.data } }, { upsert: true });
    await Agent.updateOne({ slug }, { $set: { hasLogo: true, logoVersion: version } });
    invalidate(slug);
    res.json({ ok: true, logoUrl: `/api/agents/${slug}/logo?v=${version}` });
  } catch (err) {
    console.error('Logo save failed:', err.message);
    res.status(500).json({ error: 'Could not save the logo.' });
  }
}

// DELETE /api/agents/:slug/logo   (owner)
async function deleteLogo(req, res) {
  try {
    const slug = req.agentDoc.slug;
    await Logo.deleteOne({ slug });
    await Agent.updateOne({ slug }, { $set: { hasLogo: false, logoVersion: Date.now() } });
    invalidate(slug);
    res.json({ ok: true });
  } catch (err) {
    console.error('Logo delete failed:', err.message);
    res.status(500).json({ error: 'Could not remove the logo.' });
  }
}

module.exports = { getLogo, putLogo, deleteLogo };
