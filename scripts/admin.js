#!/usr/bin/env node
// Admin tool. Run it on your own computer with the same MONGODB_URI as the live site:
//   node scripts/admin.js <command> [slug] [options]
//
// This is the ONLY way to recover a lost owner key or to renew an expired one (a paid service).
// Later the payment webhook can call rotateKey() from here instead of you.
require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Logo = require('../models/Logo');
const Report = require('../models/Report');
const Setting = require('../models/Setting');
const { newOwnerKey, expiresAtOf, keyDays } = require('../services/ownerKey');

const HELP = `Commands:
  list                         all agents (slug, status, key expiry, leads)
  show <slug>                  details of one agent (never prints the instructions or the key)
  rotate-key <slug> [days]     issue a NEW owner key (lost key or renewal after payment), valid ${keyDays()} days or [days]
  extend <slug> [days]         move the expiry of the current key (default ${keyDays()} days from now), key stays the same
  pause <slug> | resume <slug> switch an agent off / on
  delete <slug>                delete agent, logo and leads
  reports [slug]               visitor reports
  kill on|off                  global kill switch for all LLM calls (reaches the site within ~15 s)
`;

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');

async function rotateKey(slug, days) {
  const key = newOwnerKey(days);
  const r = await Agent.updateOne({ slug }, { $set: { editTokenHash: key.hash, editTokenExpiresAt: key.expiresAt } });
  if (!r.matchedCount) throw new Error(`No agent "${slug}"`);
  return key;
}

async function main() {
  const [cmd, slug, arg] = process.argv.slice(2);
  if (!cmd || cmd === 'help') return console.log(HELP);
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing (.env)');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });

  if (cmd === 'list') {
    const agents = await Agent.find({}).select('slug name status notifyEmail editTokenExpiresAt createdAt').lean();
    for (const a of agents) {
      const leads = await Lead.countDocuments({ slug: a.slug });
      console.log(`${a.slug.padEnd(32)} ${a.status.padEnd(7)} key until ${fmt(expiresAtOf(a))}  leads ${leads}  ${a.notifyEmail || ''}`);
    }
    console.log(`${agents.length} agents`);
  } else if (cmd === 'show' && slug) {
    const a = await Agent.findOne({ slug }).lean();
    if (!a) throw new Error(`No agent "${slug}"`);
    const { systemPrompt, editTokenHash, inputs, locales, ...rest } = a;
    console.log(JSON.stringify({ ...rest, keyExpires: fmt(expiresAtOf(a)), promptChars: systemPrompt.length }, null, 2));
  } else if (cmd === 'rotate-key' && slug) {
    const key = await rotateKey(slug, Number(arg) || undefined);
    console.log(`New owner key for ${slug} (valid until ${fmt(key.expiresAt)}). Send it to the owner; it cannot be shown again:\n`);
    console.log(key.token);
    console.log(`\nEdit link: ${process.env.PUBLIC_BASE_URL || 'https://<your-domain>'}/edit/${slug}#${key.token}`);
  } else if (cmd === 'extend' && slug) {
    const key = newOwnerKey(Number(arg) || undefined);
    const r = await Agent.updateOne({ slug }, { $set: { editTokenExpiresAt: key.expiresAt } });
    if (!r.matchedCount) throw new Error(`No agent "${slug}"`);
    console.log(`Key of ${slug} now valid until ${fmt(key.expiresAt)}`);
  } else if ((cmd === 'pause' || cmd === 'resume') && slug) {
    const r = await Agent.updateOne({ slug }, { $set: { status: cmd === 'pause' ? 'paused' : 'active' } });
    if (!r.matchedCount) throw new Error(`No agent "${slug}"`);
    console.log(`${slug}: ${cmd === 'pause' ? 'paused' : 'active'} (visitors see the change within 60 s)`);
  } else if (cmd === 'delete' && slug) {
    await Promise.all([Agent.deleteOne({ slug }), Lead.deleteMany({ slug }), Logo.deleteOne({ slug })]);
    console.log(`${slug} deleted`);
  } else if (cmd === 'reports') {
    const rs = await Report.find(slug ? { slug } : {}).sort({ createdAt: -1 }).limit(50).lean();
    for (const r of rs) console.log(`${fmt(r.createdAt)}  ${r.slug}  ${r.reason || ''}`);
    console.log(`${rs.length} reports`);
  } else if (cmd === 'kill' && (slug === 'on' || slug === 'off')) {
    await Setting.updateOne({ key: 'killSwitch' }, { $set: { value: slug === 'on' } }, { upsert: true });
    console.log(`Kill switch ${slug}`);
  } else {
    console.log(HELP);
  }
  await mongoose.disconnect();
}

if (require.main === module) main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
module.exports = { rotateKey };
