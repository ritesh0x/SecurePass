// Main Application Controller & Toast System
class PasswordManager {
    constructor() {
        this.currentUser = null;
        this.masterKey = null;
        this.passwords = [];
        this.isAdminView = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Navigation events
        const bindClick = (id, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', callback);
        };

        bindClick('login-btn', () => this.showPage('login-page'));
        bindClick('register-btn', () => this.showPage('register-page'));
        bindClick('nav-login-btn', () => this.showPage('login-page'));
        bindClick('nav-register-btn', () => this.showPage('register-page'));
        bindClick('go-to-register', () => this.showPage('register-page'));
        bindClick('go-to-login', () => this.showPage('login-page'));
        bindClick('back-to-landing', () => this.showPage('landing-page'));
        bindClick('back-to-landing-2', () => this.showPage('landing-page'));
        
        // Admin Panel Toggle
        bindClick('admin-panel-toggle-btn', () => this.showAdminView());
        bindClick('back-to-vault-btn', () => this.showVaultView());

        // Brand home click
        document.querySelectorAll('.brand').forEach(el => {
            el.addEventListener('click', () => {
                if (this.currentUser) {
                    this.showDashboard();
                } else {
                    this.showPage('landing-page');
                }
            });
        });

        // Logout
        bindClick('logout-btn', () => this.logout());
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.id && user.master_key) {
                    this.currentUser = user;
                    this.masterKey = user.master_key;
                    this.showDashboard();
                    return;
                }
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                localStorage.removeItem('currentUser');
            }
        }
        this.showPage('landing-page');
    }

    showDashboard() {
        this.showPage('dashboard-page');
        const userEl = document.getElementById('welcome-user');
        const roleBadge = document.getElementById('user-role-badge');
        const adminBtn = document.getElementById('admin-panel-toggle-btn');

        if (userEl && this.currentUser) {
            userEl.textContent = this.currentUser.username || 'User';
        }

        const isAdmin = (this.currentUser && this.currentUser.role === 'admin');
        if (roleBadge) {
            roleBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }
        if (adminBtn) {
            adminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }

        this.showVaultView();
    }

    showVaultView() {
        const vaultSection = document.getElementById('vault-view-section');
        const adminSection = document.getElementById('admin-view-section');
        if (vaultSection) vaultSection.style.display = 'block';
        if (adminSection) adminSection.style.display = 'none';
        this.isAdminView = false;

        if (typeof dashboard !== 'undefined' && dashboard.loadPasswords) {
            dashboard.loadPasswords();
        }
    }

    showAdminView() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showAlert('Unauthorized access', 'error');
            return;
        }

        const vaultSection = document.getElementById('vault-view-section');
        const adminSection = document.getElementById('admin-view-section');
        if (vaultSection) vaultSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'block';
        this.isAdminView = true;

        if (typeof dashboard !== 'undefined' && dashboard.loadAdminUsers) {
            dashboard.loadAdminUsers();
        }
    }

    logout() {
        this.currentUser = null;
        this.masterKey = null;
        this.passwords = [];
        this.isAdminView = false;
        localStorage.removeItem('currentUser');
        this.showAlert('Logged out successfully', 'info');
        this.showPage('landing-page');
    }

    // Modern Toast Notification System
    showAlert(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';
        if (type === 'info') iconClass = 'fa-circle-info';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button type="button" class="toast-close" title="Dismiss">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 250);
        });

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(50px)';
                setTimeout(() => toast.remove(), 250);
            }
        }, 4500);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Unified API Fetch Helper
    async apiCall(endpoint, data) {
        try {
            const response = await fetch(`../backend/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error("Server returned non-JSON: " + text.substring(0, 150));
            }

            return result;
        } catch (error) {
            console.error(`API Call failed on ${endpoint}:`, error);
            return {
                success: false,
                message: error.message || 'Network error occurred'
            };
        }
    }
}

// Global App Instance
const app = new PasswordManager();
