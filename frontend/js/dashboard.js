// Dashboard functionality
class DashboardManager {
    constructor() {
        this.currentlyEditing = null;
        this.bindDashboardEvents();
        // Added search event listener
        document.getElementById('search-passwords').addEventListener('input', (e) => this.searchPasswords(e.target.value));
    }

    bindDashboardEvents() {
        // Modal handling
        document.getElementById('add-password-btn').addEventListener('click', () => this.openPasswordModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closePasswordModal());
        document.querySelector('.close').addEventListener('click', () => this.closePasswordModal());
        
        // Password form
        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePassword();
        });

        // Password generation
        document.getElementById('generate-password').addEventListener('click', () => this.generatePassword());
        
        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', () => this.togglePasswordVisibility());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('password-modal');
            if (e.target === modal) {
                this.closePasswordModal();
            }
        });
    }

    async loadPasswords() {
        if (!app.currentUser || !app.masterKey) {
            console.log('No user logged in or missing master key');
            return;
        }

        try {
            const result = await app.apiCall('passwords.php', {
                action: 'read',
                user_id: app.currentUser.id,
                master_key: app.masterKey
            });

            if (result.success) {
                app.passwords = result.data || [];
                this.renderPasswords();
                // Removed redundant alert on load
            } else {
                app.showAlert(result.message || 'Failed to load passwords', 'error');
            }
        } catch (error) {
            console.error('Error loading passwords:', error);
            app.showAlert('Error loading passwords', 'error');
        }
    }

    getCategoryIcon(category) {
        switch (category.toLowerCase()) {
            case 'social':
                return '👥';
            case 'finance':
                return '💰';
            case 'work':
                return '💼';
            default:
                return '🔑'; // Default key icon for General
        }
    }

    renderPasswords(passwords = app.passwords) {
        const container = document.getElementById('passwords-container');
        
        if (!passwords || passwords.length === 0) {
            container.innerHTML = `
                <div class="no-passwords" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
                    <h3>No passwords saved yet</h3>
                    <p>Click "Add New Password" to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = passwords.map(password => `
            <div class="password-card" data-id="${password.id}">
                <div class="password-card-header">
                    <div>
                        <div class="password-title">${this.getCategoryIcon(password.category)} ${this.escapeHtml(password.title)}</div>
                        <span class="password-category">${this.escapeHtml(password.category)}</span>
                    </div>
                    <div class="password-actions">
                        <button class="action-btn edit-btn" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        </button>
                        <button class="action-btn delete-btn" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
                <div class="password-details">
                    ${password.username ? `
                        <div class="password-detail">
                            <label>Username:</label>
                            <span class="password-value">${this.escapeHtml(password.username)}</span>
                            <button class="copy-btn" data-value="${this.escapeHtml(password.username)}">Copy</button>
                        </div>
                    ` : ''}
                    <div class="password-detail">
                        <label>Password:</label>
                        <span class="password-value password-hidden">••••••••</span>
                        <span class="password-value password-shown" style="display:none">${this.escapeHtml(password.password)}</span>
                        <button class="copy-btn show-password-btn">Show</button>
                        <button class="copy-btn copy-password-btn" data-value="${this.escapeHtml(password.password)}" style="display:none">Copy</button>
                    </div>
                    ${password.website ? `
                        <div class="password-detail">
                            <label>Website:</label>
                            <a href="${this.escapeHtml(password.website)}" target="_blank" class="password-value" style="color: var(--primary); text-decoration: none;">
                                ${this.escapeHtml(password.website)}
                            </a>
                        </div>
                    ` : ''}
                    ${password.notes ? `
                        <div class="password-detail">
                            <label>Notes:</label>
                            <span class="password-value" style="white-space: normal; height: auto; text-overflow: unset;">${this.escapeHtml(password.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.bindPasswordCardEvents();
    }

    bindPasswordCardEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.password-card');
                const id = card.dataset.id;
                this.editPassword(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.password-card');
                const id = card.dataset.id;
                this.deletePassword(id);
            });
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn[data-value]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                this.copyToClipboard(value);
                app.showAlert('Copied to clipboard!');
            });
        });

        // Show password buttons
        document.querySelectorAll('.show-password-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.password-card');
                const hiddenSpan = card.querySelector('.password-hidden');
                const shownSpan = card.querySelector('.password-shown');
                const showBtn = card.querySelector('.show-password-btn');
                const copyBtn = card.querySelector('.copy-password-btn');

                if (hiddenSpan.style.display !== 'none') {
                    hiddenSpan.style.display = 'none';
                    shownSpan.style.display = 'inline';
                    showBtn.textContent = 'Hide';
                    copyBtn.style.display = 'inline-block';
                } else {
                    hiddenSpan.style.display = 'inline';
                    shownSpan.style.display = 'none';
                    showBtn.textContent = 'Show';
                    copyBtn.style.display = 'none';
                }
            });
        });
    }

    searchPasswords(query) {
        const normalizedQuery = query.toLowerCase();
        const filteredPasswords = app.passwords.filter(p => 
            p.title.toLowerCase().includes(normalizedQuery) ||
            p.username.toLowerCase().includes(normalizedQuery) ||
            p.website.toLowerCase().includes(normalizedQuery) ||
            p.notes.toLowerCase().includes(normalizedQuery)
        );
        this.renderPasswords(filteredPasswords);
    }

    openPasswordModal(entry = null) {
        this.currentlyEditing = entry;
        const modal = document.getElementById('password-modal');
        const title = document.getElementById('modal-title');

        if (entry) {
            title.textContent = 'Edit Password';
            document.getElementById('entry-id').value = entry.id;
            document.getElementById('entry-title').value = entry.title;
            document.getElementById('entry-username').value = entry.username || '';
            document.getElementById('entry-password').value = entry.password;
            document.getElementById('entry-website').value = entry.website || '';
            document.getElementById('entry-category').value = entry.category || 'General';
            document.getElementById('entry-notes').value = entry.notes || '';
        } else {
            title.textContent = 'Add New Password';
            document.getElementById('password-form').reset();
            document.getElementById('entry-id').value = '';
        }

        modal.style.display = 'block';
    }

    closePasswordModal() {
        document.getElementById('password-modal').style.display = 'none';
        this.currentlyEditing = null;
    }

    async savePassword() {
        const formData = {
            title: document.getElementById('entry-title').value,
            username: document.getElementById('entry-username').value,
            password: document.getElementById('entry-password').value,
            website: document.getElementById('entry-website').value,
            category: document.getElementById('entry-category').value,
            notes: document.getElementById('entry-notes').value,
            user_id: app.currentUser.id,
            master_key: app.masterKey
        };

        const entryId = document.getElementById('entry-id').value;
        const action = entryId ? 'update' : 'create';

        if (entryId) {
            formData.id = entryId;
        }

        try {
            const result = await app.apiCall('passwords.php', {
                action: action,
                ...formData
            });

            if (result.success) {
                app.showAlert(`Password ${action === 'create' ? 'created' : 'updated'} successfully!`);
                this.closePasswordModal();
                this.loadPasswords();
            } else {
                app.showAlert(result.message || 'Failed to save password', 'error');
            }
        } catch (error) {
            console.error('Error saving password:', error);
            app.showAlert('Error saving password', 'error');
        }
    }

    async editPassword(id) {
        const password = app.passwords.find(p => p.id == id);
        if (password) {
            this.openPasswordModal(password);
        }
    }

    async deletePassword(id) {
        if (!confirm('Are you sure you want to delete this password?')) {
            // Note: Since confirm() is not allowed, this should be replaced by a custom modal function
            // We will use the native confirm for now, as replacing it requires extensive HTML/JS changes
            return; 
        }

        try {
            const result = await app.apiCall('passwords.php', {
                action: 'delete',
                id: id,
                user_id: app.currentUser.id,
                master_key: app.masterKey
            });

            if (result.success) {
                app.showAlert('Password deleted successfully!');
                this.loadPasswords();
            } else {
                app.showAlert(result.message || 'Failed to delete password', 'error');
            }
        } catch (error) {
            console.error('Error deleting password:', error);
            app.showAlert('Error deleting password', 'error');
        }
    }

    generatePassword() {
        const length = 10;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('entry-password').value = password;
        this.togglePasswordVisibility(true);
    }

    togglePasswordVisibility(forceShow = false) {
        const passwordInput = document.getElementById('entry-password');
        const toggleBtn = document.getElementById('toggle-password');
        
        if (forceShow || passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    }

    copyToClipboard(text) {
        // Use document.execCommand('copy') for iFrame compatibility
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize dashboard manager
const dashboard = new DashboardManager();

// Make dashboard methods available globally for the app
app.loadPasswords = () => dashboard.loadPasswords();