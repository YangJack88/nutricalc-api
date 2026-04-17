// 零风险聚合统计算法
exports.updateStats = async (db, ingredientId, region, form, cost) => {
  const row = await db.query(`
    SELECT sample_count, total_sum, min_cost, max_cost
    FROM ingredient_stats
    WHERE ingredient_id = ? AND region = ? AND form = ?
  `, [ingredientId, region, form]);

  if (!row || row.length === 0) return false;

  const old = row[0];
  const newCount = old.sample_count + 1;
  const newSum = old.total_sum + cost;
  const newMedian = newSum / newCount;
  const newMin = Math.min(old.min_cost, cost);
  const newMax = Math.max(old.max_cost, cost);

  await db.query(`
    UPDATE ingredient_stats
    SET sample_count = ?, total_sum = ?, median_cost = ?, min_cost = ?, max_cost = ?
    WHERE ingredient_id = ? AND region = ? AND form = ?
  `, [newCount, newSum, newMedian, newMin, newMax, ingredientId, region, form]);

  return true;
};