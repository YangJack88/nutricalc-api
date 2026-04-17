const express = require('express');
const router = express.Router();
const db = require('../db/sql');
const { updateStats } = require('../service/statsService');

router.post('/', async (req, res) => {
  try {
    const { ingredientId, costPer100mg, region, form } = req.body;

    // 合规校验
    if (!ingredientId || !costPer100mg || costPer100mg <= 0) {
      return res.json({ code: 400, msg: "invalid data" });
    }
    if (costPer100mg > 10) return res.json({ code: 400, msg: "invalid cost" });

    // 更新统计（不保存用户数据）
    await updateStats(db, ingredientId, region || 'all', form || 'all', costPer100mg);

    // 匿名日志
    await db.query(`INSERT INTO user_operation_logs (action, ingredient_id) VALUES (?,?)`,
      ['submit', ingredientId]);

    return res.json({ code: 200, msg: "success" });
  } catch (e) {
    return res.json({ code: 500, msg: "error" });
  }
});

module.exports = router;