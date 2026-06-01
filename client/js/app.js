﻿/*
明星云网盘 - 纯 JavaScript 动态网盘应用
*/
const App = {
    username: null,
    currentPage: 'login',

    init() {
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        this.username = localStorage.getItem('username');

        const route = this.parseUrl();

        if (route.page === 'login') {
            if (this.username) {
                this.currentPage = 'files';
                history.replaceState({}, '', '/files');
            } else {
                this.currentPage = 'login';
            }
        } else if (route.page === 'files' || route.page === 'settings') {
            if (!this.username) {
                this.currentPage = 'login';
                history.replaceState({}, '', '/login');
            } else {
                this.currentPage = route.page;
            }
        }

        // 初始化 currentFolderPath
        if (route.folderPath) {
            this.currentFolderPath = route.folderPath;
            localStorage.setItem('currentFolderPath', route.folderPath);
        } else if (localStorage.getItem('currentFolderPath')) {
            // 如果 URL 中没有路径，但 localStorage 中有，使用 localStorage 中的值
            this.currentFolderPath = localStorage.getItem('currentFolderPath');
        } else {
            // 默认使用根目录
            this.currentFolderPath = 'D:\\Web_yun\\files';
        }

        // 初始化深色模式
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        this.render();
    },

    navigate(page, folderPath = null) {
        this.currentPage = page;
        this.currentFolderPath = folderPath;

        let url = '/';
        if (page === 'files') {
            if (folderPath) {
                const filesRoot = 'D:\\Web_yun\\files';
                let relativePath = folderPath.replace(filesRoot, '').replace(/\\/g, '/');
                if (!relativePath.startsWith('/')) {
                    relativePath = '/' + relativePath;
                }
                url = '/files' + relativePath;
                localStorage.setItem('currentFolderPath', folderPath);
                this.addToHistory(folderPath);
            } else {
                url = '/files';
                localStorage.removeItem('currentFolderPath');
                this.addToHistory(null);
            }
        } else if (page === 'settings') {
            url = '/settings';
        } else if (page === 'login') {
            url = '/login';
        }

        history.pushState({ page, folderPath }, '', url);
        this.render();
    },

    handlePopState(e) {
        if (e.state) {
            this.currentPage = e.state.page;
            if (e.state.folderPath) {
                this.currentFolderPath = e.state.folderPath;
            }
            this.render();
        }
    },

    parseUrl() {
        const path = window.location.pathname;

        if (path === '/login') {
            return { page: 'login' };
        } else if (path === '/settings') {
            return { page: 'settings' };
        } else if (path.startsWith('/files')) {
            if (path === '/files') {
                return { page: 'files', folderPath: null };
            } else {
                const relativePath = decodeURIComponent(path.slice(7));
                const filesRoot = 'D:\\Web_yun\\files';
                const folderPath = filesRoot + relativePath.replace(/\//g, '\\');
                return { page: 'files', folderPath };
            }
        }

        return { page: 'login' };
    },

    render() {
        const app = document.getElementById('app');
        app.innerHTML = '';

        switch (this.currentPage) {
            case 'login':
                this.renderLogin(app);
                break;
            case 'files':
                this.renderFilesPage(app);
                break;
            case 'settings':
                this.renderSettings(app);
                break;
        }
    },

    renderLogin(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'login-container';

        const card = document.createElement('div');
        card.className = 'login-box';

        const logo = document.createElement('div');
        logo.className = 'login-logo';

        const logoImg = document.createElement('img');
        logoImg.src = '/docs/icon.png';
        logoImg.alt = '明星云网盘';
        logoImg.className = 'login-logo-img';

        const title = document.createElement('h1');
        title.textContent = '明星云网盘';

        const subtitle = document.createElement('p');
        subtitle.textContent = '登录以继续使用';

        const form = document.createElement('form');
        form.id = 'loginForm';
        form.className = 'login-form';

        const userInput = document.createElement('input');
        userInput.type = 'text';
        userInput.id = 'username';
        userInput.className = 'login-input';
        userInput.placeholder = '请输入用户名';
        userInput.autocomplete = 'username';
        userInput.required = true;

        const passInput = document.createElement('input');
        passInput.type = 'password';
        passInput.id = 'password';
        passInput.className = 'login-input';
        passInput.placeholder = '请输入密码';
        passInput.autocomplete = 'current-password';
        passInput.required = true;

        const errorMsg = document.createElement('p');
        errorMsg.id = 'errorMsg';
        errorMsg.className = 'login-error';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-column2 login-btn';
        submitBtn.textContent = '登 录';

        logo.appendChild(logoImg);
        logo.appendChild(title);
        logo.appendChild(subtitle);
        form.appendChild(userInput);
        form.appendChild(passInput);
        form.appendChild(errorMsg);
        form.appendChild(submitBtn);

        card.appendChild(logo);
        card.appendChild(form);
        wrapper.appendChild(card);
        container.appendChild(wrapper);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.textContent = '';

            const usernameVal = userInput.value.trim();
            const passwordVal = passInput.value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameVal, password: passwordVal })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('username', usernameVal);
                    this.username = usernameVal;
                    this.navigate('files');
                } else {
                    errorMsg.textContent = data.message || '登录失败';
                }
            } catch (error) {
                errorMsg.textContent = '登录失败，请检查用户名和密码';
            }
        });
    },

    async renderFilesPage(container) {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';

        const sidebar = this.createSidebar('files');
        const mainContent = document.createElement('main');
        mainContent.className = 'main-content';

        const topbar = this.createTopbar();
        const contentArea = document.createElement('div');
        contentArea.className = 'content-area';

        const toolbar = this.createToolbar();
        const fileGrid = document.createElement('div');
        fileGrid.className = 'file-grid';
        fileGrid.id = 'fileGrid';

        contentArea.appendChild(toolbar);
        contentArea.appendChild(fileGrid);
        mainContent.appendChild(topbar);
        mainContent.appendChild(contentArea);
        mainContainer.appendChild(sidebar);
        mainContainer.appendChild(mainContent);
        container.appendChild(mainContainer);

        this.fileGridEl = fileGrid;
        this.fileGridEl.innerHTML = '<div class="loading"></div>';

        await this.loadFiles(this.currentFolderPath);
    },

    createSidebar(activePage) {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';

        const header = document.createElement('div');
        header.className = 'sidebar-header';

        const logo = document.createElement('div');
        logo.className = 'sidebar-logo';
        
        const logoImg = document.createElement('img');
        logoImg.src = '/docs/icon.png';
        logoImg.alt = '明星云网盘';
        logoImg.style.width = '100%';
        logoImg.style.height = '100%';
        logoImg.style.objectFit = 'cover';
        logo.appendChild(logoImg);

        const nav = document.createElement('nav');
        nav.className = 'sidebar-nav';

        const navItems = [
            { id: 'files', icon: 'folder', text: '文件' },
            { id: 'settings', icon: 'settings', text: '设置' }  
        ];

        navItems.forEach(item => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item' + (item.id === activePage ? ' active' : '');
            navItem.innerHTML = this.getIcon(item.icon);
            navItem.addEventListener('click', () => {
                if (item.id === 'files') {
                    this.navigate('files', null);
                } else {
                    this.navigate(item.id);
                }
            });
            nav.appendChild(navItem);
        });

        sidebar.appendChild(header);
        header.appendChild(logo);
        sidebar.appendChild(nav);

        return sidebar;
    },

    createTopbar() {
        const topbar = document.createElement('header');
        topbar.className = 'topbar';

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';

        // 检查是否有保存的头像图片
        const savedAvatarImage = localStorage.getItem('avatarImage');
        if (savedAvatarImage) {
            avatar.style.background = 'transparent';
            avatar.style.backgroundImage = 'url(' + savedAvatarImage + ')';
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.textContent = '';
        } else {
            // 检查是否有保存的头像颜色
            const savedAvatarColor = localStorage.getItem('avatarColor');
            if (savedAvatarColor) {
                avatar.style.background = savedAvatarColor;
            }
            avatar.textContent = this.username ? this.username.charAt(0) : '';
        }

        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = this.username || '';

        userInfo.appendChild(avatar);
        userInfo.appendChild(userName);
        topbar.appendChild(userInfo);

        return topbar;
    },

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';

        const addressBar = this.createAddressBar();
        toolbar.appendChild(addressBar);

        const actionButtons = document.createElement('div');
        actionButtons.className = 'toolbar-actions';

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'toolbar-btn';
        uploadBtn.innerHTML = this.getIcon('upload') + '<span>上传文件</span>';
        uploadBtn.addEventListener('click', () => document.getElementById('fileInput').click());

        const newFolderBtn = document.createElement('button');
        newFolderBtn.className = 'toolbar-btn';
        newFolderBtn.innerHTML = this.getIcon('folder-plus') + '<span>创建新文件夹</span>';
        newFolderBtn.addEventListener('click', () => this.showNewFolderModal());

        actionButtons.appendChild(uploadBtn);
        actionButtons.appendChild(newFolderBtn);
        toolbar.appendChild(actionButtons);

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.className = 'hidden-input';
        hiddenInput.id = 'fileInput';
        hiddenInput.addEventListener('change', (e) => this.handleFileUpload(e));
        toolbar.appendChild(hiddenInput);

        return toolbar;
    },

    createAddressBar() {
        const addressBar = document.createElement('div');
        addressBar.className = 'address-bar';

        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';

        const backBtn = document.createElement('button');
        backBtn.className = 'nav-btn';
        backBtn.innerHTML = this.getIcon('arrow-left');
        backBtn.title = '返回';
        backBtn.disabled = !this.canGoBack();
        backBtn.addEventListener('click', () => this.goBack());

        const forwardBtn = document.createElement('button');
        forwardBtn.className = 'nav-btn';
        forwardBtn.innerHTML = this.getIcon('arrow-right');
        forwardBtn.title = '前进';
        forwardBtn.disabled = !this.canGoForward();
        forwardBtn.addEventListener('click', () => this.goForward());

        const upBtn = document.createElement('button');
        upBtn.className = 'nav-btn';
        upBtn.innerHTML = this.getIcon('arrow-up');
        upBtn.title = '向上';
        upBtn.disabled = !this.canGoUp();
        upBtn.addEventListener('click', () => this.goUp());

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'nav-btn';
        refreshBtn.innerHTML = this.getIcon('refresh');
        refreshBtn.title = '刷新';
        refreshBtn.addEventListener('click', () => this.loadFiles(this.currentFolderPath));

        navButtons.appendChild(backBtn);
        navButtons.appendChild(forwardBtn);
        navButtons.appendChild(upBtn);
        navButtons.appendChild(refreshBtn);

        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'breadcrumbs';
        breadcrumbs.innerHTML = this.renderBreadcrumbs();

        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        searchBox.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="在此处搜索..." class="search-input">
        `;

        const searchInput = searchBox.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        addressBar.appendChild(navButtons);
        addressBar.appendChild(breadcrumbs);
        addressBar.appendChild(searchBox);

        return addressBar;
    },

    getIcon(name) {
        const icons = {
            'folder': '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M6.72 4.15c.45 0 .67 0 .81.11.05.04.1.08.14.13.11.16.11.39.11.84v.92c0 .75 0 1.13-.2.14-.06.08-.13.16-.21.22-.26.19-.64.2-1.39-.01H4c-.75 0-1.13-.01-1.39-.2-.08-.06-.15-.13-.21-.22-.2-.38-.19-.74-.19-1.49V5.23c0-.45 0-.68.11-.84.04-.05.09-.09.14-.13.14-.11.36-.11.81-.11h3.44zm-2.32.8c-.33 0-.6.27-.6.6s.27.6.6.6h1.2c.33 0 .6-.27.6-.6s-.27-.6-.6-.6h-1.2zm3.52-2.1c.33 0 .6.27.6.6s-.27.6-.6.6H2.4c-.33 0-.6-.27-.6-.6s.27-.6.6-.6h5.52z"></path></svg>',
            'settings': '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M5.56 2.57C6.1 1.96 7.09 2.53 6.83 3.3c-.14.43.12.88.56.97.79.16.79 1.3 0 1.46-.44.09-.7.55-.56.98.26.77-.73 1.34-1.27.73-.29-.34-.82-.34-1.11 0-.54.61-1.53.04-1.27-.73.14-.43-.12-.88-.56-.97-.79-.16-.79-1.3 0-1.46.44-.09.7-.55.56-.98C2.91 2.53 3.9 1.96 4.44 2.57c.29.34.82.34 1.12 0zM5.6 3.96c-.57-.33-1.3-.13-1.63.54-.33.57-.13 1.3.54 1.64.57.33 1.3.13 1.63-.54.33-.57.13-1.3-.54-1.64z"></path></svg>',
            'upload': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
            'folder-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>',
            'download': '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M7.3 6.95c.39 0 .7 0 .7.39s-.31.7-.7.7H2.7c-.39 0-.7-.31-.7-.7s.31-.39.7-.39h4.6zm-2.1-5.3c.33 0 .6.27.6.6v.12c0 .32 0 .48.08.59.01.02.02.03.04.05.1.09.28.11.64.14.19.02.31.04.39.12.11.1.18.25.19.41.01.24-.23.52-.71 1.08l-.57.65c-.38.44-.57.66-.81.68-.03.01-.07.01-.11.01s-.08 0-.11-.01c-.24-.02-.43-.24-.81-.68l-.57-.65c-.48-.56-.72-.84-.71-1.08.01-.16.08-.31.19-.41.08-.08.2-.1.39-.12.36-.03.54-.05.64-.14.02-.02.03-.03.04-.05.08-.11.08-.27.08-.59V2.25c0-.33.27-.6.6-.6h.4z"></path></svg>',
            'edit': '<svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M841.5 230.2c-20.1 0-36.4 16.3-36.4 36.4s16.3 36.4 36.4 36.4c33.4 0 60.6 27.2 60.6 60.6v270.9c0 33.4-27.2 60.6-60.6 60.6-20.1 0-36.4 16.3-36.4 36.4s16.3 36.4 36.4 36.4c73.6 0 133.4-59.8 133.4-133.4V363.6c0-73.6-59.8-133.4-133.4-133.4zM594.9 731.5c0-20.1-16.3-36.4-36.4-36.4H182.5c-33.4 0-60.6-27.2-60.6-60.6V363.6c0-33.4 27.2-60.6 60.6-60.6h378c20.1 0 36.4-16.3 36.4-36.4s-16.3-36.4-36.4-36.4H182.5c-73.6 0-133.4 59.9-133.4 133.4v270.9c0 73.5 59.8 133.4 133.4 133.4h376c20.1 0 36.4-16.3 36.4-36.4zM851.6 936.5H742.7V91.5h133.1c20.1 0 36.4-16.3 36.4-36.4s-16.3-36.4-36.4-36.4H560.5c-20.1 0-36.4 16.3-36.4 36.4s16.3 36.4 36.4 36.4h109.4v845H536.3c-20.1 0-36.4 16.3-36.4 36.4s16.3 36.4 36.4 36.4h315.3c20.1 0 36.4-16.3 36.4-36.4s-16.3-36.4-36.4-36.4z"></path></svg>',
            'info': '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M5.14 4.06c.32.07.56.35.56.69v1.88c0 .12.07.22.16.3.15.13.24.32.24.54 0 .39-.31.7-.7.7H4.6c-.39 0-.7-.31-.7-.7 0-.22.09-.41.24-.54.08-.08.16-.18.16-.3v-1.06c0-.12-.07-.22-.16-.3-.15-.13-.24-.32-.24-.54 0-.39.31-.7.7-.7h.5c.05 0 .09.01.14.02zM4.9 1.85c.44 0 .8.36.8.8s-.36.8-.8.8-.8-.36-.8-.8.36-.8.8-.8z"></path></svg>',
            'trash': '<svg viewBox="0 0 10 10" fill="currentColor"><path d="M5.5 2.05c.26 0 .48.17.57.4.04.1.13.2.24.2h.9c.33 0 .6.27.6.6s-.27.6-.6.6c-.1.03-.19.11-.19.22l-.11 2.1c-.04.81-.06 1.21-.3 1.48-.03.04-.07.08-.12.11-.28.23-.68.23-1.5.23h-.6c-.8 0-1.2-.01-1.48-.23-.04-.03-.08-.07-.12-.11-.24-.27-.26-.67-.3-1.48l-.11-2.1c0-.11-.09-.19-.19-.22-.23-.08-.4-.31-.4-.57s.17-.5.4-.5h.9c.11 0 .2.09.24.2.09-.23.31-.4.57-.4zm-1.39 2.1c-.25.01-.44.22-.44.47l.04 1.9c.01.25.2.45.45.44.25-.01.44-.22.44-.47l-.04-1.9c0-.25-.2-.45-.45-.44zm1.77 0c-.25-.01-.46.17-.46.43l.04 1.89c0 .25.2.45.45.46.25.01.44-.17.44-.42l-.04-1.9c0-.25-.19-.45-.43-.46z"></path></svg>',
            'arrow-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>',
            'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><polyline points="12 5 19 12 12 19"></polyline></svg>',
            'arrow-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"></path><polyline points="5 12 12 5 19 12"></polyline></svg>',
            'refresh': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>'
        };
        return icons[name] || '';
    },

    renderBreadcrumbs() {
        const filesRoot = 'D:\\Web_yun\\files';
        let path = this.currentFolderPath || filesRoot;
        let relativePath = path.replace(filesRoot, '').replace(/\\/g, '/');
        
        if (!relativePath || relativePath === '/') {
            return '<span class="breadcrumb-item active">根目录</span>';
        }
        
        if (!relativePath.startsWith('/')) {
            relativePath = '/' + relativePath;
        }
        
        const parts = relativePath.split('/').filter(p => p);
        let currentPath = filesRoot;
        let html = '<span class="breadcrumb-item" data-path="">根目录</span>';
        
        parts.forEach((part, index) => {
            currentPath += '\\' + part;
            const isLast = index === parts.length - 1;
            html += `<span class="breadcrumb-separator">/</span>`;
            html += `<span class="breadcrumb-item ${isLast ? 'active' : ''}" data-path="${currentPath}">${part}</span>`;
        });
        
        return html;
    },

    handleSearch(keyword) {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            if (keyword.trim() === '' || name.includes(keyword.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },

    historyStack: [],
    historyIndex: -1,

    addToHistory(path) {
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
        }
        this.historyStack.push(path);
        this.historyIndex = this.historyStack.length - 1;
    },

    canGoBack() {
        return this.historyIndex > 0;
    },

    canGoForward() {
        return this.historyIndex < this.historyStack.length - 1;
    },

    canGoUp() {
        const filesRoot = 'D:\\Web_yun\\files';
        return this.currentFolderPath && this.currentFolderPath !== filesRoot;
    },

    goBack() {
        if (this.canGoBack()) {
            this.historyIndex--;
            const path = this.historyStack[this.historyIndex];
            this.navigate('files', path);
        }
    },

    goForward() {
        if (this.canGoForward()) {
            this.historyIndex++;
            const path = this.historyStack[this.historyIndex];
            this.navigate('files', path);
        }
    },

    goUp() {
        if (this.canGoUp()) {
            const parentPath = this.currentFolderPath.substring(0, this.currentFolderPath.lastIndexOf('\\'));
            this.navigate('files', parentPath);
        }
    },

    setupBreadcrumbEvents() {
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
        breadcrumbItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const path = e.target.dataset.path;
                if (path !== undefined) {
                    this.navigate('files', path === '' ? null : path);
                }
            });
        });
    },

    async loadFiles(folderPath = null) {
        this.currentFolderPath = folderPath;

        if (!this.fileGridEl) return;

        this.fileGridEl.innerHTML = '<div class="loading"></div>';

        try {
            let url = '/api/files/list';
            if (folderPath) {
                const filesRoot = 'D:\\Web_yun\\files';
                let relativePath = folderPath.replace(filesRoot, '').replace(/\\/g, '/');
                if (!relativePath.startsWith('/')) {
                    relativePath = '/' + relativePath;
                }
                url = `/api/files/list?folder=${encodeURIComponent(relativePath)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                this.renderFileList(data.folders, data.files);
                this.setupContextMenu();
                this.setupBreadcrumbEvents();
            } else {
                this.fileGridEl.innerHTML = '<div class="empty-state"><p>没有文件</p></div>';
            }
        } catch (error) {
            this.fileGridEl.innerHTML = '<div class="empty-state"><p>网络错误</p></div>';
        }
    },

    renderFileList(folders, files) {
        const fileGrid = this.fileGridEl;
        fileGrid.innerHTML = '';

        if (folders.length === 0 && files.length === 0) {
            fileGrid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>没有文件</p>
                </div>
            `;
            return;
        }

        folders.forEach(folder => {
            const item = this.createFileItem(folder.name, folder.path, true);
            fileGrid.appendChild(item);
        });

        files.forEach(file => {
            const item = this.createFileItem(file.name, file.path, false, file.size);
            fileGrid.appendChild(item);
        });
    },

    createFileItem(name, path, isDirectory, size) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.dataset.name = name;
        item.dataset.path = path;
        item.dataset.isDirectory = isDirectory;

        const icon = isDirectory ? this.getFolderIcon() : this.getFileIcon(name);

        item.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-name" title="${name}">${name}</div>
        `;

        item.addEventListener('dblclick', () => {
            if (isDirectory) {
                this.navigate('files', path);
            }
        });

        return item;
    },

    getFolderIcon() {
        return '<svg viewBox="0 0 24 24" fill="#F5A623" stroke="#E89B00" stroke-width="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
    },

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const colors = {
            'jpg': '#E74C3C', 'jpeg': '#E74C3C', 'png': '#E74C3C', 'gif': '#E74C3C', 'bmp': '#E74C3C',
            'pdf': '#E74C3C',
            'doc': '#3498DB', 'docx': '#3498DB',
            'xls': '#27AE60', 'xlsx': '#27AE60',
            'ppt': '#E67E22', 'pptx': '#E67E22',
            'zip': '#9B59B6', 'rar': '#9B59B6', '7z': '#9B59B6',
            'txt': '#95A5A6'
        };
        const color = colors[ext] || '#95A5A6';

        return `<svg viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    },

    setupContextMenu() {
        document.onclick = () => {
            const menu = document.getElementById('contextMenu');
            if (menu) menu.classList.remove('show');
        };

        document.oncontextmenu = (e) => {
            if (this.currentPage !== 'files') {
                e.preventDefault();
                return false;
            }
            
            const contentArea = document.querySelector('.content-area');
            if (!contentArea || !contentArea.contains(e.target)) {
                e.preventDefault();
                return false;
            }
        };

        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.oncontextmenu = (e) => {
                if (this.currentPage !== 'files') {
                    e.preventDefault();
                    return;
                }
                
                e.preventDefault();
                const fileItem = e.target.closest('.file-item');
                if (fileItem) {
                    this.selectedItem = {
                        name: fileItem.dataset.name,
                        path: fileItem.dataset.path,
                        isDirectory: fileItem.dataset.isDirectory === 'true'
                    };
                    this.showContextMenu(e.clientX, e.clientY);
                } else {
                    this.selectedItem = null;
                    this.showEmptyContextMenu(e.clientX, e.clientY);
                }
            };
        }
    },

    showContextMenu(x, y) {
        let menu = document.getElementById('contextMenu');

        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'contextMenu';
            menu.className = 'context-menu';
            document.body.appendChild(menu);
        }

        menu.innerHTML = `
            <div class="context-menu-item" data-action="download">
                ${this.getIcon('download')}
                <span>下载</span>
            </div>
            <div class="context-menu-item" data-action="rename">
                ${this.getIcon('edit')}
                <span>重命名</span>
            </div>
            <div class="context-menu-item" data-action="info">
                ${this.getIcon('info')}
                <span>详细信息</span>
            </div>
            <div class="context-menu-item danger" data-action="delete">
                ${this.getIcon('trash')}
                <span>删除</span>
            </div>
        `;

        menu.querySelector('[data-action="download"]').style.display = this.selectedItem.isDirectory ? 'none' : 'flex';

        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.handleContextAction(item.dataset.action);
            };
        });

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');
    },

    showEmptyContextMenu(x, y) {
        let menu = document.getElementById('contextMenu');

        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'contextMenu';
            menu.className = 'context-menu';
            document.body.appendChild(menu);
        }

        menu.innerHTML = `
            <div class="context-menu-item" data-action="upload">
                ${this.getIcon('upload')}
                <span>上传文件</span>
            </div>
            <div class="context-menu-item" data-action="newfolder">
                ${this.getIcon('folder-plus')}
                <span>新建文件夹</span>
            </div>
            <div class="context-menu-item" data-action="folderinfo">
                ${this.getIcon('info')}
                <span>详细信息</span>
            </div>
        `;

        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.handleEmptyContextAction(item.dataset.action);
            };
        });

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.add('show');
    },

    async handleContextAction(action) {
        document.getElementById('contextMenu').classList.remove('show');

        if (!this.selectedItem) return;

        switch (action) {
            case 'download':
                this.downloadFile(this.selectedItem.path);
                break;
            case 'rename':
                this.showRenameModal();
                break;
            case 'info':
                this.showFileInfo(this.selectedItem.path);
                break;
            case 'delete':
                this.deleteItem(this.selectedItem.path);
                break;
        }
    },

    handleEmptyContextAction(action) {
        document.getElementById('contextMenu').classList.remove('show');

        switch (action) {
            case 'upload':
                document.getElementById('fileInput').click();
                break;
            case 'newfolder':
                this.showNewFolderModal();
                break;
            case 'folderinfo':
                this.showFolderInfo();
                break;
        }
    },

    downloadFile(path) {
        const a = document.createElement('a');
        a.href = `/api/files/download?path=${encodeURIComponent(path)}`;
        a.download = this.selectedItem.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    showNewFolderModal() {
        const modal = this.createModal('新建文件夹', `
            <input type="text" class="modal-input" id="folderNameInput" placeholder="请输入文件夹名称" value="新建文件夹">
        `, [
            { text: '取消', class: 'btn-column5', action: 'cancel' },
            { text: '确定', class: 'btn-column2', action: 'confirm' }
        ]);

        modal.querySelector('[data-action="confirm"]').onclick = () => this.createNewFolder();
        modal.querySelector('[data-action="cancel"]').onclick = () => this.closeModal();

        document.body.appendChild(modal);
        setTimeout(() => {
            document.getElementById('folderNameInput').focus();
            document.getElementById('folderNameInput').select();
        }, 0);
    },

    async createNewFolder() {
        const name = document.getElementById('folderNameInput').value.trim();

        if (!name) {
            this.showMessage('提示', '请输入文件夹名称');
            return;
        }

        try {
            const response = await fetch('/api/files/newfolder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parent: this.currentFolderPath })
            });
            const data = await response.json();

            if (data.success) {
                this.closeModal();
                await this.loadFiles(this.currentFolderPath);
            } else {
                this.showMessage('错误', data.message || '新建文件夹失败');
            }
        } catch (error) {
            this.showMessage('错误', '新建文件夹失败');
        }
    },

    showRenameModal() {
        const modal = this.createModal('重命名', `
            <input type="text" class="modal-input" id="newNameInput" placeholder="请输入新名称" value="${this.selectedItem.name}">
        `, [
            { text: '取消', class: 'btn-column5', action: 'cancel' },
            { text: '确定', class: 'btn-column2', action: 'confirm' }
        ]);

        modal.querySelector('[data-action="confirm"]').onclick = () => this.confirmRename();
        modal.querySelector('[data-action="cancel"]').onclick = () => this.closeModal();

        document.body.appendChild(modal);
        setTimeout(() => {
            document.getElementById('newNameInput').focus();
            document.getElementById('newNameInput').select();
        }, 0);
    },

    async confirmRename() {
        const newName = document.getElementById('newNameInput').value.trim();

        if (!newName) {
            this.showMessage('提示', '请输入新名称');
            return;
        }

        try {
            const response = await fetch('/api/files/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPath: this.selectedItem.path, newName })
            });
            const data = await response.json();

            if (data.success) {
                this.closeModal();
                await this.loadFiles(this.currentFolderPath);
            } else {
                this.showMessage('错误', data.message || '重命名失败');
            }
        } catch (error) {
            this.showMessage('错误', '重命名失败');
        }
    },

    async showFileInfo(path) {
        try {
            const response = await fetch(`/api/files/info?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.success) {
                const info = data.info;

                const nameParts = info.name.split('.');
                const extension = nameParts.length > 1 ? nameParts.pop() : '';
                const baseName = nameParts.join('.');

                let fileType = info.isDirectory ? '文件夹' : '文件';
                let fileTypeDetail = '';
                if (!info.isDirectory && extension) {
                    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
                    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
                    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
                    const docExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt'];

                    if (imageExtensions.includes(extension.toLowerCase())) {
                        fileType = '图片';
                    } else if (videoExtensions.includes(extension.toLowerCase())) {
                        fileType = '视频';
                    } else if (audioExtensions.includes(extension.toLowerCase())) {
                        fileType = '音频';
                    } else if (docExtensions.includes(extension.toLowerCase())) {
                        fileType = '文档';
                    }
                    fileTypeDetail = ` (.${extension})`;
                }

                const filesRoot = 'D:\\Web_yun\\files';
                let location = info.path.replace(filesRoot, '').replace(/\\/g, '/');
                if (!location || location === '/') {
                    location = '根目录';
                } else {
                    if (!location.startsWith('/')) location = '/' + location;
                    location = '根目录' + location;
                }

                const blockSize = 512;
                const blocks = Math.ceil(info.size / blockSize);
                const allocatedSize = blocks * blockSize;

                const formatSizeWithBytes = (size) => {
                    return `${this.formatFileSize(size)} (${size.toLocaleString()} 字节)`;
                };

                const formatDateTime = (dateStr) => {
                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}年${month}月${day}日，${hours}:${minutes}:${seconds}`;
                };

                const modal = this.createModal('文件信息', `
                    <div class="file-detail">
                        <div class="detail-item">
                            <span class="detail-label">文件名</span>
                            <span class="detail-value">${info.isDirectory ? info.name : baseName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">文件类型</span>
                            <span class="detail-value">${fileType}${fileTypeDetail}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">位置</span>
                            <span class="detail-value">${location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">大小</span>
                            <span class="detail-value">${info.isDirectory ? '-' : formatSizeWithBytes(info.size)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">占用空间</span>
                            <span class="detail-value">${info.isDirectory ? '-' : formatSizeWithBytes(allocatedSize)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">创建时间</span>
                            <span class="detail-value">${formatDateTime(info.created)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">修改时间</span>
                            <span class="detail-value">${formatDateTime(info.modified)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">访问时间</span>
                            <span class="detail-value">${formatDateTime(info.accessed)}</span>
                        </div>
                    </div>
                `, [
                    { text: '关闭', class: 'btn-column5', action: 'close' }
                ]);

                modal.querySelector('[data-action="close"]').onclick = () => this.closeModal();
                document.body.appendChild(modal);
            } else {
                this.showMessage('错误', data.message || '获取文件信息失败');
            }
        } catch (error) {
            this.showMessage('错误', '获取文件信息失败');
        }
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    showMessage(title, message) {
        this.showToast(message, title === '错误' ? 'error' : 'info');
    },

    async showFolderInfo() {
        const filesRoot = 'D:\\Web_yun\\files';
        if (!this.currentFolderPath || this.currentFolderPath === filesRoot) {
            this.showMessage('提示', '根目录不支持查看详细信息');
            return;
        }

        try {
            const response = await fetch(`/api/files/info?path=${encodeURIComponent(this.currentFolderPath || '')}`);
            const data = await response.json();

            if (data.success) {
                const info = data.info;

                const filesRoot = 'D:\\Web_yun\\files';
                let location = info.path.replace(filesRoot, '').replace(/\\/g, '/');
                if (!location || location === '/') {
                    location = '根目录';
                } else {
                    if (!location.startsWith('/')) location = '/' + location;
                    location = '根目录' + location;
                }

                const formatDateTime = (dateStr) => {
                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}年${month}月${day}日，${hours}:${minutes}:${seconds}`;
                };

                const modal = this.createModal('文件夹信息', `
                    <div class="file-detail">
                        <div class="detail-item">
                            <span class="detail-label">文件夹名称</span>
                            <span class="detail-value">${info.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">位置</span>
                            <span class="detail-value">${location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">创建时间</span>
                            <span class="detail-value">${formatDateTime(info.created)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">修改时间</span>
                            <span class="detail-value">${formatDateTime(info.modified)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">访问时间</span>
                            <span class="detail-value">${formatDateTime(info.accessed)}</span>
                        </div>
                    </div>
                `, [
                    { text: '关闭', class: 'btn-column5', action: 'close' }
                ]);

                modal.querySelector('[data-action="close"]').onclick = () => this.closeModal();
                document.body.appendChild(modal);
            } else {
                this.showMessage('错误', data.message || '获取文件夹信息失败');
            }
        } catch (error) {
            this.showMessage('错误', '获取文件夹信息失败');
        }
    },

    async deleteItem(path) {
        const confirmMsg = this.selectedItem.isDirectory
            ? `确认删除文件夹 "<strong>${this.selectedItem.name}</strong>" 吗？`
            : `确认删除文件 "<strong>${this.selectedItem.name}</strong>" 吗？`;

        const modal = this.createModal('确认删除', `
            <p style="color: #E74C3C; margin-bottom: 10px;">${confirmMsg}</p>
            <p style="font-size: 14px; color: #666;">此操作无法撤销。</p>
        `, [
            { text: '取消', class: 'btn-column5', action: 'cancel' },
            { text: '删除', class: 'btn-column4', action: 'confirm' }
        ]);

        modal.querySelector('[data-action="confirm"]').onclick = async () => {
            try {
                const response = await fetch('/api/files/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path })
                });
                const data = await response.json();

                if (data.success) {
                    await this.loadFiles(this.currentFolderPath);
                    this.closeModal();
                } else {
                    this.showMessage('错误', data.message || '删除失败');
                }
            } catch (error) {
                this.showMessage('错误', '网络错误');
            }
        };
        modal.querySelector('[data-action="cancel"]').onclick = () => this.closeModal();

        document.body.appendChild(modal);
    },

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (this.currentFolderPath) {
            formData.append('folder', this.currentFolderPath);
        }

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                await this.loadFiles(this.currentFolderPath);
            } else {
                this.showMessage('错误', data.message || '上传文件失败');
            }
        } catch (error) {
            this.showMessage('错误', '上传文件失败');
        }

        e.target.value = '';
    },

    createModal(title, content, buttons) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'modal';

        const titleEl = document.createElement('h3');
        titleEl.className = 'modal-title';
        titleEl.textContent = title;

        const contentEl = document.createElement('div');
        contentEl.innerHTML = content;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'modal-buttons';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.class}`;
            button.textContent = btn.text;
            button.dataset.action = btn.action;
            btnContainer.appendChild(button);
        });

        modal.appendChild(titleEl);
        modal.appendChild(contentEl);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);

        // 先添加到DOM
        document.body.appendChild(overlay);

        // 强制浏览器重排，确保过渡效果生效
        // 先触发一次重排，然后在下次动画帧添加active类
        overlay.offsetHeight;
        requestAnimationFrame(() => {
            setTimeout(() => {
                overlay.classList.add('active');
            }, 10);
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        // 阻止弹窗内部点击冒泡
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape' || e.key === 'ESC') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 禁止背景滚动
        document.body.style.overflow = 'hidden';

        return overlay;
    },

    showAvatarPickerModal(avatarDisplay) {
        const colors = [
            '#FF7BAC', '#4A90E2', '#50C878', '#E74C3C',
            '#9B59B6', '#F39C12', '#1ABC9C', '#34495E',
            '#E91E63', '#00BCD4', '#8BC34A', '#FF5722'
        ];

        const colorGrid = colors.map(color =>
            `<div class="avatar-color-option" data-color="${color}" style="width: 50px; height: 50px; border-radius: 50%; background: ${color}; cursor: pointer; transition: transform 0.2s;"></div>`
        ).join('');

        const content = `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">上传自定义头像：</p>
                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                <label for="avatar-upload" class="btn btn-column2" style="cursor: pointer; display: inline-block;">
                    选择图片
                </label>
            </div>
            <div style="margin-top: 20px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">或选择头像颜色：</p>
                <div style="display: grid; grid-template-columns: repeat(4, 50px); gap: 15px; justify-content: center;">
                    ${colorGrid}
                </div>
            </div>
        `;

        const modal = this.createModal('修改头像', content, [
            { text: '取消', class: 'btn-column5', action: 'cancel' }
        ]);

        document.body.appendChild(modal);

        // 添加颜色选择事件
        setTimeout(() => {
            const colorOptions = document.querySelectorAll('.avatar-color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const color = option.dataset.color;
                    localStorage.setItem('avatarColor', color);
                    localStorage.removeItem('avatarImage');
                    avatarDisplay.style.background = color;
                    avatarDisplay.style.backgroundImage = '';
                    avatarDisplay.textContent = this.username ? this.username.charAt(0) : '';
                    // 同时更新顶部栏的头像
                    const topbarAvatar = document.querySelector('.topbar .user-avatar');
                    if (topbarAvatar) {
                        topbarAvatar.style.background = color;
                        topbarAvatar.style.backgroundImage = '';
                        topbarAvatar.textContent = this.username ? this.username.charAt(0) : '';
                    }
                    this.closeModal();
                });
            });

            // 添加图片上传事件
            const uploadInput = document.getElementById('avatar-upload');
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageData = event.target.result;
                        localStorage.setItem('avatarImage', imageData);
                        localStorage.removeItem('avatarColor');
                        avatarDisplay.style.background = 'transparent';
                        avatarDisplay.style.backgroundImage = 'url(' + imageData + ')';
                        avatarDisplay.style.backgroundSize = 'cover';
                        avatarDisplay.style.backgroundPosition = 'center';
                        avatarDisplay.textContent = '';
                        // 同时更新顶部栏的头像
                        const topbarAvatar = document.querySelector('.topbar .user-avatar');
                        if (topbarAvatar) {
                            topbarAvatar.style.background = 'transparent';
                            topbarAvatar.style.backgroundImage = 'url(' + imageData + ')';
                            topbarAvatar.style.backgroundSize = 'cover';
                            topbarAvatar.style.backgroundPosition = 'center';
                            topbarAvatar.textContent = '';
                        }
                        this.closeModal();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }, 100);
    },

    closeModal() {
        const overlay = document.querySelector('.modal-overlay.active');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
        document.body.style.overflow = '';
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    },

    renderSettings(container) {
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';

        const sidebar = this.createSidebar('settings');
        const mainContent = document.createElement('main');
        mainContent.className = 'main-content';

        const topbar = this.createTopbar();
        const contentArea = document.createElement('div');
        contentArea.className = 'content-area';

        // 用户信息section - 带头像
        const section1 = document.createElement('div');
        section1.className = 'settings-section';

        const title1 = document.createElement('h3');
        title1.className = 'settings-title';
        title1.textContent = '用户信息';

        // 头像显示
        const avatarContainer = document.createElement('div');
        avatarContainer.style.cssText = 'display: flex; align-items: center; gap: 20px; margin: 20px 0;';

        const avatarDisplay = document.createElement('div');
        avatarDisplay.className = 'user-avatar';
        avatarDisplay.style.cssText = 'width: 64px; height: 64px; font-size: 28px;';

        // 先检查是否有保存的头像图片
        const savedAvatarImage = localStorage.getItem('avatarImage');
        if (savedAvatarImage) {
            avatarDisplay.style.background = 'transparent';
            avatarDisplay.style.backgroundImage = 'url(' + savedAvatarImage + ')';
            avatarDisplay.style.backgroundSize = 'cover';
            avatarDisplay.style.backgroundPosition = 'center';
            avatarDisplay.textContent = '';
        } else {
            // 再检查是否有保存的头像颜色
            const savedAvatarColor = localStorage.getItem('avatarColor');
            if (savedAvatarColor) {
                avatarDisplay.style.background = savedAvatarColor;
            }
            avatarDisplay.textContent = this.username ? this.username.charAt(0) : '';
        }

        const usernameDisplay = document.createElement('div');
        usernameDisplay.style.cssText = 'flex: 1;';
        const usernameLabel = document.createElement('div');
        usernameLabel.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 5px;';
        usernameLabel.textContent = '用户名';
        const usernameValue = document.createElement('div');
        usernameValue.style.cssText = 'font-size: 18px; font-weight: 500; color: #333;';
        usernameValue.textContent = this.username;
        usernameDisplay.appendChild(usernameLabel);
        usernameDisplay.appendChild(usernameValue);

        avatarContainer.appendChild(avatarDisplay);
        avatarContainer.appendChild(usernameDisplay);

        // 修改头像按钮
        const changeAvatarBtn = document.createElement('button');
        changeAvatarBtn.className = 'btn btn-column2';
        changeAvatarBtn.textContent = '修改头像';
        changeAvatarBtn.style.cssText = 'margin-left: auto;';
        changeAvatarBtn.onclick = () => this.showAvatarPickerModal(avatarDisplay);

        section1.appendChild(title1);
        section1.appendChild(avatarContainer);
        section1.appendChild(changeAvatarBtn);

        const section2 = this.createSettingsSection('版本信息', [
            { label: '版本号', value: '1.0.0' },
            { label: '文件存储路径', value: './files' }
        ]);

        // 深色模式设置
        const darkModeSection = document.createElement('div');
        darkModeSection.className = 'settings-section';

        const darkModeTitle = document.createElement('h3');
        darkModeTitle.className = 'settings-title';
        darkModeTitle.textContent = '深色模式';

        const darkModeSwitch = document.createElement('div');
        darkModeSwitch.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 10px;';
        
        const switchLabel = document.createElement('span');
        switchLabel.textContent = '启用深色模式';
        
        const switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.id = 'darkModeToggle';
        switchInput.style.cssText = 'width: 40px; height: 20px; cursor: pointer;';

        darkModeSwitch.appendChild(switchLabel);
        darkModeSwitch.appendChild(switchInput);
        darkModeSection.appendChild(darkModeTitle);
        darkModeSection.appendChild(darkModeSwitch);

        const section3 = document.createElement('div');
        section3.className = 'settings-section';

        const title3 = document.createElement('h3');
        title3.className = 'settings-title';
        title3.textContent = '设置';

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-column4';
        logoutBtn.textContent = '退出登录';
        logoutBtn.style.marginTop = '15px';
        logoutBtn.onclick = () => this.logout();

        section3.appendChild(title3);
        section3.appendChild(logoutBtn);

        contentArea.appendChild(section1);
        contentArea.appendChild(darkModeSection);
        contentArea.appendChild(section2);
        contentArea.appendChild(section3);

        // 加载深色模式设置
        setTimeout(() => {
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                const isDarkMode = localStorage.getItem('darkMode') === 'true';
                darkModeToggle.checked = isDarkMode;
                if (isDarkMode) {
                    document.body.classList.add('dark-mode');
                }

                darkModeToggle.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        document.body.classList.add('dark-mode');
                        localStorage.setItem('darkMode', 'true');
                    } else {
                        document.body.classList.remove('dark-mode');
                        localStorage.setItem('darkMode', 'false');
                    }
                });
            }
        }, 100);
        mainContent.appendChild(topbar);
        mainContent.appendChild(contentArea);
        mainContainer.appendChild(sidebar);
        mainContainer.appendChild(mainContent);
        container.appendChild(mainContainer);
    },

    createSettingsSection(title, items) {
        const section = document.createElement('div');
        section.className = 'settings-section';

        const titleEl = document.createElement('h3');
        titleEl.className = 'settings-title';
        titleEl.textContent = title;

        section.appendChild(titleEl);

        if (items) {
            items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'settings-item';

                const label = document.createElement('span');
                label.className = 'settings-item-label';
                label.textContent = item.label;

                const value = document.createElement('span');
                value.className = 'settings-item-value';
                value.textContent = item.value;

                itemEl.appendChild(label);
                itemEl.appendChild(value);
                section.appendChild(itemEl);
            });
        }

        return section;
    },

    logout() {
        const modal = this.createModal('退出登录', `
            <p style="margin-bottom: 10px;">确定要退出登录吗？</p>
        `, [
            { text: '取消', class: 'btn-column5', action: 'cancel' },
            { text: '退出', class: 'btn-column4', action: 'confirm' }
        ]);

        modal.querySelector('[data-action="confirm"]').onclick = () => {
            localStorage.removeItem('username');
            this.username = null;
            this.currentFolderPath = null;
            localStorage.removeItem('currentFolderPath');
            history.pushState({}, '', '/login');
            this.currentPage = 'login';
            this.closeModal();
            this.render();
        };
        modal.querySelector('[data-action="cancel"]').onclick = () => this.closeModal();

        document.body.appendChild(modal);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
