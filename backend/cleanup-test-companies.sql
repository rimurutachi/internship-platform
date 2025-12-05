-- Remove test companies that were created during testing
DELETE FROM companies WHERE code IN ('TECH-001', 'MFG-002', 'START-003');
