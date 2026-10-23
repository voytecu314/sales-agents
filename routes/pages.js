const express = require('express');
const { withDb } = require('../middleware/withDb');
const { ownerPageHeaders } = require('../middleware/securityHeaders');
const { createPage, editPage, agentPage } = require('../controllers/pagesController');

const router = express.Router();

router.get('/create', createPage);
router.get('/edit/:slug', ownerPageHeaders, editPage);
router.get('/a/:slug', withDb, agentPage);

module.exports = router;
