const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const idFilePath = path.join(__dirname, '../data/id.json');

// 生成只包含数字、字母和 ._- 的随机ID
function generateRandomId(length = 8) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz._-';
    let id = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        id += chars[randomBytes[i] % chars.length];
    }
    return id;
}

// 检查ID是否已存在
function idExists(id) {
    try {
        const data = fs.readFileSync(idFilePath, 'utf8');
        const json = JSON.parse(data);
        return Object.values(json).includes(id);
    } catch (error) {
        return false;
    }
}

// 生成唯一的随机ID
function generateUniqueId() {
    let id;
    do {
        id = generateRandomId();
    } while (idExists(id));
    return id;
}

// 获取用户ID（如果不存在则创建）
function getUserId(username) {
    try {
        const data = fs.readFileSync(idFilePath, 'utf8');
        const json = JSON.parse(data);
        
        if (json[username]) {
            return json[username];
        }
        
        // 创建新用户ID
        const newId = generateUniqueId();
        json[username] = newId;
        fs.writeFileSync(idFilePath, JSON.stringify(json, null, 2));
        return newId;
    } catch (error) {
        console.error('获取用户ID失败:', error);
        return generateUniqueId(); // 备用方案
    }
}

// 检查用户是否存在
function userExists(username) {
    try {
        const data = fs.readFileSync(idFilePath, 'utf8');
        const json = JSON.parse(data);
        return !!json[username];
    } catch (error) {
        return false;
    }
}

module.exports = { getUserId, userExists };
