// Dashboard Vault & Admin Manager
class DashboardManager {
    constructor() {
        this.currentlyEditing = null;
        this.pendingDeleteId = null;
        this.pendingDeleteType = 'password'; // 'password' or 'user'
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.adminUsers = [];
        this.bindEvents();
    }

    bindEvents() {
        // Add Password Modal
        const addBtn = document.getElementById('add-password-btn');
        if (addBtn) addBtn.addEventListener('click', () => this.openPasswordModal());

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closePasswordModal());

        const closeBtn = document.querySelector('.close-modal-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closePasswordModal());

        // Save password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePassword();
            });
        }

        // Generate strong password
        const genBtn = document.getElementById('generate-password');
        if (genBtn) genBtn.addEventListener('click', () => this.generatePassword());

        // Toggle modal password visibility
        const toggleBtn = document.getElementById('toggle-password');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleModalPasswordVisibility());

        // Real-time search filter
        const searchInput = document.getElementById('search-passwords');
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
                }
                this.applyFiltersAndRender();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    clearSearchBtn.style.display = 'none';
                    this.applyFiltersAndRender();
                }
            });
        }

        // Category filter dropdown
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.activeFilter = e.target.value.toLowerCase();
                this.applyFiltersAndRender();
            });
        }

        // Custom Confirmation Modal Events
        const confirmCancel = document.getElementById('confirm-modal-cancel');
        const confirmOk = document.getElementById('confirm-modal-confirm');
        if (confirmCancel) confirmCancel.addEventListener('click', () => this.closeConfirmModal());
        if (confirmOk) confirmOk.addEventListener('click', () => this.handleConfirmedDeletion());

        // Close modals when clicking backdrop
        window.addEventListener('click', (e) => {
            const pwdModal = document.getElementById('password-modal');
            const confModal = document.getElementById('confirm-modal');
            if (e.target === pwdModal) this.closePasswordModal();
            if (e.target === confModal) this.closeConfirmModal();
        });

        // Close on Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePasswordModal();
                this.closeConfirmModal();
            }
        });
    }

    async loadPasswords() {
        if (!app.currentUser || !app.masterKey) return;

        try {
            const result = await app.apiCall('passwords.php', {
                action: 'read',
                user_id: app.currentUser.id,
                master_key: app.masterKey
            });

            if (result.success) {
                app.passwords = result.data || [];
                this.updateVaultCounter(app.passwords.length);
                this.applyFiltersAndRender();
            } else {
                app.showAlert(result.message || 'Failed to load vault items', 'error');
            }
        } catch (error) {
            console.error('Error loading vault:', error);
            app.showAlert('Error decrypting and loading vault', 'error');
        }
    }

    // ==================== Master Admin Functionality ====================
    async loadAdminUsers() {
        if (!app.currentUser || app.currentUser.role !== 'admin') return;

        try {
            const result = await app.apiCall('admin.php', {
                action: 'list_users',
                admin_id: app.currentUser.id
            });

            if (result.success) {
                this.adminUsers = result.data || [];
                this.renderAdminDashboard(this.adminUsers);
            } else {
                app.showAlert(result.message || 'Failed to load users for admin', 'error');
            }
        } catch (error) {
            console.error('Admin loading error:', error);
            app.showAlert('Error communicating with admin server', 'error');
        }
    }

    renderAdminDashboard(users) {
        const totalUsersEl = document.getElementById('admin-total-users');
        const totalPasswordsEl = document.getElementById('admin-total-passwords');
        const totalAdminsEl = document.getElementById('admin-total-admins');
        const tbody = document.getElementById('admin-users-table-body');

        if (!tbody) return;

        const totalUsers = users.length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        const totalVaultItems = users.reduce((acc, u) => acc + parseInt(u.password_count || 0, 10), 0);

        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (totalAdminsEl) totalAdminsEl.textContent = totalAdmins;
        if (totalPasswordsEl) totalPasswordsEl.textContent = totalVaultItems;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No user accounts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const isCurrentAdmin = String(user.id) === String(app.currentUser.id);
            const dateJoined = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
            const safeUsername = app.escapeHtml(user.username);
            const safeEmail = app.escapeHtml(user.email);
            const role = user.role || 'user';

            return `
                <tr data-user-id="${user.id}">
                    <td><strong>#${user.id}</strong></td>
                    <td>
                        <span style="font-weight: 600; color: #fff;">${safeUsername}</span>
                        ${isCurrentAdmin ? ' <span style="font-size:0.75rem; color:#818cf8;">(You)</span>' : ''}
                    </td>
                    <td>${safeEmail}</td>
                    <td>
                        <span class="role-badge-tag role-${role}">${role.toUpperCase()}</span>
                    </td>
                    <td>
                        <span style="font-family:'JetBrains Mono', monospace; color:#cbd5e1; font-weight:600;">
                            ${user.password_count || 0}
                        </span> items
                    </td>
                    <td>${dateJoined}</td>
                    <td>
                        <div class="table-actions">
                            <select class="action-role-select" data-user-id="${user.id}" ${isCurrentAdmin ? 'disabled title="Cannot change your own role"' : ''}>
                                <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
                                <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>

                            ${!isCurrentAdmin ? `
                                <button type="button" class="micro-btn btn-danger admin-delete-user-btn" data-user-id="${user.id}" data-username="${safeUsername}" title="Delete account and vault">
                                    <i class="fa-solid fa-user-xmark"></i> Delete
                                </button>
                            ` : `
                                <span style="font-size:0.75rem; color:var(--text-dim);">Protected</span>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.bindAdminTableEvents();
    }

    bindAdminTableEvents() {
        // Change Role dropdowns
        document.querySelectorAll('.action-role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const targetUserId = e.target.getAttribute('data-user-id');
                const newRole = e.target.value;
                await this.updateUserRole(targetUserId, newRole);
            });
        });

        // Delete User buttons
        document.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetUserId = btn.getAttribute('data-user-id');
                const username = btn.getAttribute('data-username');
                this.pendingDeleteType = 'user';
                this.openConfirmModal(targetUserId, `Are you sure you want to delete user account "${username}" and all their encrypted passwords? This cannot be undone.`);
            });
        });
    }

    async updateUserRole(targetUserId, newRole) {
        try {
            const result = await app.apiCall('admin.php', {
                action: 'update_role',
                admin_id: app.currentUser.id,
                target_user_id: targetUserId,
                new_role: newRole
            });

            if (result.success) {
                app.showAlert(result.message || 'User role updated successfully', 'success');
                await this.loadAdminUsers();
            } else {
                app.showAlert(result.message || 'Failed to update user role', 'error');
                await this.loadAdminUsers();
            }
        } catch (error) {
            console.error('Role update error:', error);
            app.showAlert('Error updating role', 'error');
        }
    }

    updateVaultCounter(count) {
        const counterEl = document.getElementById('vault-count-number');
        if (counterEl) counterEl.textContent = count;
    }

    applyFiltersAndRender() {
        let filtered = app.passwords || [];

        // Apply category filter
        if (this.activeFilter !== 'all') {
            filtered = filtered.filter(p => (p.category || 'General').toLowerCase() === this.activeFilter);
        }

        // Apply search query
        if (this.searchQuery) {
            filtered = filtered.filter(p => {
                const title = (p.title || '').toLowerCase();
                const user = (p.username || '').toLowerCase();
                const url = (p.website || '').toLowerCase();
                const notes = (p.notes || '').toLowerCase();
                return title.includes(this.searchQuery) ||
                       user.includes(this.searchQuery) ||
                       url.includes(this.searchQuery) ||
                       notes.includes(this.searchQuery);
            });
        }

        this.renderCards(filtered);
    }

    getCategoryIcon(category) {
        switch ((category || '').toLowerCase()) {
            case 'social': return '<i class="fa-solid fa-users" style="color: #f472b6;"></i>';
            case 'finance': return '<i class="fa-solid fa-wallet" style="color: #34d399;"></i>';
            case 'work': return '<i class="fa-solid fa-briefcase" style="color: #fbbf24;"></i>';
            default: return '<i class="fa-solid fa-key" style="color: #818cf8;"></i>';
        }
    }

    getCategoryTagClass(category) {
        switch ((category || '').toLowerCase()) {
            case 'social': return 'tag-social';
            case 'finance': return 'tag-finance';
            case 'work': return 'tag-work';
            default: return 'tag-general';
        }
    }

    renderCards(items) {
        const container = document.getElementById('passwords-container');
        if (!container) return;

        if (!items || items.length === 0) {
            const hasData = app.passwords && app.passwords.length > 0;
            container.innerHTML = `
                <div class="no-passwords-state">
                    <div class="empty-icon"><i class="fa-solid ${hasData ? 'fa-filter-circle-xmark' : 'fa-vault'}"></i></div>
                    <h3>${hasData ? 'No matching passwords found' : 'Your Vault is Empty'}</h3>
                    <p style="color: var(--text-muted); margin-top: 6px;">
                        ${hasData ? 'Try adjusting your search criteria or category filter.' : 'Click "New Password" above to add your first encrypted credential.'}
                    </p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(entry => {
            const safeTitle = app.escapeHtml(entry.title);
            const safeUsername = app.escapeHtml(entry.username);
            const safeWebsite = app.escapeHtml(entry.website);
            const safeNotes = app.escapeHtml(entry.notes);
            const safeCategory = app.escapeHtml(entry.category || 'General');
            const safePassword = app.escapeHtml(entry.password);
            const dateStr = entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '';

            return `
                <div class="password-card" data-id="${entry.id}">
                    <div>
                        <div class="password-card-header">
                            <div class="title-container">
                                <div class="category-avatar">
                                    ${this.getCategoryIcon(entry.category)}
                                </div>
                                <div>
                                    <div class="password-title">${safeTitle}</div>
                                    <span class="category-tag ${this.getCategoryTagClass(entry.category)}">${safeCategory}</span>
                                </div>
                            </div>
                            <div class="password-card-actions">
                                <button type="button" class="icon-action-btn edit-btn" title="Edit entry" data-id="${entry.id}">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button type="button" class="icon-action-btn delete-btn" title="Delete entry" data-id="${entry.id}">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>

                        <div class="password-details-box">
                            ${entry.username ? `
                                <div class="detail-row">
                                    <span class="detail-label">User</span>
                                    <span class="detail-value" title="${safeUsername}">${safeUsername}</span>
                                    <button type="button" class="micro-btn copy-btn" data-copy="${safeUsername}" title="Copy Username">
                                        <i class="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            ` : ''}

                            <div class="detail-row">
                                <span class="detail-label">Pass</span>
                                <span class="detail-value password-field">
                                    <span class="password-hidden-dots">••••••••••••</span>
                                    <span class="password-revealed" style="display:none;">${safePassword}</span>
                                </span>
                                <button type="button" class="micro-btn toggle-visibility-btn" title="Reveal Password">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                                <button type="button" class="micro-btn copy-btn" data-copy="${safePassword}" title="Copy Password">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>

                            ${entry.website ? `
                                <div class="detail-row">
                                    <span class="detail-label">Site</span>
                                    <span class="detail-value">
                                        <a href="${safeWebsite.startsWith('http') ? safeWebsite : 'https://' + safeWebsite}" target="_blank" rel="noopener noreferrer">
                                            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i> ${safeWebsite.replace(/^https?:\/\//, '')}
                                        </a>
                                    </span>
                                </div>
                            ` : ''}

                            ${entry.notes ? `
                                <div class="notes-preview">
                                    <i class="fa-regular fa-note-sticky" style="margin-right: 4px; color: var(--text-dim);"></i>
                                    ${safeNotes}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${dateStr ? `<div class="card-footer-meta">Added: ${dateStr}</div>` : ''}
                </div>
            `;
        }).join('');

        this.bindCardEvents();
    }

    bindCardEvents() {
        // Edit button
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const entry = app.passwords.find(p => String(p.id) === String(id));
                if (entry) this.openPasswordModal(entry);
            });
        });

        // Delete button
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const entry = app.passwords.find(p => String(p.id) === String(id));
                const title = entry ? entry.title : 'this entry';
                this.pendingDeleteType = 'password';
                this.openConfirmModal(id, `Are you sure you want to permanently delete "${app.escapeHtml(title)}"?`);
            });
        });

        // Copy button
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-copy');
                if (text) {
                    this.copyToClipboard(text);
                }
            });
        });

        // Toggle revealed password inside card
        document.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('.detail-row');
                const dots = row.querySelector('.password-hidden-dots');
                const revealed = row.querySelector('.password-revealed');
                const icon = btn.querySelector('i');

                if (dots.style.display !== 'none') {
                    dots.style.display = 'none';
                    revealed.style.display = 'inline';
                    icon.className = 'fa-regular fa-eye-slash';
                } else {
                    dots.style.display = 'inline';
                    revealed.style.display = 'none';
                    icon.className = 'fa-regular fa-eye';
                }
            });
        });
    }

    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            app.showAlert('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            app.showAlert('Could not copy to clipboard', 'error');
        }
    }

    openPasswordModal(entry = null) {
        this.currentlyEditing = entry;
        const modal = document.getElementById('password-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('password-form');
        const passInput = document.getElementById('entry-password');
        const toggleBtn = document.getElementById('toggle-password');

        if (!modal || !form) return;

        form.reset();
        passInput.type = 'password';
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i> Show';

        if (entry) {
            modalTitle.textContent = 'Edit Password';
            document.getElementById('entry-id').value = entry.id;
            document.getElementById('entry-title').value = entry.title || '';
            document.getElementById('entry-username').value = entry.username || '';
            document.getElementById('entry-password').value = entry.password || '';
            document.getElementById('entry-website').value = entry.website || '';
            document.getElementById('entry-category').value = entry.category || 'General';
            document.getElementById('entry-notes').value = entry.notes || '';
        } else {
            modalTitle.textContent = 'Add New Password';
            document.getElementById('entry-id').value = '';
            document.getElementById('entry-category').value = 'General';
        }

        modal.classList.add('active');
        document.getElementById('entry-title').focus();
    }

    closePasswordModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.classList.remove('active');
        this.currentlyEditing = null;
    }

    openConfirmModal(id, message) {
        this.pendingDeleteId = id;
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-modal-message');
        if (msgEl) msgEl.textContent = message;
        if (modal) modal.classList.add('active');
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.classList.remove('active');
        this.pendingDeleteId = null;
    }

    toggleModalPasswordVisibility() {
        const passInput = document.getElementById('entry-password');
        const toggleBtn = document.getElementById('toggle-password');
        if (!passInput) return;

        if (passInput.type === 'password') {
            passInput.type = 'text';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i> Hide';
        } else {
            passInput.type = 'password';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i> Show';
        }
    }

    generatePassword(length = 18) {
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const all = lowercase + uppercase + numbers + symbols;

        const getRandomChar = (str) => {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return str[array[0] % str.length];
        };

        let password = [
            getRandomChar(lowercase),
            getRandomChar(uppercase),
            getRandomChar(numbers),
            getRandomChar(symbols)
        ];

        for (let i = password.length; i < length; i++) {
            password.push(getRandomChar(all));
        }

        for (let i = password.length - 1; i > 0; i--) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            const j = array[0] % (i + 1);
            [password[i], password[j]] = [password[j], password[i]];
        }

        const passString = password.join('');
        const passInput = document.getElementById('entry-password');
        if (passInput) {
            passInput.value = passString;
            passInput.type = 'text';
            const toggleBtn = document.getElementById('toggle-password');
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i> Hide';
        }

        app.showAlert('Strong cryptographic password generated!', 'info');
    }

    async savePassword() {
        const title = document.getElementById('entry-title').value.trim();
        const username = document.getElementById('entry-username').value.trim();
        const password = document.getElementById('entry-password').value;
        const website = document.getElementById('entry-website').value.trim();
        const category = document.getElementById('entry-category').value;
        const notes = document.getElementById('entry-notes').value.trim();
        const entryId = document.getElementById('entry-id').value;

        if (!title || !password) {
            app.showAlert('Title and Password are required', 'error');
            return;
        }

        const action = entryId ? 'update' : 'create';
        const saveBtn = document.getElementById('save-password-btn');
        const origText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        const payload = {
            action: action,
            title: title,
            username: username,
            password: password,
            website: website,
            category: category,
            notes: notes,
            user_id: app.currentUser.id,
            master_key: app.masterKey
        };

        if (entryId) payload.id = entryId;

        try {
            const result = await app.apiCall('passwords.php', payload);

            if (result.success) {
                app.showAlert(`Password entry ${action === 'create' ? 'created' : 'updated'} successfully!`, 'success');
                this.closePasswordModal();
                await this.loadPasswords();
            } else {
                app.showAlert(result.message || 'Failed to save password', 'error');
            }
        } catch (error) {
            console.error('Error saving password:', error);
            app.showAlert('Error communicating with vault server', 'error');
        } finally {
            saveBtn.innerHTML = origText;
            saveBtn.disabled = false;
        }
    }

    async handleConfirmedDeletion() {
        if (!this.pendingDeleteId) return;

        if (this.pendingDeleteType === 'user') {
            await this.executeDeleteUser();
        } else {
            await this.executeDeletePassword();
        }
    }

    async executeDeletePassword() {
        const idToDelete = this.pendingDeleteId;
        const deleteConfirmBtn = document.getElementById('confirm-modal-confirm');
        const origText = deleteConfirmBtn.innerHTML;
        deleteConfirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
        deleteConfirmBtn.disabled = true;

        try {
            const result = await app.apiCall('passwords.php', {
                action: 'delete',
                id: idToDelete,
                user_id: app.currentUser.id,
                master_key: app.masterKey
            });

            if (result.success) {
                app.showAlert('Password entry permanently deleted', 'success');
                this.closeConfirmModal();
                await this.loadPasswords();
            } else {
                app.showAlert(result.message || 'Failed to delete entry', 'error');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            app.showAlert('Error deleting entry from server', 'error');
        } finally {
            deleteConfirmBtn.innerHTML = origText;
            deleteConfirmBtn.disabled = false;
        }
    }

    async executeDeleteUser() {
        const userIdToDelete = this.pendingDeleteId;
        const deleteConfirmBtn = document.getElementById('confirm-modal-confirm');
        const origText = deleteConfirmBtn.innerHTML;
        deleteConfirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting User...';
        deleteConfirmBtn.disabled = true;

        try {
            const result = await app.apiCall('admin.php', {
                action: 'delete_user',
                admin_id: app.currentUser.id,
                target_user_id: userIdToDelete
            });

            if (result.success) {
                app.showAlert(result.message || 'User account deleted', 'success');
                this.closeConfirmModal();
                await this.loadAdminUsers();
            } else {
                app.showAlert(result.message || 'Failed to delete user account', 'error');
            }
        } catch (error) {
            console.error('Admin delete user error:', error);
            app.showAlert('Error deleting user account', 'error');
        } finally {
            deleteConfirmBtn.innerHTML = origText;
            deleteConfirmBtn.disabled = false;
        }
    }
}

// Global dashboard instance
const dashboard = new DashboardManager();
