<?php
// ===================================================
// HNF CRM Database Connection (PDO MySQL / SQLite Fallback)
// ===================================================

// Helper function to parse .env file
if (!function_exists('loadEnv')) {
    function loadEnv($envFile) {
        if (!file_exists($envFile)) return;
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }
}

// Load .env from root or api directory
loadEnv(dirname(__DIR__) . '/.env');
loadEnv(__DIR__ . '/.env');

// $host     = getenv('DB_HOST') ?: '127.0.0.1';
// $port     = getenv('DB_PORT') ?: '3306';
// $dbname   = getenv('DB_NAME') ?: 'hnf_crm';
// $username = getenv('DB_USER') ?: 'root';
// $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

$host     = getenv('DB_HOST') ?: 'sql104.infinityfree.com';
$port     = getenv('DB_PORT') ?: '3306';
$dbname   = getenv('DB_NAME') ?: 'if0_42493757_hnf_crm';
$username = getenv('DB_USER') ?: 'if0_42493757';
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : 'mmyo147v18';

$pdo = null;
$dbError = null;

try {
    // Attempt MySQL connection
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    $dbError = "MySQL connection error: " . $e->getMessage();
    
    // Fallback to SQLite if MySQL is unavailable and driver is supported
    try {
        if (extension_loaded('pdo_sqlite') || (class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers()))) {
            $sqliteFile = __DIR__ . '/database.sqlite';
            $isNewDb = !file_exists($sqliteFile);
            $pdo = new PDO("sqlite:" . $sqliteFile, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            if ($isNewDb && file_exists(__DIR__ . '/schema.sql')) {
                $sql = file_get_contents(__DIR__ . '/schema.sql');
                $sql = preg_replace('/CREATE DATABASE.*?;/i', '', $sql);
                $sql = preg_replace('/USE `.*?`;/i', '', $sql);
                $sql = str_replace('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', '', $sql);
                $sql = str_replace('AUTO_INCREMENT', 'AUTOINCREMENT', $sql);
                $sql = str_replace('ON DUPLICATE KEY UPDATE `name`=`name`', '', $sql);
                $sql = str_replace('ON DUPLICATE KEY UPDATE `title`=`title`', '', $sql);
                $sql = str_replace('ON DUPLICATE KEY UPDATE `text`=`text`', '', $sql);
                $pdo->exec($sql);
            }
            $dbError = null; // SQLite fallback succeeded
        }
    } catch (Throwable $sqle) {
        $dbError .= " | SQLite fallback error: " . $sqle->getMessage();
        $pdo = null;
    }
}
