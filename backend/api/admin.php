<?php
// Admin Management API Endpoint
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../models/User.php';

$response = ["success" => false, "message" => ""];

try {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data) {
        throw new Exception("Invalid JSON request");
    }

    if (!isset($data->admin_id)) {
        throw new Exception("Authentication credentials missing");
    }

    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $userModel = new User($db);

    // Verify admin privileges
    $admin = $userModel->getUserById((int)$data->admin_id);
    if (!$admin || ($admin['role'] ?? '') !== 'admin') {
        http_response_code(403);
        throw new Exception("Unauthorized: Admin privileges required");
    }

    if (!isset($data->action)) {
        throw new Exception("Action parameter required");
    }

    switch ($data->action) {
        case 'list_users':
            $users = $userModel->getAllUsersWithStats();
            $response["success"] = true;
            $response["data"] = $users;
            break;

        case 'delete_user':
            if (!isset($data->target_user_id)) {
                throw new Exception("Target user ID required");
            }
            $targetId = (int)$data->target_user_id;

            if ($targetId === (int)$data->admin_id) {
                throw new Exception("Cannot delete your own admin account");
            }

            if ($userModel->deleteUser($targetId)) {
                $response["success"] = true;
                $response["message"] = "User account and associated vault successfully deleted";
            } else {
                throw new Exception("Failed to delete user account");
            }
            break;

        case 'update_role':
            if (!isset($data->target_user_id) || !isset($data->new_role)) {
                throw new Exception("Target user ID and new role are required");
            }
            $targetId = (int)$data->target_user_id;
            $newRole = trim($data->new_role);

            if (!in_array($newRole, ['admin', 'user'])) {
                throw new Exception("Invalid role specified");
            }

            if ($targetId === (int)$data->admin_id && $newRole !== 'admin') {
                throw new Exception("Cannot demote your own admin account");
            }

            if ($userModel->updateUserRole($targetId, $newRole)) {
                $response["success"] = true;
                $response["message"] = "User role updated successfully";
            } else {
                throw new Exception("Failed to update user role");
            }
            break;

        default:
            throw new Exception("Unknown admin action");
    }

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    $response["message"] = $e->getMessage();
}

echo json_encode($response);
?>
