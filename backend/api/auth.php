<?php
// Enable all errors
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../models/User.php';
require_once '../utils/encryption.php';

$response = ["success" => false, "message" => ""];

try {
    $input = file_get_contents("php://input");
    $data = json_decode($input);
    
    if (!$data) {
        throw new Exception("No data received");
    }

    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Could not connect to database. Please check if MySQL is running and database exists.");
    }

    $user = new User($db);

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data->action)) {
        if ($data->action === 'register') {
            // Validate input
            if (empty($data->username) || empty($data->email) || empty($data->password)) {
                throw new Exception("All fields are required");
            }

            if (strlen($data->password) < 8) {
                throw new Exception("Password must be at least 8 characters");
            }

            $user->username = trim($data->username);
            $user->email = trim($data->email);
            
            // Check if user exists
            if ($user->emailExists()) {
                throw new Exception("Email already registered");
            }
            if ($user->usernameExists()) {
                throw new Exception("Username already taken");
            }

            // Create user
            $masterKey = Encryption::generateMasterKey();
            $encryption = new Encryption($data->password);
            $encryptedMasterKey = $encryption->encrypt($masterKey);

            $user->password_hash = Encryption::hashPassword($data->password);
            $user->master_key_encrypted = $encryptedMasterKey;

            if ($user->create()) {
                $response["success"] = true;
                $response["message"] = "Registration successful! You can now login.";
                $response["role"] = $user->role;
            } else {
                throw new Exception("Failed to create user account");
            }

        } elseif ($data->action === 'login') {
            if (empty($data->email) || empty($data->password)) {
                throw new Exception("Email and password are required");
            }

            $user->email = trim($data->email);
            
            if ($user->emailExists() && Encryption::verifyPassword($data->password, $user->password_hash)) {
                $encryption = new Encryption($data->password);
                $masterKey = $encryption->decrypt($user->master_key_encrypted);

                $response["success"] = true;
                $response["message"] = "Login successful";
                $response["data"] = [
                    "user_id" => $user->id,
                    "username" => $user->username,
                    "role" => $user->role,
                    "master_key" => $masterKey
                ];
            } else {
                throw new Exception("Invalid email or password");
            }
        } else {
            throw new Exception("Invalid action");
        }
    } else {
        throw new Exception("Invalid request");
    }

} catch (Exception $e) {
    $response["message"] = $e->getMessage();
    $response["error"] = $e->getMessage();
}

echo json_encode($response);
?>
