const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers so Electron can request it if needed (though it opens browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin!' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ!' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải từ 6 ký tự trở lên!' });
  }

  // Validate role
  const validRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY'];
  if (!validRoles.includes(role.toUpperCase())) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ!' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Check if email already exists
    const checkRes = await client.query('SELECT id FROM "Employee" WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Email này đã được đăng ký trong hệ thống!' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();

    // Insert new employee into the DB
    await client.query(
      'INSERT INTO "Employee" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [id, email, name, passwordHash, role.toUpperCase(), true]
    );

    return res.status(200).json({ success: true, message: 'Đăng ký tài khoản nhân viên thành công!' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ kết nối Database: ' + error.message });
  } finally {
    await client.end();
  }
};
