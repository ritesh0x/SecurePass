// Authentication and Form Manager
class AuthManager {
    constructor() {
        this.bindAuthEvents();
    }

    bindAuthEvents() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Real-time password confirmation validation
        const confirmInput = document.getElementById('register-confirm-password');
        if (confirmInput) {
            confirmInput.addEventListener('input', () => {
                this.validatePasswordConfirmation();
            });
        }

        // Real-time password strength meter
        const registerPasswordInput = document.getElementById('register-password');
        if (registerPasswordInput) {
            registerPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }

        // Toggle password show/hide icons
        document.querySelectorAll('.toggle-password-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');
                if (input) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        if (icon) icon.className = 'fa-regular fa-eye-slash';
                    } else {
                        input.type = 'password';
                        if (icon) icon.className = 'fa-regular fa-eye';
                    }
                }
            });
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            app.showAlert('Please fill in both email and master password', 'error');
            return;
        }

        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Unlocking...';
        submitBtn.disabled = true;

        try {
            const result = await app.apiCall('auth.php', {
                action: 'login',
                email: email,
                password: password
            });

            if (result.success && result.data) {
                const userData = {
                    id: result.data.user_id,
                    username: result.data.username,
                    email: email,
                    master_key: result.data.master_key
                };
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                app.currentUser = userData;
                app.masterKey = result.data.master_key;
                
                document.getElementById('login-form').reset();
                app.showDashboard();
                app.showAlert(`Welcome back, ${userData.username}! Vault unlocked.`, 'success');
            } else {
                app.showAlert(result.message || 'Invalid email or master password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            app.showAlert('An unexpected error occurred during login', 'error');
        } finally {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            app.showAlert('All fields are required', 'error');
            return;
        }

        if (password !== confirmPassword) {
            app.showAlert('Master passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            app.showAlert('Master password must be at least 8 characters', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            app.showAlert('Please enter a valid email address', 'error');
            return;
        }

        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Vault...';
        submitBtn.disabled = true;

        try {
            const result = await app.apiCall('auth.php', {
                action: 'register',
                username: username,
                email: email,
                password: password
            });

            if (result.success) {
                app.showAlert(result.message || 'Vault created! You can now log in.', 'success');
                document.getElementById('register-form').reset();
                this.updatePasswordStrength('');
                app.showPage('login-page');
                
                // Pre-fill email in login form
                const loginEmail = document.getElementById('login-email');
                if (loginEmail) loginEmail.value = email;
            } else {
                app.showAlert(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            app.showAlert('Network error while registering', 'error');
        } finally {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePasswordConfirmation() {
        const password = document.getElementById('register-password').value;
        const confirmInput = document.getElementById('register-confirm-password');
        const confirmPassword = confirmInput.value;

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.style.borderColor = 'var(--danger)';
        } else {
            confirmInput.style.borderColor = 'var(--border-color)';
        }
    }

    updatePasswordStrength(password) {
        const container = document.querySelector('.password-strength-container');
        const strengthText = document.querySelector('.strength-text');
        if (!container || !strengthText) return;

        if (!password) {
            container.className = 'password-strength-container';
            strengthText.textContent = 'None';
            return;
        }

        let score = 0;
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 10;
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 20;
        if (/\d/.test(password)) score += 20;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;

        let label = 'Very Weak';
        let className = 'strength-very-weak';

        if (score >= 80) {
            label = 'Very Strong';
            className = 'strength-very-strong';
        } else if (score >= 60) {
            label = 'Strong';
            className = 'strength-strong';
        } else if (score >= 40) {
            label = 'Medium';
            className = 'strength-medium';
        } else if (score >= 20) {
            label = 'Weak';
            className = 'strength-weak';
        }

        container.className = `password-strength-container ${className}`;
        strengthText.textContent = label;
    }
}

// Initialize Auth
new AuthManager();
