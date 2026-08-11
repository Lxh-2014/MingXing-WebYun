const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const { t } = require('./utils/locale');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = 8000;  //服务器端口

const avatarDir = path.join(__dirname, 'assets/user');

// 确保头像目录存在
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 认证中间件
function checkAuth(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// 头像上传接口
app.post('/api/avatar/upload', checkAuth, (req, res) => {
    const { userId } = req.body;
    const base64Data = req.body.avatarData;
    
    if (!userId || !base64Data) {
        console.log('头像上传失败: 缺少参数', { userId: !!userId, avatarData: !!base64Data });
        return res.status(400).json({ success: false, message: '缺少参数' });
    }
    
    try {
        // 提取图片格式和base64数据
        const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!match) {
            return res.status(400).json({ success: false, message: '无效的图片格式' });
        }
        
        const format = match[1];
        const base64String = match[2];
        
        // 仅允许支持的格式
        const allowedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        if (!allowedFormats.includes(format.toLowerCase())) {
            return res.status(400).json({ success: false, message: '不支持的图片格式' });
        }
        
        // 解码base64数据
        const buffer = Buffer.from(base64String, 'base64');
        
        // 保存头像文件（统一使用png格式）
        const avatarPath = path.join(avatarDir, `${userId}.png`);
        fs.writeFileSync(avatarPath, buffer);
        
        console.log(`头像上传成功: ${userId}.png`);
        res.json({ success: true, message: '头像上传成功', avatar: `/assets/user/${userId}.png` });
    } catch (error) {
        console.error('头像上传失败:', error);
        res.status(500).json({ success: false, message: '头像上传失败: ' + error.message });
    }
});

// 获取头像
app.get('/api/avatar/:userId', (req, res) => {
    const { userId } = req.params;
    const avatarPath = path.join(avatarDir, `${userId}.png`);
    
    if (fs.existsSync(avatarPath)) {
        res.sendFile(avatarPath);
    } else {
        res.status(404).json({ success: false, message: '头像不存在' });
    }
});

// 获取版本号
app.get('/api/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({ version: packageJson.version });
});

// 代理获取远程版本号（避免 CORS）
app.get('/api/remote-version', (req, res) => {
    https.get('https://lxh-2014.github.io/MingXingDrive-Update/version.json', (httpsRes) => {
        let data = '';
        
        httpsRes.on('data', (chunk) => {
            data += chunk;
        });
        
        httpsRes.on('end', () => {
            try {
                const versionData = JSON.parse(data);
                // 返回完整的版本数据，确保 can_UpdateVersions 字段存在
                res.json({
                    version: versionData.version,
                    can_UpdateVersions: versionData.can_UpdateVersions || []
                });
            } catch (error) {
                // 如果不是JSON格式，返回默认结构
                res.json({ version: data.trim(), can_UpdateVersions: [] });
            }
        });
        
    }).on('error', (err) => {
        console.error('获取远程版本失败:', err);
        res.status(500).json({ error: '获取远程版本失败' });
    });
});

app.get('/settings', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/files/*', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/files', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use((req, res, next) => {
    const url = req.path;
    if (url === '/' || url === '/login') {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    } else {
        next();
    }
});

app.use(express.static(path.join(__dirname, '../client')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));
app.use('/assets/user', express.static(avatarDir));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`${t('server.startupMessage')}: http://127.0.0.1:${PORT}`);
});