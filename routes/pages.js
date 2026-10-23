const express = require('express');
const { withDb } = require('../middleware/withDb');
const { createPage, agentPage } = require('../controllers/pagesController');

const router = express.Router();

router.get('/create', createPage);
router.get('/a/:slug', withDb, agentPage);

module.exports = router;
