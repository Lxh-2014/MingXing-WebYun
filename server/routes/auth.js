const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const userFile = path.join(__dirname, '../data/user.json');
const passwordFile = path.join(__dirname, '../data/password.json');

/**
 * 计算密码的SHA-256哈希值
 * @param {string} password - 明文密码
 * @returns {string} SHA-256哈希值
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 初始化密码文件，将user.json中的密码转换为哈希值存储
 */
function initPasswords() {
    const users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    const passwords = {};
    for (const [username, password] of Object.entries(users)) {
        passwords[username] = hashPassword(password);
    }
    fs.writeFileSync(passwordFile, JSON.stringify(passwords, null, 2));
}

// 确保密码文件存在，如不存在则初始化
if (!fs.existsSync(passwordFile)) {
    initPasswords();
}

/**
 * POST /api/auth/login
 * 用户登录接口
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    const users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    const passwords = JSON.parse(fs.readFileSync(passwordFile, 'utf8'));

    if (!users[username]) {
        return res.status(401).json({ success: false, message: '用户不存在' });
    }

    const hashedPassword = hashPassword(password);
    if (passwords[username] !== hashedPassword) {
        return res.status(401).json({ success: false, message: '密码错误' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    
    res.cookie('token', token, { 
        httpOnly: true, 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true, message: '登录成功', username });
});

/**
 * GET /api/auth/users
 * 获取所有用户列表
 */
router.get('/users', (req, res) => {
    const users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    res.json({ success: true, users: Object.keys(users) });
});

module.exports = router;
