# Database Schema Documentation

**Note:** All security-related tables exist in your Supabase database with RLS policies enabled.

## Security Tables Overview

This document covers the following security and monitoring tables:
1. `security_settings` - Security configuration
2. `login_attempts` - Login tracking
3. `security_alerts` - Security incidents
4. `rbac_roles` - Role-based access control
5. `system_events` - System event logging
6. `system_metrics_history` - Metrics tracking
7. `api_request_logs` - API activity logging

---

# Security Settings Table

```sql
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB,
    setting_type VARCHAR(50), -- 'boolean', 'string', 'number', 'json'
    description TEXT,
    is_system_level BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT security_settings_unique_key UNIQUE(setting_key)
);
```

**Default Settings:**
- `twofa_required` - Require 2FA for admin accounts
- `ip_whitelist_enabled` - Enable IP whitelist
- `session_timeout_minutes` - Session timeout (30 minutes)
- `api_key_rotation_days` - API key rotation period (90 days)
- `show_ip_in_logs` - Display IPs in audit logs
- `failed_login_threshold` - Failed login attempts before lockout (5)

---

# Login Attempts Table

```sql
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT false,
    failure_reason TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_login_attempts_user_id` - User ID lookup
- `idx_login_attempts_email` - Email lookup
- `idx_login_attempts_created_at` - Time-based queries
- `idx_login_attempts_success` - Filter by success/failure
- `idx_login_attempts_ip_address` - IP-based queries

---

# Security Alerts Table

```sql
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    affected_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Alert Types:**
- `failed_login` - Failed authentication attempts
- `suspicious_activity` - Unusual user behavior
- `data_access` - Unauthorized data access attempts
- `api_abuse` - API rate limit violations
- `security_breach` - Security incidents

**Indexes:**
- `idx_security_alerts_type` - Alert type filtering
- `idx_security_alerts_severity` - Severity filtering
- `idx_security_alerts_created_at` - Time-based queries
- `idx_security_alerts_user_id` - User-specific alerts

---

# System Events Table Schema

**Note:** This table already exists in your Supabase database with RLS policies enabled.

## Existing Schema (Already Created)

```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    service VARCHAR(100),
    message TEXT NOT NULL,
    error_code VARCHAR(50),
    count INTEGER DEFAULT 1,
    severity VARCHAR(16) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    metadata JSONB DEFAULT '{}',
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (type, message, service)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(type);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON public.system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON public.system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_resolved_at ON public.system_events(resolved_at);

-- 3. Enable Row Level Security
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- 4. Create Row Level Security Policies
-- Policy 1: Only admins can view events
CREATE POLICY "Admins can view events" ON public.system_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

-- Policy 2: Only admins can insert events
CREATE POLICY "Admins can insert events" ON public.system_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

-- Policy 3: Only admins can update events (for acknowledging/resolving)
CREATE POLICY "Admins can update events" ON public.system_events
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

-- Policy 4: Only admins can delete events
CREATE POLICY "Admins can delete events" ON public.system_events
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );
```

## Insert Sample Data (Optional)

```sql
-- Insert some sample data for testing
INSERT INTO public.system_events (type, service, message, severity, count) VALUES
  ('system', 'API Server', 'Server started successfully', 'info', 1),
  ('database', 'Database', 'High connection count detected', 'warning', 3),
  ('api', 'API Server', 'Slow response time detected', 'warning', 5),
  ('auth', 'API Server', 'Failed login attempt detected', 'warning', 10),
  ('socket', 'Socket Server', 'Connection established', 'info', 1)
ON CONFLICT (type, message, service) DO NOTHING;
```

## Optional: Useful Views

```sql
-- View for unresolved critical events
CREATE OR REPLACE VIEW public.critical_system_events AS
SELECT *
FROM public.system_events
WHERE severity = 'critical' AND resolved_at IS NULL
ORDER BY created_at DESC;

-- View for recent events (last 24 hours)
CREATE OR REPLACE VIEW public.recent_system_events AS
SELECT *
FROM public.system_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- View for event summary by type
CREATE OR REPLACE VIEW public.system_events_summary AS
SELECT 
  type,
  service,
  severity,
  COUNT(*) as total_events,
  SUM(count) as total_occurrences,
  MAX(created_at) as last_occurrence
FROM public.system_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type, service, severity
ORDER BY total_occurrences DESC;
```

## Additional Tables (Optional)

### System Metrics History Table (for trend tracking)

```sql
-- Create table to store historical metrics for trend graphs
CREATE TABLE IF NOT EXISTS public.system_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL, -- 'active_users', 'api_calls', 'response_time', etc
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(20), -- 'count', 'ms', 'percent', 'mb'
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_metrics_history_name ON public.system_metrics_history(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_history_recorded_at ON public.system_metrics_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.system_metrics_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can view metrics history" ON public.system_metrics_history
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert metrics history" ON public.system_metrics_history
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );
```

### API Request Logs Table (for tracking API calls)

```sql
-- Create table for API request logging
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON public.api_request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_user ON public.api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON public.api_request_logs(path);

-- Enable RLS
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can view api logs" ON public.api_request_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert api logs" ON public.api_request_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin' AND status = 'active'
    )
  );

-- Auto-cleanup function for old logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_request_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-api-logs', '0 2 * * *', 'SELECT cleanup_old_api_logs()');
```
