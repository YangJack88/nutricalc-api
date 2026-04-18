const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// 1. 配置跨域（解决 CORS 报错）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.options('*', cors());

// 2. 解析 JSON 请求体
app.use(express.json());

// 3. 数据库连接配置（Render 上会自动读取环境变量 DATABASE_URL）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 4. 健康检查接口（已验证正常）
app.get('/api/v1/health', (req, res) => {
  res.json({ code: 200, msg: 'ok' });
});

// 5. 成分列表接口（修复 404）
app.post('/api/v1/ingredients', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name_zh, name_en FROM ingredients ORDER BY id');
    res.json({ code: 200, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, msg: '数据库连接失败' });
  }
});

// 6. 提交数据接口
app.post('/api/v1/submit', async (req, res) => {
  try {
    const { ingredientId, costPer100mg, region, form } = req.body;

    await pool.query(
      'INSERT INTO user_operation_logs (action, ingredient_id, ip_country) VALUES ($1, $2, $3)',
      ['submit', ingredientId, region || 'all']
    );

    const statsResult = await pool.query(
      'SELECT sample_count, total_sum, min_cost, max_cost FROM ingredient_stats WHERE ingredient_id = $1 AND region = $2 AND form = $3',
      [ingredientId, region || 'all', form || 'all']
    );

    if (statsResult.rows.length > 0) {
      const old = statsResult.rows[0];
      const newCount = old.sample_count + 1;
      const newSum = parseFloat(old.total_sum) + parseFloat(costPer100mg);
      const newMin = Math.min(parseFloat(old.min_cost), parseFloat(costPer100mg));
      const newMax = Math.max(parseFloat(old.max_cost), parseFloat(costPer100mg));
      const newMedian = newSum / newCount;

      await pool.query(
        `UPDATE ingredient_stats 
         SET sample_count = $1, total_sum = $2, median_cost = $3, min_cost = $4, max_cost = $5, updated_at = NOW() 
         WHERE ingredient_id = $6 AND region = $7 AND form = $8`,
        [newCount, newSum, newMedian, newMin, newMax, ingredientId, region || 'all', form || 'all']
      );
    } else {
      await pool.query(
        `INSERT INTO ingredient_stats (ingredient_id, region, form, sample_count, total_sum, median_cost, min_cost, max_cost) 
         VALUES ($1, $2, $3, 1, $4, $4, $4, $4)`,
        [ingredientId, region || 'all', form || 'all', costPer100mg]
      );
    }

    res.json({ code: 200, msg: '提交成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, msg: '提交失败' });
  }
});

// 7. 报告接口（修复 404）
app.post('/api/v1/report', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.ingredient_id, 
        i.name_zh, 
        i.name_en, 
        SUM(s.sample_count) AS sample_count, 
        MIN(s.min_cost) AS min_cost, 
        MAX(s.max_cost) AS max_cost, 
        AVG(s.median_cost) AS median_cost
      FROM ingredient_stats s
      JOIN ingredients i ON s.ingredient_id = i.id
      GROUP BY s.ingredient_id, i.name_zh, i.name_en
    `);

    const totalSample = result.rows.reduce((sum, item) => sum + parseInt(item.sample_count), 0);

    res.json({
      code: 200,
      data: {
        updatedAt: new Date().toISOString().split('T')[0],
        totalSample: totalSample,
        list: result.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, msg: '获取报告失败' });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
