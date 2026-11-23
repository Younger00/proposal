const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const needsSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('supabase.com');

const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;