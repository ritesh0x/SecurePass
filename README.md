# 🔐 SecurePass - Password Manager

SecurePass is a lightweight, self-hosted web-based password manager built with PHP, MySQL/MariaDB, and modern JavaScript.

## 🚀 Features

- **Client-Side SPA Architecture**: Fast and responsive UI with smooth view transitions (Landing, Login, Register, Dashboard).
- **Master Key Derivation**: Per-user master encryption key generated during registration and encrypted with the user's master password.
- **AES-256-CBC Encryption**: Individual vault credentials (passwords, notes, accounts) are encrypted at rest using OpenSSL with dynamic IVs.
- **Secure Password Hashing**: Master user accounts protected using PHP's `password_hash()` (BCRYPT with cost factor 12).
- **Interactive Dashboard**:
  - Live search and filter across account titles, usernames, websites, and notes.
  - One-click random password generator with customizable characters.
  - Show/hide password toggles and clipboard copy buttons.
  - Category tagging (General, Social, Finance, Work).

---

## 📂 Project Structure

```
SecurePass/
├── backend/
│   ├── api/
│   │   ├── auth.php         # Registration & login endpoint (JSON API)
│   │   └── passwords.php    # CRUD operations for vault entries (AES-256 encrypted)
│   ├── config/
│   │   └── database.php     # PDO Database connection settings
│   ├── models/
│   │   ├── User.php          # User table queries & uniqueness checks
│   │   └── PasswordEntry.php # CRUD SQL queries for stored vault credentials
│   └── utils/
│       └── encryption.php   # AES-256-CBC encryption/decryption & password hashing
├── database/
│   ├── schema.sql           # Database schema (`users` & `password_entries` tables)
│   └── setup.php            # Web-based database installer and self-test script
├── frontend/
│   ├── index.html           # SPA entry point
│   ├── css/
│   │   ├── auth.css         # Styling for authentication forms & strength meter
│   │   └── style.css        # Layout, variables, buttons, modals, & cards
│   └── js/
│       ├── main.js          # App lifecycle, routing, localStorage auth check, API fetch helper
│       ├── auth.js          # Form handlers for login, registration & strength meter
│       └── dashboard.js     # Vault actions (create, edit, delete, copy, reveal password, search)
├── INSTALL.md               # Detailed installation & setup guide
└── README.md                # Project overview and documentation
```

---

## 📋 Prerequisites

- **OS**: Linux / WSL (Ubuntu)
- **PHP**: >= 7.4 (PHP 8.x recommended) with extensions: `pdo`, `pdo_mysql`, `openssl`, `json`
- **Database**: MySQL or MariaDB
- **Web Server**: Apache or PHP built-in server

---

## ⚡ Quick Start

1. Start Apache and MariaDB/MySQL:
   ```bash
   sudo service mariadb start
   sudo service apache2 start
   ```
2. Set up the database:
   ```bash
   mysql -u root -p password_manager < database/schema.sql
   ```
3. Open in your browser:
   ```
   http://localhost/SecurePass/frontend/index.html
   ```

For detailed step-by-step instructions, see [INSTALL.md](INSTALL.md).
