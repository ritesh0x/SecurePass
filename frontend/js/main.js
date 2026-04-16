// Main application controller
class PasswordManager {
    constructor() {
        this.currentUser = null;
        this.masterKey = null;
        this.passwords = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Navigation
        document.getElementById('login-btn').addEventListener('click', () => this.showPage('login-page'));
        document.getElementById('register-btn').addEventListener('click', () => this.showPage('register-page'));
        document.getElementById('go-to-register').addEventListener('click', () => this.showPage('register-page'));
        document.getElementById('go-to-login').addEventListener('click', () => this.showPage('login-page'));
        document.getElementById('back-to-landing').addEventListener('click', () => this.showPage('landing-page'));
        document.getElementById('back-to-landing-2').addEventListener('click', () => this.showPage('landing-page'));
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.currentUser = user;
                this.masterKey = user.master_key;
                this.showDashboard();
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }

    showDashboard() {
        this.showPage('dashboard-page');
        document.getElementById('welcome-user').textContent = `Welcome, ${this.currentUser.username}!`;
        if (typeof dashboard !== 'undefined') {
            dashboard.loadPasswords();
        }
    }

    logout() {
        this.currentUser = null;
        this.masterKey = null;
        this.passwords = [];
        localStorage.removeItem('currentUser');
        this.showPage('landing-page');
    }

    showAlert(message, type = 'success') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            max-width: 400px;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // API call helper
    async apiCall(endpoint, data) {
        console.log(`API Call to ${endpoint}:`, { ...data, password: data.password ? '***' : undefined });
        
        try {
            // *** FIX APPLIED HERE: Added ../ to move up from 'frontend/' to 'securepass/' ***
            const response = await fetch(`../backend/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // Check if the response is actually HTML/Text instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                // Throw the raw response text as an error message for debugging
                throw new Error("Server did not return JSON. Response was: " + text.substring(0, 100) + "...");
            }

            const result = await response.json();
            console.log(`API Response from ${endpoint}:`, result);
            
            return result;
            
        } catch (error) {
            console.error('API call failed:', error);
            return {
                success: false,
                message: 'Network error: ' + error.message
            };
        }
    }
}

// Initialize the application
const app = new PasswordManager();