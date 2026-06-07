const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { t } = require('../utils/locale');

const router = express.Router();
const filesDir = path.join(__dirname, '../../files');

// Windows保留名称列表
const RESERVED_NAMES = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];

// 非法字符列表
const INVALID_CHARS = /[\\/:*?"<>|]/;

/**
 * 配置multer用于文件上传
 */
const upload = multer({ dest: filesDir });

/**
 * 获取文件根目录
 * GET /api/files/root
 */
router.get('/root', (req, res) => {
    res.json({ success: true, root: filesDir });
});

/**
 * 获取文件列表
 * GET /api/files/list
 */
router.get('/list', (req, res) => {
    let folder = req.query.folder || filesDir;
    
    // 如果是相对路径，转换为完整路径
    if (typeof folder === 'string' && (folder.startsWith('/') || folder.startsWith('\\'))) {
        folder = path.join(filesDir, folder.replace(/\//g, path.sep));
    }
    
    if (!fs.existsSync(folder)) {
        return res.json({ success: true, files: [], folders: [] });
    }

    const items = fs.readdirSync(folder, { withFileTypes: true });
    const files = [];
    const folders = [];

    for (const item of items) {
        const itemPath = path.join(folder, item.name);
        const stats = fs.statSync(itemPath);
        
        if (item.isDirectory()) {
            folders.push({
                name: item.name,
                path: itemPath,
                created: stats.birthtime,
                modified: stats.mtime
            });
        } else {
            files.push({
                name: item.name,
                path: itemPath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            });
        }
    }

    res.json({ success: true, files, folders });
});

/**
 * 上传文件
 * POST /api/files/upload
 */
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: t('files.selectFile') });
    }

    try {
        // 获取目标目录
        let targetDir = req.body.folder || filesDir;
        
        // 处理路径：如果是相对路径，转换为完整路径
        if (typeof targetDir === 'string') {
            const isAbsolutePath = path.isAbsolute(targetDir);
            if (!isAbsolutePath && (targetDir.startsWith('/') || targetDir.startsWith('\\'))) {
                targetDir = path.join(filesDir, targetDir.replace(/\//g, path.sep));
            }
        }

        // 确保目标目录存在
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 处理中文文件名
        const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        const targetPath = path.join(targetDir, originalname);
        
        // 将临时文件移动到目标位置
        fs.renameSync(req.file.path, targetPath);
        
        res.json({ success: true, message: t('files.uploadSuccess'), file: { ...req.file, path: targetPath } });
    } catch (error) {
        // 如果移动失败，删除临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: t('files.uploadFailed') + ': ' + error.message });
    }
});

/**
 * 新建文件夹
 * POST /api/files/newfolder
 */
router.post('/newfolder', (req, res) => {
    const { name, parent } = req.body;
    const targetDir = parent || filesDir;

    if (!name) {
        return res.status(400).json({ success: false, message: t('files.enterFolderName') });
    }

    if (INVALID_CHARS.test(name)) {
        return res.status(400).json({ success: false, message: t('files.invalidChars') });
    }

    if (RESERVED_NAMES.includes(name.toUpperCase())) {
        return res.status(400).json({ success: false, message: t('files.invalidDeviceName') });
    }

    const newFolderPath = path.join(targetDir, name);

    if (fs.existsSync(newFolderPath)) {
        return res.status(400).json({ success: false, message: t('files.folderExists', { name }) });
    }

    fs.mkdirSync(newFolderPath);
    res.json({ success: true, message: t('files.folderCreated') });
});

/**
 * 删除文件或文件夹
 * POST /api/files/delete
 */
router.post('/delete', (req, res) => {
    const { path: itemPath } = req.body;

    if (!itemPath) {
        return res.status(400).json({ success: false, message: t('files.specifyPath') });
    }

    if (!fs.existsSync(itemPath)) {
        return res.status(404).json({ success: false, message: t('files.notExist') });
    }

    const stats = fs.statSync(itemPath);
    
    try {
        if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true });
        } else {
            fs.unlinkSync(itemPath);
        }
        res.json({ success: true, message: t('files.deleted') });
    } catch (error) {
        res.status(500).json({ success: false, message: t('files.deleteFailed') });
    }
});

/**
 * 重命名文件或文件夹
 * POST /api/files/rename
 */
router.post('/rename', (req, res) => {
    const { oldPath, newName } = req.body;

    if (!oldPath || !newName) {
        return res.status(400).json({ success: false, message: t('files.provideOldPathAndNewName') });
    }

    if (INVALID_CHARS.test(newName)) {
        return res.status(400).json({ success: false, message: t('files.invalidChars') });
    }

    if (RESERVED_NAMES.includes(newName.toUpperCase())) {
        return res.status(400).json({ success: false, message: t('files.invalidDeviceName') });
    }

    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);

    if (fs.existsSync(newPath)) {
        return res.status(400).json({ success: false, message: t('files.folderExists', { name: newName }) });
    }

    try {
        fs.renameSync(oldPath, newPath);
        res.json({ success: true, message: t('files.renamed') });
    } catch (error) {
        res.status(500).json({ success: false, message: t('files.renameFailed') });
    }
});

/**
 * 获取文件详细信息
 * GET /api/files/info
 */
router.get('/info', (req, res) => {
    const { path: itemPath } = req.query;

    if (!itemPath) {
        return res.status(400).json({ success: false, message: t('files.specifyFilePath') });
    }

    if (!fs.existsSync(itemPath)) {
        return res.status(404).json({ success: false, message: t('files.fileNotFound') });
    }

    const stats = fs.statSync(itemPath);
    const info = {
        name: path.basename(itemPath),
        path: itemPath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
    };

    res.json({ success: true, info });
});

/**
 * 下载文件
 * GET /api/files/download
 */
router.get('/download', (req, res) => {
    const { path: itemPath } = req.query;

    if (!itemPath) {
        return res.status(400).json({ success: false, message: t('files.specifyFilePath') });
    }

    if (!fs.existsSync(itemPath)) {
        return res.status(404).json({ success: false, message: t('files.fileNotFound') });
    }

    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
        return res.status(400).json({ success: false, message: t('files.cannotDownloadFolder') });
    }

    res.download(itemPath);
});

module.exports = router;
