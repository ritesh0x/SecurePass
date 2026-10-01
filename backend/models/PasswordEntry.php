<?php
class PasswordEntry {
    private $conn;
    private $table_name = "password_entries";

    public $id;
    public $user_id;
    public $title;
    public $username;
    public $encrypted_password;
    public $website;
    public $notes;
    public $category;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET user_id = :user_id, title = :title, username = :username, 
                 encrypted_password = :encrypted_password, website = :website, 
                 notes = :notes, category = :category";

        $stmt = $this->conn->prepare($query);

        // Bind parameters
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":encrypted_password", $this->encrypted_password);
        $stmt->bindParam(":website", $this->website);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":category", $this->category);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Password entry creation error: " . $e->getMessage());
            throw new Exception("Failed to create password entry: " . $e->getMessage());
        }
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = :user_id 
                  ORDER BY title ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);

        try {
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            error_log("Password entries read error: " . $e->getMessage());
            throw new Exception("Failed to read password entries: " . $e->getMessage());
        }
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET title = :title, username = :username, 
                 encrypted_password = :encrypted_password, website = :website, 
                 notes = :notes, category = :category 
                 WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        // Bind parameters
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":encrypted_password", $this->encrypted_password);
        $stmt->bindParam(":website", $this->website);
        $stmt->bindParam(":notes", $this->notes);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Password entry update error: " . $e->getMessage());
            throw new Exception("Failed to update password entry: " . $e->getMessage());
        }
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Password entry delete error: " . $e->getMessage());
            throw new Exception("Failed to delete password entry: " . $e->getMessage());
        }
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = :id AND user_id = :user_id 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":user_id", $this->user_id);

        try {
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get password entry by ID error: " . $e->getMessage());
            return false;
        }
    }
}
?>