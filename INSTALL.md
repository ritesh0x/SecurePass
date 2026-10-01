# 🛠️ SecurePass Installation & Setup Guide for WSL Ubuntu

This guide walks you through setting up and running **SecurePass** on WSL (Ubuntu).

---

## 1. System Requirements & Package Installation

Ensure the required packages (Apache, PHP, MySQL/MariaDB driver, and OpenSSL) are installed:

```bash
sudo apt update
sudo apt install -y apache2 php libapache2-mod-php php-mysql openssl mariadb-server
```

Verify PHP and its required modules:
```bash
php -v
php -m | grep -E "pdo|pdo_mysql|openssl|json"
```

---

## 2. Directory Permissions

Ensure your WSL user owns the project folder so that files and logs are accessible:

```bash
sudo chown -R $USER:$USER /var/www/html/SecurePass
sudo chmod -R 755 /var/www/html/SecurePass
```

---

## 3. Start Required Services

WSL does not always run background system daemons automatically upon launch. Start MariaDB and Apache:

```bash
sudo service mariadb start
sudo service apache2 start
```

Check their statuses:
```bash
sudo service mariadb status
sudo service apache2 status
```

---

## 4. Database Setup

### Option A: Command Line Setup
1. Create the database and import the schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS password_manager;"
   mysql -u root -p password_manager < /var/www/html/SecurePass/database/schema.sql
   ```

2. (Optional / Recommended) Create a dedicated database user:
   ```bash
   mysql -u root -p -e "CREATE USER IF NOT EXISTS 'securepass'@'localhost' IDENTIFIED BY 'SecretPass123!';"
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON password_manager.* TO 'securepass'@'localhost';"
   mysql -u root -p -e "FLUSH PRIVILEGES;"
   ```
   If creating a custom user, update `backend/config/database.php` with the corresponding username and password.

### Option B: Built-in Web Installer
Visit the installer script in your web browser:
```
http://localhost/SecurePass/database/setup.php
```
This tests your connection and automatically creates the tables.

---

## 5. Running the Application

### Method 1: Using Apache (Recommended)
With the project placed in `/var/www/html/SecurePass`, simply open your browser in Windows and navigate to:
```
http://localhost/SecurePass/frontend/index.html
```

### Method 2: Using PHP Built-In Development Server
You can also run the application using PHP's built-in server directly from the project directory:
```bash
cd /var/www/html/SecurePass
php -S 0.0.0.0:8000
```
Then visit:
```
http://localhost:8000/frontend/index.html
```

---

## 6. Testing the Application

1. **Register**:
   - Go to `http://localhost/SecurePass/frontend/index.html`.
   - Click **Register**, fill in your username, email, and master password (minimum 8 characters).
2. **Login**:
   - Log in using your email and master password.
3. **Manage Passwords**:
   - Click **➕ Add New Password**.
   - Use the **Generate** button to create a strong password or enter your own.
   - Save the password and test copying to clipboard, viewing decrypted passwords, searching, and deleting entries.

---

## 7. Troubleshooting

- **Access Denied in MySQL (`1045`)**: Use `mysql -u root -p` with the correct root password, or configure a dedicated user in `backend/config/database.php`.
- **Apache 403 Forbidden**: Ensure permissions are set correctly: `sudo chmod -R 755 /var/www/html/SecurePass`.
- **API Call Failed**: Open the browser Developer Console (`F12` -> Network tab) to inspect the API responses returned by `/backend/api/auth.php` or `/backend/api/passwords.php`.
