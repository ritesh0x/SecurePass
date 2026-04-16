<?php
class Encryption {
    private $cipher = "AES-256-CBC";
    private $key;
    private $iv;

    public function __construct($key) {
        // Derive a secure key from the user's password
        $this->key = hash('sha256', $key, true);
        $this->iv = openssl_random_pseudo_bytes(16);
    }

    public function encrypt($data) {
        if (empty($data)) return $data;
        
        $encrypted = openssl_encrypt($data, $this->cipher, $this->key, 0, $this->iv);
        if ($encrypted === false) {
            throw new Exception("Encryption failed: " . openssl_error_string());
        }
        
        // Combine IV and encrypted data
        $result = base64_encode($this->iv . $encrypted);
        return $result;
    }

    public function decrypt($data) {
        if (empty($data)) return $data;
        
        $data = base64_decode($data);
        if (strlen($data) < 16) {
            throw new Exception("Invalid encrypted data format");
        }
        
        $this->iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        $decrypted = openssl_decrypt($encrypted, $this->cipher, $this->key, 0, $this->iv);
        if ($decrypted === false) {
            throw new Exception("Decryption failed: " . openssl_error_string());
        }
        
        return $decrypted;
    }

    public static function generateMasterKey() {
        return bin2hex(openssl_random_pseudo_bytes(32));
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    public static function generateRandomPassword($length = 16) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
        $password = '';
        $charsLength = strlen($chars) - 1;
        
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, $charsLength)];
        }
        
        return $password;
    }
}
?>