const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

function checkAuth(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        next();
    } else {
        res.redirect('/login');
    }
}

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`明星云网盘服务器已启动: http://127.0.0.1:${PORT}`);
});