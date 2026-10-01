<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password_hash;
    public $master_key_encrypted;
    public $role = 'user';
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureRoleColumn();
    }

    // Automatically check and add 'role' column if it does not exist
    private function ensureRoleColumn() {
        try {
            $check = $this->conn->query("SHOW COLUMNS FROM " . $this->table_name . " LIKE 'role'");
            if ($check && $check->rowCount() === 0) {
                $this->conn->exec("ALTER TABLE " . $this->table_name . " ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'");
            }
        } catch (PDOException $e) {
            // Ignore if column or table not ready yet
        }
    }

    public function create() {
        // First user registered automatically becomes 'admin'
        if ($this->getUserCount() === 0) {
            $this->role = 'admin';
        }

        $query = "INSERT INTO " . $this->table_name . " 
                 SET username = :username, email = :email, 
                 password_hash = :password_hash, master_key_encrypted = :master_key_encrypted,
                 role = :role";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));

        // Bind parameters
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":master_key_encrypted", $this->master_key_encrypted);
        $stmt->bindParam(":role", $this->role);

        try {
            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                return true;
            }
            return false;
        } catch (PDOException $e) {
            error_log("User creation error: " . $e->getMessage());
            if ($e->errorInfo[1] == 1062) {
                throw new Exception("Username or email already exists.");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public function emailExists() {
        $query = "SELECT id, username, password_hash, master_key_encrypted, role 
                  FROM " . $this->table_name . " 
                  WHERE email = :email 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        
        try {
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->password_hash = $row['password_hash'];
                $this->master_key_encrypted = $row['master_key_encrypted'];
                $this->role = isset($row['role']) && !empty($row['role']) ? $row['role'] : 'user';
                return true;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Email exists check error: " . $e->getMessage());
            return false;
        }
    }

    public function usernameExists() {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE username = :username 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        
        try {
            $stmt->execute();
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Username exists check error: " . $e->getMessage());
            return false;
        }
    }

    public function getUserById($id) {
        $query = "SELECT id, username, email, role, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        
        try {
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get user by ID error: " . $e->getMessage());
            return false;
        }
    }

    public function getUserCount() {
        try {
            $stmt = $this->conn->query("SELECT COUNT(*) as total FROM " . $this->table_name);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['total'] ?? 0);
        } catch (PDOException $e) {
            return 0;
        }
    }

    // Admin method: List all users with statistics
    public function getAllUsersWithStats() {
        $query = "SELECT u.id, u.username, u.email, u.role, u.created_at,
                         COUNT(p.id) as password_count
                  FROM " . $this->table_name . " u
                  LEFT JOIN password_entries p ON u.id = p.user_id
                  GROUP BY u.id
                  ORDER BY u.id ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Admin method: Delete a user and their vault
    public function deleteUser($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Admin method: Update a user's role (admin or user)
    public function updateUserRole($id, $role) {
        $query = "UPDATE " . $this->table_name . " SET role = :role WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
?>
