<?php
// ===================================================
// HNF CRM API Controller (POST Method Handler)
// ===================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enforce POST method requirement
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST requests are allowed.']);
    exit();
}

try {
    require_once __DIR__ . '/db.php';

    if (!$pdo) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . ($dbError ?? 'Please verify your .env database settings.')
        ]);
        exit();
    }

    // Parse POST input (JSON payload or x-www-form-urlencoded)
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $action = isset($input['action']) ? trim($input['action']) : '';
    $userRole = isset($input['userRole']) ? trim($input['userRole']) : 'HOD IT';
    $appEnv = getenv('APP_ENV') ?: 'prod';

    $permissions = [
        'Super Admin'        => ['view_sales' => true,  'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => true],
        'HOD IT'             => ['view_sales' => true,  'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => true],
        'Software Developer' => ['view_sales' => true,  'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => true],
        'IT Support'         => ['view_sales' => false, 'add_edit_customer' => false, 'add_edit_task' => true, 'add_edit_employee' => false],
        'Technical Support'  => ['view_sales' => false, 'add_edit_customer' => false, 'add_edit_task' => true, 'add_edit_employee' => false],
        'Devops'             => ['view_sales' => false, 'add_edit_customer' => false, 'add_edit_task' => true, 'add_edit_employee' => false],
        'System Analysis'    => ['view_sales' => false, 'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => false],
        'Finance'            => ['view_sales' => true,  'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => false],
        'Marketing'          => ['view_sales' => true,  'add_edit_customer' => true,  'add_edit_task' => true, 'add_edit_employee' => false],
    ];
    $userPerms = isset($permissions[$userRole]) ? $permissions[$userRole] : $permissions['HOD IT'];

    switch ($action) {


        // ===================================================
        // ACTION: get_initial_data
        // ===================================================
        case 'get_initial_data':
            $customers = $pdo->query("SELECT * FROM customers ORDER BY id DESC")->fetchAll();
            // Cast numeric fields
            foreach ($customers as &$c) {
                $c['id'] = (int)$c['id'];
                $c['value'] = (int)$c['value'];
            }

            $employees = $pdo->query("SELECT * FROM employees ORDER BY id DESC")->fetchAll();
            foreach ($employees as &$e) {
                $e['id'] = (int)$e['id'];
                $e['deals'] = (int)$e['deals'];
                $e['revenue'] = (int)$e['revenue'];
                $e['tasks'] = (int)$e['tasks'];
            }

            $tasks = $pdo->query("SELECT * FROM tasks ORDER BY id DESC")->fetchAll();
            foreach ($tasks as &$t) {
                $t['id'] = (int)$t['id'];
                $t['progress'] = (int)$t['progress'];

                // Load attachments
                try {
                    $stmtAtt = $pdo->prepare("SELECT * FROM task_attachments WHERE task_id = ? ORDER BY id ASC");
                    $stmtAtt->execute([$t['id']]);
                    $t['attachments'] = $stmtAtt->fetchAll();
                    foreach ($t['attachments'] as &$att) {
                        $att['id'] = (int)$att['id'];
                        $att['task_id'] = (int)$att['task_id'];
                        $att['file_size'] = (int)$att['file_size'];
                    }
                } catch (Exception $ex) {
                    $t['attachments'] = [];
                }
            }


            $orders = $pdo->query("SELECT * FROM orders ORDER BY id DESC")->fetchAll();
            foreach ($orders as &$o) {
                $o['id'] = (int)$o['id'];
                $o['customerId'] = (int)$o['customerId'];
                $o['amount'] = (float)$o['amount'];
            }

            $activities = $pdo->query("SELECT * FROM activities ORDER BY id DESC LIMIT 10")->fetchAll();
            foreach ($activities as &$a) {
                $a['id'] = (int)$a['id'];
            }

            $userProfile = $pdo->query("SELECT * FROM user_profile LIMIT 1")->fetch();
            if (!$userProfile) {
                $userProfile = [
                    'name' => 'Admin User',
                    'email' => 'admin@hnfcrm.com',
                    'phone' => '+1 (555) 234-5678',
                    'role' => 'Super Admin',
                    'department' => 'Management',
                    'initials' => 'AD',
                    'bio' => 'Lead Administrator of HNF CRM System.'
                ];
            }

            $chartData = [40, 65, 48, 72, 55, 80, 67, 90, 75, 95, 82, 100];

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'appEnv' => $appEnv,
                    'systemRoles' => array_keys($permissions),
                    'rolePermissions' => $permissions,
                    'customers' => $customers,
                    'employees' => $employees,
                    'tasks' => $tasks,
                    'orders' => $orders,
                    'activities' => $activities,
                    'userProfile' => $userProfile,
                    'chartData' => $chartData
                ]
            ]);
            break;

        // ===================================================
        // ACTION: get_roles
        // ===================================================
        case 'get_roles':
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'systemRoles' => array_keys($permissions),
                    'rolePermissions' => $permissions
                ]
            ]);
            break;

        // ===================================================
        // ACTION: login
        // ===================================================
        case 'login':
            $email = trim($input['email'] ?? '');
            $password = trim($input['password'] ?? '');

            if (empty($email) || empty($password)) {
                echo json_encode(['status' => 'error', 'message' => 'Please fill all fields.']);
                break;
            }

            if ($password !== 'admin123') {
                echo json_encode(['status' => 'error', 'message' => 'Invalid password. Try: admin123']);
                break;
            }

            $userProfile = $pdo->query("SELECT * FROM user_profile LIMIT 1")->fetch();
            echo json_encode([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'user' => $userProfile
                ]
            ]);
            break;

        // ===================================================
        // ACTION: save_customer
        // ===================================================
        case 'save_customer':
            if (empty($userPerms['add_edit_customer'])) {
                echo json_encode(['status' => 'error', 'message' => 'Permission denied: Your role cannot add or edit customers.']);
                break;
            }
            $id = isset($input['id']) ? (int)$input['id'] : null;
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $company = trim($input['company'] ?? '');
            $status = trim($input['status'] ?? 'prospect');
            $value = isset($input['value']) ? (int)$input['value'] : 0;
            $deal = trim($input['deal'] ?? '');
            $owner = trim($input['owner'] ?? '');
            $city = trim($input['city'] ?? '');
            $country = trim($input['country'] ?? '');
            $industry = trim($input['industry'] ?? '');
            $notes = trim($input['notes'] ?? '');

            if (empty($name) || empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Name and email are required.']);
                break;
            }

            if ($id) {
                // Update
                $stmt = $pdo->prepare("UPDATE customers SET name=?, email=?, phone=?, company=?, status=?, value=?, deal=?, owner=?, city=?, country=?, industry=?, notes=? WHERE id=?");
                $stmt->execute([$name, $email, $phone, $company, $status, $value, $deal, $owner, $city, $country, $industry, $notes, $id]);
            } else {
                // Insert
                $joined = date('Y-m-d');
                $stmt = $pdo->prepare("INSERT INTO customers (name, email, phone, company, status, value, deal, owner, city, country, joined, industry, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $phone, $company, $status, $value, $deal, $owner, $city, $country, $joined, $industry, $notes]);
                $id = (int)$pdo->lastInsertId();
            }

            $customer = $pdo->prepare("SELECT * FROM customers WHERE id=?");
            $customer->execute([$id]);
            $res = $customer->fetch();
            $res['id'] = (int)$res['id'];
            $res['value'] = (int)$res['value'];

            echo json_encode(['status' => 'success', 'data' => $res]);
            break;

        // ===================================================
        // ACTION: save_employee
        // ===================================================
        case 'save_employee':
            if (empty($userPerms['add_edit_employee'])) {
                echo json_encode(['status' => 'error', 'message' => 'Permission denied: Your role cannot add or edit employees.']);
                break;
            }
            $id = isset($input['id']) ? (int)$input['id'] : null;

            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $role = trim($input['role'] ?? 'Account Executive');
            $dept = trim($input['dept'] ?? 'Sales');
            $accessLevel = trim($input['accessLevel'] ?? 'Standard');
            $status = trim($input['status'] ?? 'active');
            $password = trim($input['password'] ?? 'password123');
            $deals = isset($input['deals']) ? (int)$input['deals'] : 0;
            $revenue = isset($input['revenue']) ? (int)$input['revenue'] : 0;

            if (empty($name) || empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Name and email are required.']);
                break;
            }

            if ($id) {
                // Update
                $stmt = $pdo->prepare("UPDATE employees SET name=?, email=?, phone=?, role=?, dept=?, accessLevel=?, status=?, deals=?, revenue=? WHERE id=?");
                $stmt->execute([$name, $email, $phone, $role, $dept, $accessLevel, $status, $deals, $revenue, $id]);
            } else {
                // Insert
                $joined = date('Y-m-d');
                $stmt = $pdo->prepare("INSERT INTO employees (name, email, phone, role, dept, accessLevel, status, password, deals, revenue, tasks, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)");
                $stmt->execute([$name, $email, $phone, $role, $dept, $accessLevel, $status, $password, $deals, $revenue, $joined]);
                $id = (int)$pdo->lastInsertId();

                // Add activity log
                $actText = "New employee account created: $name ($role)";
                $actStmt = $pdo->prepare("INSERT INTO activities (text, time, color, icon) VALUES (?, 'Just now', '#6366f1', 'fa-user-plus')");
                $actStmt->execute([$actText]);
            }

            $emp = $pdo->prepare("SELECT * FROM employees WHERE id=?");
            $emp->execute([$id]);
            $res = $emp->fetch();
            $res['id'] = (int)$res['id'];
            $res['deals'] = (int)$res['deals'];
            $res['revenue'] = (int)$res['revenue'];

            echo json_encode(['status' => 'success', 'data' => $res]);
            break;

        // ===================================================
        // ACTION: save_task
        // ===================================================
        case 'save_task':
            $id = isset($input['id']) ? (int)$input['id'] : null;
            $title = trim($input['title'] ?? '');
            $desc = trim($input['desc'] ?? '');
            $status = trim($input['status'] ?? 'todo');
            $priority = trim($input['priority'] ?? 'medium');
            $type = trim($input['type'] ?? 'Task');
            $assignee = trim($input['assignee'] ?? '');
            $customer = trim($input['customer'] ?? '');
            $due = trim($input['due'] ?? date('Y-m-d'));
            $startDate = trim($input['startDate'] ?? date('Y-m-d'));
            $progress = isset($input['progress']) ? (int)$input['progress'] : ($status === 'done' ? 100 : ($status === 'in-progress' ? 50 : 0));

            if (empty($title)) {
                echo json_encode(['status' => 'error', 'message' => 'Task title is required.']);
                break;
            }

            if ($id) {
                // Update
                $stmt = $pdo->prepare("UPDATE tasks SET title=?, desc=?, status=?, priority=?, type=?, assignee=?, customer=?, due=?, startDate=?, progress=? WHERE id=?");
                $stmt->execute([$title, $desc, $status, $priority, $type, $assignee, $customer, $due, $startDate, $progress, $id]);
            } else {
                // Insert
                $stmt = $pdo->prepare("INSERT INTO tasks (title, desc, status, priority, type, assignee, customer, due, startDate, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$title, $desc, $status, $priority, $type, $assignee, $customer, $due, $startDate, $progress]);
                $id = (int)$pdo->lastInsertId();
            }

            $task = $pdo->prepare("SELECT * FROM tasks WHERE id=?");
            $task->execute([$id]);
            $res = $task->fetch();
            $res['id'] = (int)$res['id'];
            $res['progress'] = (int)$res['progress'];

            // Attachments
            try {
                $stmtAtt = $pdo->prepare("SELECT * FROM task_attachments WHERE task_id = ? ORDER BY id ASC");
                $stmtAtt->execute([$res['id']]);
                $res['attachments'] = $stmtAtt->fetchAll();
            } catch (Exception $ex) {
                $res['attachments'] = [];
            }

            echo json_encode(['status' => 'success', 'data' => $res]);
            break;

        // ===================================================
        // ACTION: upload_attachment
        // ===================================================
        case 'upload_attachment':
            $taskId = isset($input['taskId']) ? (int)$input['taskId'] : 0;
            $fileName = trim($input['fileName'] ?? '');
            $fileType = trim($input['fileType'] ?? '');
            $fileDataBase64 = $input['fileData'] ?? '';

            if (empty($fileName) || empty($fileDataBase64)) {
                echo json_encode(['status' => 'error', 'message' => 'File data and file name are required.']);
                break;
            }

            // Ensure upload directory exists
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }

            // Extension validation
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'];
            if (!in_array($ext, $allowedExts)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid file format. Allowed: Images (PNG, JPG, WEBP, GIF), PDF, DOC, DOCX, TXT.']);
                break;
            }

            $storageName = 'task_' . ($taskId ?: 'new') . '_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            $storagePath = $uploadDir . $storageName;

            // Decode base64 file data
            $rawFile = base64_decode(preg_replace('#^data:[\w/]+;base64,#i', '', $fileDataBase64));
            if (file_put_contents($storagePath, $rawFile) === false) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to save uploaded file on server.']);
                break;
            }

            $relPath = 'api/uploads/' . $storageName;
            $fileSize = strlen($rawFile);

            if ($taskId > 0) {
                $stmt = $pdo->prepare("INSERT INTO task_attachments (task_id, file_name, original_name, file_type, file_size, file_path) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$taskId, $storageName, $fileName, $fileType, $fileSize, $relPath]);
                $attId = (int)$pdo->lastInsertId();
            } else {
                $attId = time();
            }

            echo json_encode([
                'status' => 'success',
                'data' => [
                    'id' => $attId,
                    'task_id' => $taskId,
                    'file_name' => $storageName,
                    'original_name' => $fileName,
                    'file_type' => $fileType,
                    'file_size' => $fileSize,
                    'file_path' => $relPath,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
            break;

        // ===================================================
        // ACTION: delete_attachment
        // ===================================================
        case 'delete_attachment':
            $attId = isset($input['id']) ? (int)$input['id'] : 0;
            if ($attId > 0) {
                try {
                    $stmt = $pdo->prepare("SELECT * FROM task_attachments WHERE id = ?");
                    $stmt->execute([$attId]);
                    $att = $stmt->fetch();
                    if ($att) {
                        $absPath = __DIR__ . '/uploads/' . $att['file_name'];
                        if (file_exists($absPath)) {
                            @unlink($absPath);
                        }
                        $delStmt = $pdo->prepare("DELETE FROM task_attachments WHERE id = ?");
                        $delStmt->execute([$attId]);
                    }
                } catch (Exception $ex) {}
            }
            echo json_encode(['status' => 'success', 'message' => 'Attachment deleted successfully.']);
            break;

        // ===================================================
        // ACTION: save_order
        // ===================================================

        case 'save_order':
            $customerId = isset($input['customerId']) ? (int)$input['customerId'] : null;
            $customerName = trim($input['customerName'] ?? '');
            $type = trim($input['type'] ?? 'request');
            $title = trim($input['title'] ?? '');
            $desc = trim($input['desc'] ?? '');
            $amount = isset($input['amount']) ? (float)$input['amount'] : 0.00;
            $assignee = trim($input['assignee'] ?? '');
            $date = date('Y-m-d');
            $quotationNo = ($type === 'request') ? ('QT-' . date('Y') . '-' . rand(100, 999)) : null;
            $status = 'pending';

            if (empty($title)) {
                echo json_encode(['status' => 'error', 'message' => 'Order title is required.']);
                break;
            }

            $stmt = $pdo->prepare("INSERT INTO orders (customerId, customerName, type, title, desc, status, amount, date, quotationNo, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$customerId, $customerName, $type, $title, $desc, $status, $amount, $date, $quotationNo, $assignee]);
            $id = (int)$pdo->lastInsertId();

            $order = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $order->execute([$id]);
            $res = $order->fetch();
            $res['id'] = (int)$res['id'];
            $res['customerId'] = (int)$res['customerId'];
            $res['amount'] = (float)$res['amount'];

            echo json_encode(['status' => 'success', 'data' => $res]);
            break;

        // ===================================================
        // ACTION: save_profile
        // ===================================================
        case 'save_profile':
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $role = trim($input['role'] ?? '');
            $department = trim($input['department'] ?? '');
            $bio = trim($input['bio'] ?? '');

            if (empty($name) || empty($email)) {
                echo json_encode(['status' => 'error', 'message' => 'Name and email are required.']);
                break;
            }

            $parts = explode(' ', trim($name));
            $initials = count($parts) > 1 ? strtoupper(substr($parts[0], 0, 1) . substr(end($parts), 0, 1)) : strtoupper(substr($parts[0], 0, 2));

            $stmt = $pdo->prepare("UPDATE user_profile SET name=?, email=?, phone=?, role=?, department=?, initials=?, bio=? WHERE id=1");
            $stmt->execute([$name, $email, $phone, $role, $department, $initials, $bio]);

            $prof = $pdo->query("SELECT * FROM user_profile WHERE id=1")->fetch();

            echo json_encode(['status' => 'success', 'data' => $prof]);
            break;

        // ===================================================
        // ACTION: delete_customer
        // ===================================================
        case 'delete_customer':
            if (empty($userPerms['add_edit_customer'])) {
                echo json_encode(['status' => 'error', 'message' => 'Permission denied: Your role cannot delete customers.']);
                break;
            }
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            if ($id > 0) {
                $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
                $stmt->execute([$id]);
            }
            echo json_encode(['status' => 'success', 'message' => 'Customer deleted successfully.']);
            break;

        // ===================================================
        // ACTION: delete_employee
        // ===================================================
        case 'delete_employee':
            if (empty($userPerms['add_edit_employee'])) {
                echo json_encode(['status' => 'error', 'message' => 'Permission denied: Your role cannot delete employees.']);
                break;
            }
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            if ($id > 0) {
                $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
                $stmt->execute([$id]);
            }
            echo json_encode(['status' => 'success', 'message' => 'Employee deleted successfully.']);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid or missing POST action parameter.']);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
