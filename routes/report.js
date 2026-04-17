const express = require('express');
const router = express.Router();
const db = require('../db/sql');

router.post('/', async (req, res) => {
  try {
    const list = await db.query(`
      SELECT i.id ingredientId, i.name_zh nameZh, i.name_en nameEn,
             s.median_cost medianCost, s.min_cost minCost, s.max_cost maxCost,
             s.sample_count sampleCount, 'stable' trend
      FROM ingredients i
      JOIN ingredient_stats s ON i.id = s.ingredient_id
      WHERE s.region = 'all' AND s.form = 'all'
    `);

    const totalSample = list.reduce((s, i) => s + i.sampleCount, 0);

    return res.json({
      code: 200,
      data: {
        updatedAt: new Date().toISOString().split('T')[0],
        totalSample,
        list
      }
    });
  } catch (e) {
    return res.json({ code: 500, msg: "error" });
  }
});

module.exports = router;