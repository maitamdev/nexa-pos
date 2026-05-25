const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'nexapos-jwt-super-secret-key-2026';

function base64urlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateToken(payload) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.${signature}`;
}

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

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email và mật khẩu!' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Query employee
    const queryRes = await client.query(
      'SELECT e.*, s.name as "storeName" FROM "Employee" e JOIN "Store" s ON e."storeId" = s.id WHERE e.email = $1 LIMIT 1',
      [email]
    );

    if (queryRes.rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trên hệ thống!' });
    }

    const employee = queryRes.rows[0];

    // Check role is ADMIN
    if (employee.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền truy cập trang này!' });
    }

    // Check status
    if (!employee.isActive) {
      return res.status(403).json({ error: 'Tài khoản này đang bị tạm khóa!' });
    }

    // Verify password
    if (!bcrypt.compareSync(password, employee.passwordHash)) {
      return res.status(401).json({ error: 'Mật khẩu đăng nhập không chính xác!' });
    }

    // Generate Token (Expires in 24h)
    const payload = {
      id: employee.id,
      storeId: employee.storeId,
      role: employee.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    const token = generateToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        storeId: employee.storeId,
        storeName: employee.storeName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  } finally {
    await client.end();
  }
};
