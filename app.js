const express = require('express');
const app = express();
const { Pool } = require('pg');

// 【关键修复】允许跨域 CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// 数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 健康检查
app.post('/api/v1/health', (req, res) => {
  res.json({ code: 200, msg: 'ok' });
});

// 获取成分列表
app.post('/api/v1/ingredients', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name_zh, name_en FROM ingredients ORDER BY id');
    res.json({ code: 200, data: r.rows.map(i => ({
      id: i.id,
      nameZh: i.name_zh,
      nameEn: i.name_en
    })) });
  } catch (e) {
    res.json({ code: 500, msg: e.message });
  }
});

// 提交数据
app.post('/api/v1/submit', async (req, res) => {
  try {
    const { ingredientId, costPer100mg, region, form } = req.body;
    await pool.query(
      'INSERT INTO user_operation_logs (ingredient_id, ip_country, action) VALUES ($1, $2, $3)',
      [ingredientId, region, 'submit']
    );

    const exist = await pool.query(
      'SELECT id FROM ingredient_stats WHERE ingredient_id=$1 AND region=$2 AND form=$3',
      [ingredientId, region || 'all', form || 'all']
    );

    if (exist.rows.length) {
      await pool.query(
        'UPDATE ingredient_stats SET sample_count=sample_count+1, total_sum=total_sum+$1, updated_at=now() WHERE ingredient_id=$2 AND region=$3 AND form=$4',
        [costPer100mg, ingredientId, region || 'all', form || 'all']
      );
    } else {
      await pool.query(
        'INSERT INTO ingredient_stats (ingredient_id, region, form, sample_count, total_sum, min_cost, max_cost, median_cost) VALUES ($1,$2,$3,1,$4,$4,$4,$4)',
        [ingredientId, region || 'all', form || 'all', costPer100mg]
      );
    }

    res.json({ code: 200, msg: 'success' });
  } catch (e) {
    res.json({ code: 500, msg: e.message });
  }
});

// 报告
app.post('/api/v1/report', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.ingredient_id, i.name_zh, i.name_en,
             SUM(s.sample_count) sample_count,
             MIN(s.min_cost) min_cost,
             MAX(s.max_cost) max_cost,
             AVG(s.median_cost) median_cost
      FROM ingredient_stats s
      JOIN ingredients i ON s.ingredient_id = i.id
      GROUP BY s.ingredient_id, i.name_zh, i.name_en
    `);
    res.json({
      code: 200,
      data: {
        updatedAt: new Date().toLocaleString(),
        totalSample: 0,
        list: r.rows.map(i => ({
          id: i.ingredient_id,
          nameZh: i.name_zh,
          nameEn: i.name_en,
          sampleCount: i.sample_count,
          minCost: i.min_cost,
          maxCost: i.max_cost,
          medianCost: i.median_cost
        }))
      }
    });
  } catch (e) {
    res.json({ code: 500, msg: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`run on ${PORT}`);
});
