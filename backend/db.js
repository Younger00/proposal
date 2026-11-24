const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const needsSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('render.com') ||
  connectionString.includes('supabase.com') ||
  Boolean(connectionString);

const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;