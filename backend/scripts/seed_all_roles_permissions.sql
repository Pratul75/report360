-- Complete Role Permissions Setup for All Roles
-- Based on RBAC implementation document

USE fleet_operations;

-- First, ensure all roles exist
INSERT INTO roles (name, description, is_protected) VALUES
('admin', 'System Administrator - Full Access', 1),
('sales', 'Sales Team - Client and Project Management', 0),
('purchase', 'Purchase Team - Vendor and Procurement', 0),
('operator', 'Field Operator - Campaign Execution', 0),
('driver', 'Driver - Vehicle Operations', 0),
('promoter', 'Promoter - Field Promotion Activities', 0),
('anchor', 'Anchor - Event Hosting', 0),
('vehicle_manager', 'Vehicle Manager - Fleet Management', 0),
('godown_manager', 'Godown Manager - Inventory Control', 0),
('client_servicing', 'Client Servicing - Customer Relations', 0),
('operations_manager', 'Operations Manager - Operations Oversight', 0),
('accounts', 'Accounts Team - Financial Management', 0),
('vendor', 'External Vendor - Vendor Portal', 0),
('client', 'Client User - Report Viewing', 0)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Clear existing role_permissions (will be recreated)
DELETE FROM role_permissions;

-- Get all role IDs
SET @admin_id = (SELECT id FROM roles WHERE name = 'admin');
SET @sales_id = (SELECT id FROM roles WHERE name = 'sales');
SET @purchase_id = (SELECT id FROM roles WHERE name = 'purchase');
SET @operator_id = (SELECT id FROM roles WHERE name = 'operator');
SET @driver_id = (SELECT id FROM roles WHERE name = 'driver');
SET @promoter_id = (SELECT id FROM roles WHERE name = 'promoter');
SET @anchor_id = (SELECT id FROM roles WHERE name = 'anchor');
SET @vehicle_mgr_id = (SELECT id FROM roles WHERE name = 'vehicle_manager');
SET @godown_mgr_id = (SELECT id FROM roles WHERE name = 'godown_manager');
SET @client_svc_id = (SELECT id FROM roles WHERE name = 'client_servicing');
SET @ops_mgr_id = (SELECT id FROM roles WHERE name = 'operations_manager');
SET @accounts_id = (SELECT id FROM roles WHERE name = 'accounts');
SET @vendor_id = (SELECT id FROM roles WHERE name = 'vendor');
SET @client_id = (SELECT id FROM roles WHERE name = 'client');

-- ====================
-- ADMIN - Full Access
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_id, id FROM permissions;

-- ====================
-- SALES - Client Acquisition & Project Management
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @sales_id, id FROM permissions WHERE name IN (
    'client.create',
    'client.read',
    'client.update',
    'client.delete',
    'project.create',
    'project.read',
    'project.update',
    'campaign.read',
    'vendor.read',
    'expense.create',
    'expense.read',
    'report.read',
    'dashboard.view'
);

-- ====================
-- PURCHASE - Vendor & Procurement Management
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @purchase_id, id FROM permissions WHERE name IN (
    'vendor.create',
    'vendor.read',
    'vendor.update',
    'vendor.delete',
    'vehicle.read',
    'driver.read',
    'expense.create',
    'expense.read',
    'expense.update',
    'campaign.read',
    'project.read',
    'dashboard.view'
);

-- ====================
-- OPERATOR - Campaign Execution & Field Operations
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @operator_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'campaign.update',
    'vehicle.read',
    'vehicle.update',
    'driver.read',
    'driver.update',
    'vendor.read',
    'promoter.read',
    'promoter.update',
    'promoter_activity.create',
    'promoter_activity.read',
    'expense.create',
    'expense.read',
    'report.create',
    'report.read',
    'dashboard.view'
);

-- ====================
-- DRIVER - Vehicle Operations
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @driver_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'vehicle.read',
    'expense.create',
    'expense.read',
    'dashboard.view'
);

-- ====================
-- PROMOTER - Field Promotion Activities
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @promoter_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'promoter.read',
    'promoter.update',
    'promoter_activity.create',
    'promoter_activity.read',
    'expense.create',
    'expense.read',
    'report.create',
    'report.read',
    'dashboard.view'
);

-- ====================
-- ANCHOR - Event Hosting
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @anchor_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'promoter_activity.create',
    'promoter_activity.read',
    'expense.create',
    'expense.read',
    'report.create',
    'report.read',
    'dashboard.view'
);

-- ====================
-- VEHICLE_MANAGER - Fleet Management
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @vehicle_mgr_id, id FROM permissions WHERE name IN (
    'vehicle.create',
    'vehicle.read',
    'vehicle.update',
    'vehicle.delete',
    'driver.create',
    'driver.read',
    'driver.update',
    'driver.delete',
    'campaign.read',
    'expense.read',
    'report.read',
    'dashboard.view'
);

-- ====================
-- GODOWN_MANAGER - Inventory Control
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @godown_mgr_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'project.read',
    'vendor.read',
    'expense.read',
    'report.read',
    'dashboard.view'
);

-- ====================
-- CLIENT_SERVICING - Client Relations
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @client_svc_id, id FROM permissions WHERE name IN (
    'client.read',
    'client.update',
    'project.create',
    'project.read',
    'project.update',
    'campaign.read',
    'campaign.update',
    'report.read',
    'expense.read',
    'dashboard.view'
);

-- ====================
-- OPERATIONS_MANAGER - Operations Oversight
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @ops_mgr_id, id FROM permissions WHERE name IN (
    'campaign.create',
    'campaign.read',
    'campaign.update',
    'campaign.delete',
    'project.read',
    'project.update',
    'vehicle.read',
    'driver.read',
    'vendor.read',
    'promoter.read',
    'promoter_activity.create',
    'promoter_activity.read',
    'expense.create',
    'expense.read',
    'expense.update',
    'expense.approve',
    'report.create',
    'report.read',
    'report.update',
    'dashboard.view',
    'analytics.view'
);

-- ====================
-- ACCOUNTS - Financial Management
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @accounts_id, id FROM permissions WHERE name IN (
    'project.read',
    'campaign.read',
    'vendor.read',
    'expense.create',
    'expense.read',
    'expense.update',
    'expense.approve',
    'expense.delete',
    'report.read',
    'dashboard.view',
    'analytics.view'
);

-- ====================
-- VENDOR - External Vendor Portal
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @vendor_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'vehicle.create',
    'vehicle.read',
    'vehicle.update',
    'driver.create',
    'driver.read',
    'driver.update',
    'expense.create',
    'expense.read',
    'dashboard.view'
);

-- ====================
-- CLIENT - End Client (Read-Only)
-- ====================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @client_id, id FROM permissions WHERE name IN (
    'project.read',
    'campaign.read',
    'report.read',
    'dashboard.view'
);

-- ====================
-- Summary Report
-- ====================
SELECT '========== ROLES SETUP COMPLETE ==========' as message;

SELECT 
    r.name as role,
    r.description,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.description
ORDER BY r.name;

SELECT '========== SAMPLE ROLE PERMISSIONS ==========' as message;

SELECT 
    r.name as role,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('sales', 'operator', 'accounts')
GROUP BY r.id, r.name;
