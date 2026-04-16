// Authentication handling
class AuthManager {
    constructor() {
        this.bindAuthEvents();
    }

    bindAuthEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password confirmation validation
        document.getElementById('register-confirm-password').addEventListener('input', () => {
            this.validatePasswordConfirmation();
        });

        // Password strength indicator
        document.getElementById('register-password').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            app.showAlert('Please fill in all fields', 'error');
            return;
        }

        const submitBtn = document.querySelector('#login-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
            const result = await app.apiCall('auth.php', {
                action: 'login',
                email: email,
                password: password
            });

            if (result.success) {
                // Store user data
                const userData = {
                    id: result.data.user_id,
                    username: result.data.username,
                    email: email,
                    master_key: result.data.master_key
                };
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                app.currentUser = userData;
                app.masterKey = result.data.master_key;
                app.showDashboard();
                app.showAlert('Login successful!');
            } else {
                app.showAlert(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            app.showAlert('An error occurred during login', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        console.log('Registration attempt:', { username, email });

        if (!username || !email || !password || !confirmPassword) {
            app.showAlert('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            app.showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            app.showAlert('Password must be at least 8 characters long', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            app.showAlert('Please enter a valid email address', 'error');
            return;
        }

        const submitBtn = document.querySelector('#register-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            const result = await app.apiCall('auth.php', {
                action: 'register',
                username: username,
                email: email,
                password: password
            });

            console.log('Registration result:', result);

            if (result.success) {
                app.showAlert(result.message || 'Registration successful! Please login.');
                app.showPage('login-page');
                document.getElementById('register-form').reset();
            } else {
                app.showAlert(result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            app.showAlert('Network error. Please check your connection.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePasswordConfirmation() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const confirmInput = document.getElementById('register-confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.style.borderColor = 'var(--danger)';
        } else {
            confirmInput.style.borderColor = 'var(--gray-light)';
        }
    }

    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        if (!strengthBar) return;

        let strength = 0;
        let text = 'Very Weak';
        let className = 'strength-very-weak';

        // Length check
        if (password.length >= 8) strength += 25;
        // Lowercase and uppercase
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        // Numbers
        if (/\d/.test(password)) strength += 25;
        // Special characters
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        if (strength >= 75) {
            text = 'Very Strong';
            className = 'strength-very-strong';
        } else if (strength >= 50) {
            text = 'Strong';
            className = 'strength-strong';
        } else if (strength >= 25) {
            text = 'Medium';
            className = 'strength-medium';
        } else {
            text = 'Weak';
            className = 'strength-weak';
        }

        strengthBar.className = `strength-bar ${className}`;
        strengthText.textContent = text;
    }
}

// Initialize auth manager
new AuthManager();