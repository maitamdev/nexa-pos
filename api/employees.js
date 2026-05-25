const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'nexapos-jwt-super-secret-key-2026';

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify Auth Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Mã xác thực không hợp lệ hoặc thiếu (Unauthorized)!' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!' });
  }

  const { storeId, id: ownerId } = decoded;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // GET: List Employees
    if (req.method === 'GET') {
      const dbRes = await client.query(
        'SELECT id, email, name, role, "isActive", "createdAt", "updatedAt" FROM "Employee" WHERE "storeId" = $1 ORDER BY "createdAt" DESC',
        [storeId]
      );
      return res.status(200).json({ success: true, data: dbRes.rows });
    }

    // POST: Create Employee
    if (req.method === 'POST') {
      const { name, email, password, role } = req.body || {};

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin: Tên, Email, Mật khẩu và Vai trò!' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email không đúng định dạng!' });
      }

      // Check unique email globally
      const checkRes = await client.query('SELECT id FROM "Employee" WHERE email = $1', [email]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: 'Email này đã tồn tại trên hệ thống toàn cầu!' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const empId = crypto.randomUUID();

      await client.query(
        'INSERT INTO "Employee" (id, "storeId", email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
        [empId, storeId, email, name, passwordHash, role, true]
      );

      return res.status(200).json({
        success: true,
        message: 'Tạo tài khoản nhân viên thành công!',
        data: { id: empId, name, email, role, isActive: true }
      });
    }

    // PUT: Update Employee
    if (req.method === 'PUT') {
      const { id, name, role, isActive, password } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'Thiếu mã ID nhân viên để cập nhật!' });
      }

      // Check if employee exists and belongs to the store
      const checkRes = await client.query(
        'SELECT id FROM "Employee" WHERE id = $1 AND "storeId" = $2',
        [id, storeId]
      );
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Nhân viên không tồn tại hoặc không thuộc cửa hàng này!' });
      }

      let queryStr = 'UPDATE "Employee" SET name = $1, role = $2, "isActive" = $3';
      const params = [name, role, isActive, id];

      if (password) {
        const passwordHash = bcrypt.hashSync(password, 10);
        queryStr += ', "passwordHash" = $5';
        params.push(passwordHash);
      }

      queryStr += ', "updatedAt" = NOW() WHERE id = $4';

      await client.query(queryStr, params);

      return res.status(200).json({ success: true, message: 'Cập nhật nhân viên thành công!' });
    }

    // DELETE: Delete Employee
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'Thiếu mã ID nhân viên để xóa!' });
      }

      // Prevent self delete
      if (id === ownerId) {
        return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của chính mình!' });
      }

      // Check if employee exists and belongs to the store
      const checkRes = await client.query(
        'SELECT id FROM "Employee" WHERE id = $1 AND "storeId" = $2',
        [id, storeId]
      );
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Nhân viên không tồn tại hoặc không thuộc cửa hàng này!' });
      }

      // Execute delete
      await client.query('DELETE FROM "Employee" WHERE id = $1', [id]);

      return res.status(200).json({ success: true, message: 'Xóa tài khoản nhân viên thành công!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Employees API error:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  } finally {
    await client.end();
  }
};
