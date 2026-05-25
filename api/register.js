const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storeName, adminName, email, password } = req.body || {};

  if (!storeName || !adminName || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin!' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ!' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải từ 6 ký tự trở lên!' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Check if email already exists globally
    const checkRes = await client.query('SELECT id FROM "Employee" WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Email này đã được đăng ký cho một tài khoản khác!' });
    }

    // Start Transaction
    await client.query('BEGIN');

    // 1. Create Store
    const storeId = crypto.randomUUID();
    await client.query(
      'INSERT INTO "Store" (id, name, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
      [storeId, storeName]
    );

    // 2. Create Admin Employee linked to Store
    const passwordHash = bcrypt.hashSync(password, 10);
    const empId = crypto.randomUUID();

    await client.query(
      'INSERT INTO "Employee" (id, "storeId", email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [empId, storeId, email, adminName, passwordHash, 'ADMIN', true]
    );

    // Commit Transaction
    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Đăng ký Cửa hàng thành công!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ kết nối Database: ' + error.message });
  } finally {
    await client.end();
  }
};
