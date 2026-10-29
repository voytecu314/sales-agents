const express = require('express');
const { withDb } = require('../middleware/withDb');
const { ownerPageHeaders } = require('../middleware/securityHeaders');
const { privacyPage, termsPage, homePage, createPage, editPage, agentPage, agentLegalPage } = require('../controllers/pagesController');

const router = express.Router();

router.get('/', homePage); // Urban Web assistant
router.get('/privacy', privacyPage);
router.get('/terms', termsPage);
router.get('/create', createPage);
router.get('/edit/:slug', ownerPageHeaders, withDb, editPage);
router.get('/a/:slug', withDb, agentPage);
router.get('/a/:slug/legal', withDb, agentLegalPage);

module.exports = router;
