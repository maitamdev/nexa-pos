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

  const { name, email, password, role, managerEmail, managerPassword } = req.body || {};

  if (!name || !email || !password || !role || !managerEmail || !managerPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin (bao gồm tài khoản xác thực của Quản lý)!' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || !emailRegex.test(managerEmail)) {
    return res.status(400).json({ error: 'Email không hợp lệ!' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu nhân viên phải từ 6 ký tự trở lên!' });
  }

  // Validate role
  const validRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY'];
  if (!validRoles.includes(role.toUpperCase())) {
    return res.status(400).json({ error: 'Vai trò nhân viên không hợp lệ!' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // 1. Authenticate Manager
    const managerRes = await client.query('SELECT * FROM "Employee" WHERE email = $1', [managerEmail]);
    if (managerRes.rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản Quản lý xác thực không tồn tại!' });
    }

    const manager = managerRes.rows[0];
    if (!bcrypt.compareSync(managerPassword, manager.passwordHash)) {
      return res.status(401).json({ error: 'Mật khẩu xác thực Quản lý không chính xác!' });
    }

    if (manager.role !== 'ADMIN' && manager.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Tài khoản xác thực không có quyền Quản lý/Quản trị!' });
    }

    if (!manager.isActive) {
      return res.status(403).json({ error: 'Tài khoản Quản lý xác thực đang bị khóa!' });
    }

    // 2. Check if new employee email already exists
    const checkRes = await client.query('SELECT id FROM "Employee" WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Email nhân viên này đã được đăng ký trên hệ thống!' });
    }

    // 3. Hash password
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();

    // Insert new employee
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
