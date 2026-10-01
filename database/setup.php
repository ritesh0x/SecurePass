<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Password Manager - Database Setup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Password Manager Database Setup</h1>
    
    <?php
    // Database configuration
    $host = 'localhost';
    $dbname = 'password_manager';
    $username = 'root';
    $password = '';

    try {
        echo "<h2>Step 1: Connecting to MySQL...</h2>";
        
        // Connect to MySQL without selecting database
        $pdo = new PDO("mysql:host=$host", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<p class='success'>✓ Connected to MySQL server successfully</p>";

        // Create database if not exists
        echo "<h2>Step 2: Creating database...</h2>";
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$dbname`");
        
        echo "<p class='success'>✓ Database '$dbname' created or already exists</p>";

        // Read and execute schema
        echo "<h2>Step 3: Creating tables...</h2>";
        $schema_file = 'schema.sql';
        
        if (file_exists($schema_file)) {
            $schema = file_get_contents($schema_file);
            $statements = array_filter(array_map('trim', explode(';', $schema)));
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    try {
                        $pdo->exec($statement);
                        echo "<p class='success'>✓ Executed: " . substr($statement, 0, 50) . "...</p>";
                    } catch (PDOException $e) {
                        echo "<p class='info'>ℹ " . $e->getMessage() . "</p>";
                    }
                }
            }
            
            echo "<p class='success'>✓ Tables created successfully</p>";
        } else {
            throw new Exception("Schema file '$schema_file' not found");
        }

        // Test connection with the main config
        echo "<h2>Step 4: Testing application connection...</h2>";
        require_once '../backend/config/database.php';
        require_once '../backend/models/User.php'; 
        require_once '../backend/models/PasswordEntry.php'; 
        
        $database = new Database();
        $conn = $database->getConnection();
        
        if ($conn) {
            echo "<p class='success'>✓ Application can connect to database successfully</p>";
            
            // Test basic operations
            $user_test = new User($conn);
            echo "<p class='success'>✓ User model loaded successfully</p>";
            
            $password_test = new PasswordEntry($conn);
            echo "<p class='success'>✓ PasswordEntry model loaded successfully</p>";
            
        } else {
            throw new Exception("Application cannot connect to database");
        }

        echo "<h2 class='success'>🎉 Database setup completed successfully!</h2>";
        echo "<p>You can now <a href='/SECUREPASS/frontend/index.html'>access the password manager</a></p>";

    } catch (PDOException $e) {
        echo "<p class='error'>✗ Database Error: " . $e->getMessage() . "</p>";
        echo "<p>Please check your MySQL credentials in backend/config/database.php</p>";
        echo "<pre>Current settings:\n- Host: $host\n- Database: $dbname\n- Username: $username\n- Password: " . str_repeat('*', strlen($password)) . "</pre>";
    } catch (Exception $e) {
        echo "<p class='error'>✗ Error: " . $e->getMessage() . "</p>";
    }
    ?>
    
    <h2>Next Steps:</h2>
    <ol>
        <li>If you see errors above, check your MySQL server is running</li>
        <li>Update database credentials in <code>backend/config/database.php</code> if needed</li>
        <li>Visit <a href="../../frontend/index.html">the application</a> to register your first account</li>
    </ol>
</body>
</html>