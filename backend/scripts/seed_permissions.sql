-- Seed Permissions and Role Permissions
-- This script populates the permissions table and assigns them to roles

USE fleet_operations;

-- Clear existing data (if needed for fresh start)
-- DELETE FROM role_permissions;
-- DELETE FROM permissions;

-- Insert all permissions
INSERT INTO permissions (name, description) VALUES
-- User Management
('user.create', 'Create new users'),
('user.read', 'View user details'),
('user.update', 'Update user information'),
('user.delete', 'Delete users'),

-- Client Management
('client.create', 'Create new clients'),
('client.read', 'View client details'),
('client.update', 'Update client information'),
('client.delete', 'Delete clients'),

-- Project Management
('project.create', 'Create new projects'),
('project.read', 'View project details'),
('project.update', 'Update project information'),
('project.delete', 'Delete projects'),

-- Campaign Management
('campaign.create', 'Create new campaigns'),
('campaign.read', 'View campaign details'),
('campaign.update', 'Update campaign information'),
('campaign.delete', 'Delete campaigns'),

-- Vendor Management
('vendor.create', 'Create new vendors'),
('vendor.read', 'View vendor details'),
('vendor.update', 'Update vendor information'),
('vendor.delete', 'Delete vendors'),

-- Vehicle Management
('vehicle.create', 'Create new vehicles'),
('vehicle.read', 'View vehicle details'),
('vehicle.update', 'Update vehicle information'),
('vehicle.delete', 'Delete vehicles'),

-- Driver Management
('driver.create', 'Create new drivers'),
('driver.read', 'View driver details'),
('driver.update', 'Update driver information'),
('driver.delete', 'Delete drivers'),

-- Promoter Management
('promoter.create', 'Create new promoters'),
('promoter.read', 'View promoter details'),
('promoter.update', 'Update promoter information'),
('promoter.delete', 'Delete promoters'),

-- Promoter Activity Management
('promoter_activity.create', 'Create promoter activities'),
('promoter_activity.read', 'View promoter activities'),
('promoter_activity.update', 'Update promoter activities'),
('promoter_activity.delete', 'Delete promoter activities'),

-- Expense Management
('expense.create', 'Create new expenses'),
('expense.read', 'View expense details'),
('expense.update', 'Update expense information'),
('expense.delete', 'Delete expenses'),
('expense.approve', 'Approve/reject expenses'),

-- Report Management
('report.create', 'Create new reports'),
('report.read', 'View reports'),
('report.update', 'Update reports'),
('report.delete', 'Delete reports'),

-- Dashboard & Analytics
('dashboard.view', 'Access dashboard'),
('analytics.view', 'View analytics'),

-- Settings
('settings.view', 'View settings'),
('settings.update', 'Update settings')

ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Get role IDs
SET @admin_id = (SELECT id FROM roles WHERE name = 'admin');
SET @driver_id = (SELECT id FROM roles WHERE name = 'driver');
SET @promoter_id = (SELECT id FROM roles WHERE name = 'promoter');

-- ADMIN - Full access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_id, id FROM permissions;

-- DRIVER - Limited access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @driver_id, id FROM permissions WHERE name IN (
    'campaign.read',
    'vehicle.read',
    'expense.create',
    'expense.read',
    'dashboard.view'
);

-- PROMOTER - Activity management
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

-- Verify results
SELECT 'Permissions created:' as message, COUNT(*) as count FROM permissions;
SELECT 'Role permissions assigned:' as message, COUNT(*) as count FROM role_permissions;

SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;
