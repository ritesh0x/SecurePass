<?php
class Database {
    private $host = "localhost";
    private $db_name = "password_manager";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            // Return connection null but don't throw error immediately
            error_log("Connection error: " . $exception->getMessage());
            $this->conn = null;
        }
        return $this->conn;
    }
}
?>