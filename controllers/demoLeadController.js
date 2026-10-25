// POST /api/lead : contact form on the Urban Web page. Wires the real model, counters and mailer into the handler.
const Lead = require('../models/Lead');
const { hit, dailyKey } = require('../services/counters');
const { sendSiteLead } = require('../services/mailer');
const { createDemoLeadHandler } = require('../services/demoLead');

const demoLead = createDemoLeadHandler({ Lead, hit, dailyKey, sendSiteLead });

module.exports = { demoLead };
