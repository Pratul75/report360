-- Insert random test CS user
INSERT INTO users (email, name, phone, password_hash, password_hint, role, is_active, created_at, updated_at)
VALUES (
    'testcs123@company.com',
    'Test CS Person',
    '9999888877',
    '$2b$12$ABC123DEF456GHI789JKL00MNOPQRSTUVWXYZ/abcdefghij/klmnop',
    'TestCS@2026',
    'client_servicing',
    1,
    NOW(),
    NOW()
) 
ON DUPLICATE KEY UPDATE is_active = 1;

-- Verify
SELECT id, name, email, role, is_active FROM users WHERE email = 'testcs123@company.com';

-- Check all CS users
SELECT id, name, email, role, is_active FROM users WHERE role = 'client_servicing' AND is_active = 1;
