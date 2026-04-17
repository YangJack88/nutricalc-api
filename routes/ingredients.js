const express = require('express');
const router = express.Router();
const db = require('../db/sql');

router.post('/', async (req, res) => {
  const list = await db.query(`SELECT id, name_zh nameZh, name_en nameEn FROM ingredients`);
  res.json({ code: 200, data: list });
});

module.exports = router;