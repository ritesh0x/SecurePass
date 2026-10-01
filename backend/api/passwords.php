<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// *** FINAL FIX: Corrected inclusion paths assuming the standard folder structure ***
require_once '../config/database.php';
require_once '../models/PasswordEntry.php';
require_once '../utils/encryption.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    $passwordEntry = new PasswordEntry($db);

    // Get input data
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data) {
        throw new Exception("Invalid JSON input");
    }

    // Validate required parameters
    if (!isset($data->user_id) || !isset($data->master_key)) {
        throw new Exception("User ID and master key are required");
    }

    $user_id = intval($data->user_id);
    $master_key = $data->master_key;

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($data->action)) {
            throw new Exception("Action is required");
        }

        $encryption = new Encryption($master_key);

        if ($data->action === 'create') {
            // Validate required fields
            if (!isset($data->title) || empty(trim($data->title))) {
                throw new Exception("Title is required");
            }
            if (!isset($data->password) || empty(trim($data->password))) {
                throw new Exception("Password is required");
            }

            $passwordEntry->user_id = $user_id;
            $passwordEntry->title = trim($data->title);
            $passwordEntry->username = isset($data->username) ? trim($data->username) : '';
            $passwordEntry->encrypted_password = $encryption->encrypt(trim($data->password));
            $passwordEntry->website = isset($data->website) ? trim($data->website) : '';
            $passwordEntry->notes = isset($data->notes) ? trim($data->notes) : '';
            $passwordEntry->category = isset($data->category) ? trim($data->category) : 'General';

            if ($passwordEntry->create()) {
                http_response_code(201);
                echo json_encode([
                    "success" => true,
                    "message" => "Password entry created successfully"
                ]);
            } else {
                throw new Exception("Failed to create password entry");
            }

        } elseif ($data->action === 'read') {
            $passwordEntry->user_id = $user_id;
            $stmt = $passwordEntry->read();
            $password_entries = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                try {
                    $decrypted_password = $encryption->decrypt($row['encrypted_password']);
                } catch (Exception $e) {
                    // If decryption fails, skip this entry
                    continue;
                }

                $password_entries[] = [
                    "id" => $row['id'],
                    "title" => $row['title'],
                    "username" => $row['username'],
                    "password" => $decrypted_password,
                    "website" => $row['website'],
                    "notes" => $row['notes'],
                    "category" => $row['category'],
                    "created_at" => $row['created_at']
                ];
            }

            http_response_code(200);
            echo json_encode([
                "success" => true,
                "data" => $password_entries
            ]);

        } elseif ($data->action === 'update') {
            if (!isset($data->id)) {
                throw new Exception("Entry ID is required for update");
            }

            $passwordEntry->id = intval($data->id);
            $passwordEntry->user_id = $user_id;
            $passwordEntry->title = trim($data->title);
            $passwordEntry->username = isset($data->username) ? trim($data->username) : '';
            $passwordEntry->encrypted_password = $encryption->encrypt(trim($data->password));
            $passwordEntry->website = isset($data->website) ? trim($data->website) : '';
            $passwordEntry->notes = isset($data->notes) ? trim($data->notes) : '';
            $passwordEntry->category = isset($data->category) ? trim($data->category) : 'General';

            if ($passwordEntry->update()) {
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Password entry updated successfully"
                ]);
            } else {
                throw new Exception("Failed to update password entry");
            }

        } elseif ($data->action === 'delete') {
            if (!isset($data->id)) {
                throw new Exception("Entry ID is required for deletion");
            }

            $passwordEntry->id = intval($data->id);
            $passwordEntry->user_id = $user_id;

            if ($passwordEntry->delete()) {
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Password entry deleted successfully"
                ]);
            } else {
                throw new Exception("Failed to delete password entry");
            }
        } else {
            throw new Exception("Invalid action");
        }
    } else {
        throw new Exception("Method not allowed");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "error" => $e->getMessage()
    ]);
}
?>