<?php
/**
 * AgriSarthi - Backend API Bridge
 * This script connects to a MySQL database and returns table data as JSON.
 */

// 1. Headers to allow cross-origin requests from your React frontend
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 2. Database Configuration
// Update these values with your actual database credentials
$host    = 'localhost';
$db_name = 'your_database_name';
$db_user = 'your_username';
$db_pass = 'your_password';
$charset = 'utf8mb4';

// 3. Establish Connection using PDO (Secure & Modern)
$dsn = "mysql:host=$host;dbname=$db_name;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::ATTR_FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // 4. Fetch Logic
    // Example: Fetching Mandi Prices. Replace 'mandi_prices' with your actual table name.
    $table_name = 'mandi_prices'; 
    
    // Check if a specific ID or search query is requested via GET
    $crop_name = isset($_GET['crop']) ? $_GET['crop'] : null;

    if ($crop_name) {
        // Safe prepared statement to prevent SQL Injection
        $stmt = $pdo->prepare("SELECT * FROM $table_name WHERE crop_name = :crop ORDER BY date DESC");
        $stmt->execute(['crop' => $crop_name]);
    } else {
        $stmt = $pdo->query("SELECT * FROM $table_name ORDER BY id DESC LIMIT 100");
    }

    $results = $stmt->fetchAll();

    // 5. Output JSON
    echo json_encode([
        'status' => 'success',
        'timestamp' => date('Y-m-d H:i:s'),
        'count' => count($results),
        'data' => $results
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    // Return a professional error message
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed. Please check credentials or server status.',
        'debug_info' => $e->getMessage() // Remove debug_info in production
    ]);
}
?>
