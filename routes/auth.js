const config = require('../config');

function login(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  if (password !== config.adminPassword) {
    return res.status(401).json({ error: '密码错误' });
  }

  req.session.authenticated = true;
  res.json({ success: true });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '退出失败' });
    }
    res.json({ success: true });
  });
}

function checkAuth(req, res) {
  res.json({ authenticated: !!req.session.authenticated });
}

module.exports = { login, logout, checkAuth };
