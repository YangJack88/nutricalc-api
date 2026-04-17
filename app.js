const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// 防刷
const limiter = rateLimit({ windowMs: 60*1000, max: 10 });
app.use(limiter);

// 路由
app.use('/api/v1/submit', require('./routes/submit'));
app.use('/api/v1/report', require('./routes/report'));
app.use('/api/v1/ingredients', require('./routes/ingredients'));
app.use('/api/v1/health', require('./routes/health'));

app.listen(config.port, () => {
  console.log(`API running on port ${config.port}`);
});