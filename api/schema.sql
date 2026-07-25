-- ===================================================
-- HNF CRM Database Migration & Initial Seed Data
-- ===================================================

CREATE DATABASE IF NOT EXISTS `hnf_crm` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hnf_crm`;

-- 1. Table: user_profile
CREATE TABLE IF NOT EXISTS `user_profile` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50),
  `role` VARCHAR(50),
  `department` VARCHAR(50),
  `initials` VARCHAR(10),
  `bio` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed user_profile
INSERT INTO `user_profile` (`id`, `name`, `email`, `phone`, `role`, `department`, `initials`, `bio`) VALUES
(1, 'Admin User', 'admin@hnfcrm.com', '+1 (555) 234-5678', 'Super Admin', 'Management', 'AD', 'Lead Administrator of HNF CRM System.')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 2. Table: customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50),
  `company` VARCHAR(100),
  `status` VARCHAR(20) DEFAULT 'prospect',
  `value` INT DEFAULT 0,
  `deal` VARCHAR(100),
  `owner` VARCHAR(100),
  `city` VARCHAR(50),
  `country` VARCHAR(50),
  `joined` DATE,
  `industry` VARCHAR(50),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed customers
INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `company`, `status`, `value`, `deal`, `owner`, `city`, `country`, `joined`, `industry`, `notes`) VALUES
(1, 'Ariel Santos', 'ariel@techvision.com', '+1 555-0101', 'TechVision Inc.', 'active', 42500, 'Enterprise Suite', 'Jamie Rivera', 'San Francisco', 'USA', '2024-01-15', 'Technology', 'Key enterprise account. CEO-level contact.'),
(2, 'Maria Reyes', 'm.reyes@bluepeak.io', '+1 555-0102', 'BluePeak Solutions', 'active', 28900, 'Pro Plan', 'Alex Morgan', 'Austin', 'USA', '2024-03-08', 'Finance', 'Renewed annually. Interested in add-ons.'),
(3, 'James Lim', 'j.lim@cloudnova.sg', '+65 555-0103', 'CloudNova', 'prospect', 15000, 'Starter Package', 'Jamie Rivera', 'Singapore', 'SG', '2024-06-01', 'SaaS', 'In evaluation stage. Demo scheduled.'),
(4, 'Sophie Müller', 's.mueller@dataspark.de', '+49 555-0104', 'DataSpark GmbH', 'active', 67200, 'Enterprise+', 'Sam Chen', 'Berlin', 'DE', '2023-11-20', 'Analytics', 'High-value account. Monthly check-ins.'),
(5, 'David Park', 'd.park@nexwave.kr', '+82 555-0105', 'NexWave Corp', 'inactive', 9800, 'Basic Plan', 'Alex Morgan', 'Seoul', 'KR', '2024-02-14', 'E-commerce', 'Contract expired. Re-engagement needed.'),
(6, 'Priya Sharma', 'priya@innovatex.in', '+91 555-0106', 'InnovateX', 'active', 33400, 'Growth Plan', 'Sam Chen', 'Mumbai', 'IN', '2024-04-22', 'Consulting', 'Fast-growing startup. Expanding team.'),
(7, 'Lucas Durand', 'l.durand@webcraft.fr', '+33 555-0107', 'WebCraft Paris', 'prospect', 12000, 'Agency Bundle', 'Jamie Rivera', 'Paris', 'FR', '2024-07-10', 'Design', 'Referred by DataSpark. High intent.'),
(8, 'Aisha Mohammed', 'aisha@finedge.ae', '+971 555-0108', 'FinEdge UAE', 'active', 89000, 'Enterprise Suite', 'Sam Chen', 'Dubai', 'AE', '2023-09-05', 'Finance', 'Top account. Quarterly executive meetings.')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 3. Table: employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `dept` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'active',
  `accessLevel` VARCHAR(20) DEFAULT 'Standard',
  `password` VARCHAR(255) DEFAULT 'password123',
  `deals` INT DEFAULT 0,
  `revenue` INT DEFAULT 0,
  `tasks` INT DEFAULT 0,
  `joined` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed employees
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `status`, `accessLevel`, `deals`, `revenue`, `tasks`, `joined`) VALUES
(1, 'Jamie Rivera', 'HOD IT', 'IT', 'j.rivera@hnfcrm.com', '+1 555-1001', 'active', 'Manager', 24, 183000, 8, '2022-03-01'),
(2, 'Alex Morgan', 'Software Developer', 'Engineering', 'a.morgan@hnfcrm.com', '+1 555-1002', 'active', 'Standard', 18, 124500, 5, '2022-07-15'),
(3, 'Sam Chen', 'IT Support', 'IT Support', 's.chen@hnfcrm.com', '+1 555-1003', 'active', 'Standard', 31, 265000, 11, '2021-11-20'),
(4, 'Taylor Nguyen', 'Technical Support', 'Operations', 't.nguyen@hnfcrm.com', '+1 555-1004', 'active', 'Standard', 0, 0, 14, '2023-02-10'),
(5, 'Jordan Lee', 'System Analysis', 'Systems', 'j.lee@hnfcrm.com', '+1 555-1005', 'active', 'Manager', 6, 42000, 9, '2023-05-08'),
(6, 'Casey Wong', 'Devops', 'Infrastructure', 'c.wong@hnfcrm.com', '+1 555-1006', 'on-leave', 'Standard', 0, 0, 3, '2022-09-01'),
(7, 'Marcus Brody', 'Finance', 'Finance', 'm.brody@hnfcrm.com', '+1 555-1007', 'active', 'Standard', 12, 95000, 4, '2023-01-10'),
(8, 'Elena Rostova', 'Marketing', 'Marketing', 'e.rostova@hnfcrm.com', '+1 555-1008', 'active', 'Standard', 15, 110000, 7, '2023-04-18')
ON DUPLICATE KEY UPDATE `name`=`name`;


-- 4. Table: tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `desc` TEXT,
  `status` VARCHAR(20) DEFAULT 'todo',
  `priority` VARCHAR(20) DEFAULT 'medium',
  `startDate` DATE,
  `due` DATE,
  `progress` INT DEFAULT 0,
  `assignee` VARCHAR(100),
  `customer` VARCHAR(100),
  `type` VARCHAR(50) DEFAULT 'Task',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed tasks
INSERT INTO `tasks` (`id`, `title`, `desc`, `status`, `priority`, `startDate`, `due`, `progress`, `assignee`, `customer`, `type`) VALUES
(1, 'Follow-up call with Aisha Mohammed', 'Discuss Q4 renewal terms and new features.', 'todo', 'high', '2026-07-20', '2026-07-26', 25, 'Jamie Rivera', 'Aisha Mohammed', 'Call'),
(2, 'Send proposal to Lucas Durand', 'Prepare customized Agency Bundle proposal.', 'todo', 'medium', '2026-07-18', '2026-07-23', 10, 'Jamie Rivera', 'Lucas Durand', 'Proposal'),
(3, 'Product demo for James Lim', 'CloudNova starter package walkthrough.', 'in-progress', 'high', '2026-07-16', '2026-07-22', 75, 'Alex Morgan', 'James Lim', 'Demo'),
(4, 'Re-engage David Park', 'Send re-activation email campaign.', 'in-progress', 'medium', '2026-07-19', '2026-07-24', 50, 'Alex Morgan', 'David Park', 'Email'),
(5, 'Quarterly review — Sophie Müller', 'Executive QBR presentation prep.', 'done', 'high', '2026-07-13', '2026-07-18', 100, 'Sam Chen', 'Sophie Müller', 'Meeting'),
(6, 'Onboarding Maria Reyes', 'New feature onboarding session completed.', 'done', 'low', '2026-07-10', '2026-07-15', 100, 'Jordan Lee', 'Maria Reyes', 'Onboarding'),
(7, 'Update Priya Sharma contract', 'Growth plan annual renewal documents.', 'todo', 'medium', '2026-07-23', '2026-07-29', 0, 'Sam Chen', 'Priya Sharma', 'Contract'),
(8, 'CRM data cleanup', 'Remove duplicate entries, update missing fields.', 'in-progress', 'low', '2026-07-21', '2026-07-31', 40, 'Taylor Nguyen', NULL, 'Internal')
ON DUPLICATE KEY UPDATE `title`=`title`;

-- 5. Table: orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customerId` INT,
  `customerName` VARCHAR(100),
  `type` VARCHAR(20) DEFAULT 'request',
  `title` VARCHAR(255) NOT NULL,
  `desc` TEXT,
  `status` VARCHAR(20) DEFAULT 'pending',
  `amount` DECIMAL(10,2) DEFAULT 0.00,
  `date` DATE,
  `quotationNo` VARCHAR(50),
  `assignee` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed orders
INSERT INTO `orders` (`id`, `customerId`, `customerName`, `type`, `title`, `desc`, `status`, `amount`, `date`, `quotationNo`, `assignee`) VALUES
(101, 1, 'Ariel Santos', 'request', 'API Integration Module', 'Build REST API integration with third-party ERP system.', 'approved', 4500.00, '2026-06-10', 'QT-2026-001', 'Sam Chen'),
(102, 1, 'Ariel Santos', 'bug', 'Dashboard crash on refresh', 'Dashboard throws 500 error when user refreshes the page.', 'resolved', 0.00, '2026-06-18', NULL, 'Taylor Nguyen'),
(103, 1, 'Ariel Santos', 'request', 'Custom Reporting Feature', 'Monthly revenue report export to PDF.', 'pending', 2800.00, '2026-07-01', 'QT-2026-008', 'Jamie Rivera'),
(104, 2, 'Maria Reyes', 'bug', 'Login loop on mobile', 'Users are redirected back to login page after successful auth on iOS.', 'in-progress', 0.00, '2026-06-25', NULL, 'Taylor Nguyen'),
(105, 2, 'Maria Reyes', 'request', 'Two-Factor Authentication', 'Add SMS-based 2FA to user accounts.', 'approved', 1500.00, '2026-07-05', 'QT-2026-010', 'Sam Chen'),
(106, 4, 'Sophie Müller', 'request', 'Data Analytics Dashboard', 'Advanced analytics with drill-down charts.', 'approved', 12000.00, '2026-05-20', 'QT-2026-003', 'Sam Chen'),
(107, 4, 'Sophie Müller', 'bug', 'Export CSV encoding issue', 'German umlauts corrupted in CSV export.', 'resolved', 0.00, '2026-06-30', NULL, 'Taylor Nguyen'),
(108, 6, 'Priya Sharma', 'request', 'White-label Branding', 'Custom logo and color scheme for client portal.', 'pending', 3200.00, '2026-07-08', 'QT-2026-012', 'Jamie Rivera'),
(109, 8, 'Aisha Mohammed', 'request', 'Multi-currency Support', 'Enable AED and USD transaction processing.', 'approved', 8500.00, '2026-06-01', 'QT-2026-005', 'Sam Chen'),
(110, 8, 'Aisha Mohammed', 'bug', 'Notification emails delayed', 'Email alerts arriving 30+ minutes late.', 'in-progress', 0.00, '2026-07-12', NULL, 'Taylor Nguyen')
ON DUPLICATE KEY UPDATE `title`=`title`;

-- 6. Table: activities
CREATE TABLE IF NOT EXISTS `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `text` VARCHAR(255) NOT NULL,
  `time` VARCHAR(50),
  `color` VARCHAR(20),
  `icon` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed activities
INSERT INTO `activities` (`id`, `text`, `time`, `color`, `icon`) VALUES
(1, 'Aisha Mohammed signed Enterprise Suite renewal', '2 hours ago', '#10b981', 'fa-file-signature'),
(2, 'James Lim demo scheduled for tomorrow', '4 hours ago', '#6366f1', 'fa-calendar-check'),
(3, 'New lead: Lucas Durand from WebCraft Paris', '6 hours ago', '#06b6d4', 'fa-user-plus'),
(4, 'David Park account marked inactive', '1 day ago', '#f59e0b', 'fa-user-minus'),
(5, 'Sophie Müller QBR completed successfully', '2 days ago', '#8b5cf6', 'fa-handshake')
ON DUPLICATE KEY UPDATE `text`=`text`;

-- 7. Table: task_attachments
CREATE TABLE IF NOT EXISTS `task_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(100),
  `file_size` INT DEFAULT 0,
  `file_path` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed task_attachments
INSERT INTO `task_attachments` (`id`, `task_id`, `file_name`, `original_name`, `file_type`, `file_size`, `file_path`) VALUES
(1, 1, 'sample_contract.pdf', 'Q4_Renewal_Proposal.pdf', 'application/pdf', 245000, 'api/uploads/sample_contract.pdf'),
(2, 3, 'demo_screenshot.png', 'Product_Demo_Screenshot.png', 'image/png', 512000, 'api/uploads/demo_screenshot.png')
ON DUPLICATE KEY UPDATE `file_name`=`file_name`;

