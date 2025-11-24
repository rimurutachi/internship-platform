"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
class SecurityController {
    // Get security overview
    static async getOverview(req, res) {
        try {
            // Count unresolved security alerts (last 24h)
            const { count: criticalEvents } = await supabase
                .from('security_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('severity', 'critical')
                .eq('is_resolved', false)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            return res.json({
                overall_status: criticalEvents && criticalEvents > 0 ? 'warning' : 'healthy',
                encryption: true,
                https_status: true,
                active_alerts_count: criticalEvents || 0,
                recent_events: []
            });
        }
        catch (error) {
            console.error('Error fetching security overview:', error);
            return res.status(500).json({ error: 'Failed to fetch security overview', message: error.message });
        }
    }
    // Get audit logs (from api_request_logs)
    static async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 20, user_id, status, startDate, endDate } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = supabase
                .from('api_request_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            if (user_id)
                query = query.eq('user_id', user_id);
            if (startDate)
                query = query.gte('created_at', startDate);
            if (endDate)
                query = query.lte('created_at', endDate);
            const { data, count, error } = await query;
            if (error)
                throw error;
            // Fetch user emails for logs with user_id
            const userIds = [...new Set((data || []).map((log) => log.user_id).filter(Boolean))];
            const { data: users } = await supabase
                .from('users')
                .select('id, email')
                .in('id', userIds);
            const userEmailMap = new Map((users || []).map((u) => [u.id, u.email]));
            // Transform API logs to audit log format
            const logs = (data || []).map((log) => ({
                id: log.id,
                user_id: log.user_id,
                user_email: log.user_id ? userEmailMap.get(log.user_id) || null : null,
                action: `${log.method} ${log.path}`,
                resource: log.path.split('/')[2] || 'api',
                status: log.status_code >= 200 && log.status_code < 300 ? 'success' : 'failed',
                ip_address: log.ip_address || '0.0.0.0',
                user_agent: log.user_agent,
                created_at: log.created_at
            }));
            return res.json({
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / Number(limit))
                },
                total: count || 0
            });
        }
        catch (error) {
            console.error('Error fetching audit logs:', error);
            return res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
        }
    }
    // Get API request logs
    static async getApiLogs(req, res) {
        try {
            const { page = 1, limit = 20, method, status_code, ip_address } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = supabase
                .from('api_request_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            if (method)
                query = query.eq('method', method);
            if (status_code)
                query = query.eq('status_code', status_code);
            if (ip_address)
                query = query.eq('ip_address', ip_address);
            const { data, count, error } = await query;
            if (error)
                throw error;
            return res.json({
                logs: data || [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Error fetching API logs:', error);
            return res.status(500).json({ error: 'Failed to fetch API logs', message: error.message });
        }
    }
    // Get security alerts (from security_alerts table)
    static async getSecurityAlerts(req, res) {
        try {
            const { page = 1, limit = 20, severity, resolved } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = supabase
                .from('security_alerts')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            if (severity)
                query = query.eq('severity', severity);
            if (resolved === 'true')
                query = query.eq('is_resolved', true);
            if (resolved === 'false')
                query = query.eq('is_resolved', false);
            const { data, count, error } = await query;
            if (error)
                throw error;
            return res.json({
                alerts: data || [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / Number(limit))
                },
                total: count || 0
            });
        }
        catch (error) {
            console.error('Error fetching security alerts:', error);
            return res.status(500).json({ error: 'Failed to fetch security alerts', message: error.message });
        }
    }
    // Acknowledge/resolve alert
    static async updateAlert(req, res) {
        try {
            const { alertId } = req.params;
            const { acknowledged, resolved, notes } = req.body;
            const userId = req.user?.id;
            const updates = {
                updated_at: new Date().toISOString()
            };
            if (acknowledged) {
                updates.is_acknowledged = true;
                updates.acknowledged_at = new Date().toISOString();
                if (userId)
                    updates.acknowledged_by = userId;
            }
            if (resolved) {
                updates.is_resolved = true;
            }
            // Add notes to metadata if provided
            if (notes) {
                const { data: currentAlert } = await supabase
                    .from('security_alerts')
                    .select('metadata')
                    .eq('id', alertId)
                    .single();
                updates.metadata = {
                    ...(currentAlert?.metadata || {}),
                    acknowledgment_notes: notes,
                    acknowledged_at: new Date().toISOString()
                };
            }
            const { data, error } = await supabase
                .from('security_alerts')
                .update(updates)
                .eq('id', alertId)
                .select()
                .single();
            if (error)
                throw error;
            return res.json({ alert: data });
        }
        catch (error) {
            console.error('Error updating alert:', error);
            return res.status(500).json({ error: 'Failed to update alert', message: error.message });
        }
    }
    // Get login attempts
    static async getLoginAttempts(req, res) {
        try {
            const { page = 1, limit = 20, success, email, startDate, endDate } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = supabase
                .from('login_attempts')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            if (success !== undefined)
                query = query.eq('success', success === 'true');
            if (email)
                query = query.ilike('email', `%${email}%`);
            if (startDate)
                query = query.gte('created_at', startDate);
            if (endDate)
                query = query.lte('created_at', endDate);
            const { data, count, error } = await query;
            if (error)
                throw error;
            return res.json({
                attempts: data || [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / Number(limit))
                },
                total: count || 0
            });
        }
        catch (error) {
            console.error('Error fetching login attempts:', error);
            return res.status(500).json({ error: 'Failed to fetch login attempts', message: error.message });
        }
    }
    // Get security settings
    static async getSettings(req, res) {
        try {
            const { data, error } = await supabase
                .from('security_settings')
                .select('*');
            if (error)
                throw error;
            // Transform array of settings to object
            const settings = {};
            (data || []).forEach((setting) => {
                const key = setting.setting_key;
                const value = setting.setting_value;
                // Extract value based on type
                if (setting.setting_type === 'boolean') {
                    settings[key] = value?.enabled || false;
                }
                else if (setting.setting_type === 'number') {
                    settings[key] = value?.value || 0;
                }
                else {
                    settings[key] = value;
                }
            });
            return res.json({ settings });
        }
        catch (error) {
            console.error('Error fetching settings:', error);
            return res.status(500).json({ error: 'Failed to fetch settings', message: error.message });
        }
    }
    // Update security settings
    static async updateSettings(req, res) {
        try {
            const settings = req.body;
            // Update each setting in the database
            const updatePromises = Object.entries(settings).map(async ([key, value]) => {
                // Fetch the setting type
                const { data: existing } = await supabase
                    .from('security_settings')
                    .select('setting_type')
                    .eq('setting_key', key)
                    .single();
                if (!existing)
                    return null;
                // Format value based on type
                let setting_value;
                if (existing.setting_type === 'boolean') {
                    setting_value = { enabled: value };
                }
                else if (existing.setting_type === 'number') {
                    setting_value = { value: value };
                }
                else {
                    setting_value = value;
                }
                return supabase
                    .from('security_settings')
                    .update({
                    setting_value,
                    updated_at: new Date().toISOString()
                })
                    .eq('setting_key', key);
            });
            await Promise.all(updatePromises);
            return res.json({ settings });
        }
        catch (error) {
            console.error('Error updating settings:', error);
            return res.status(500).json({ error: 'Failed to update settings', message: error.message });
        }
    }
    // Get security health status
    static async getHealthStatus(req, res) {
        try {
            // Count critical alerts in last hour
            const { count: criticalCount } = await supabase
                .from('security_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('severity', 'critical')
                .eq('is_resolved', false)
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
            // Count unresolved alerts
            const { count: activeAlerts } = await supabase
                .from('security_alerts')
                .select('*', { count: 'exact', head: true })
                .eq('is_resolved', false);
            // Count failed login attempts in last hour
            const { count: failedLogins } = await supabase
                .from('login_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('success', false)
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
            const status = (criticalCount || 0) > 0 ? 'critical' : (activeAlerts || 0) > 5 ? 'warning' : 'healthy';
            return res.json({
                status,
                encryption: true,
                tls: true,
                active_alerts: activeAlerts || 0,
                failed_logins_last_hour: failedLogins || 0
            });
        }
        catch (error) {
            console.error('Error fetching health status:', error);
            return res.status(500).json({ error: 'Failed to fetch health status', message: error.message });
        }
    }
    // Export audit logs as CSV
    static async exportAuditLogs(req, res) {
        try {
            const { format = 'csv', filters = {} } = req.body;
            // Fetch all audit logs (limit to 10000 for performance)
            const { data, error } = await supabase
                .from('api_request_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);
            if (error)
                throw error;
            if (format === 'csv') {
                const csv = [
                    'ID,Method,Path,Status,Response Time,User ID,IP Address,Created At',
                    ...(data || []).map((log) => `${log.id},${log.method},${log.path},${log.status_code},${log.response_time_ms},${log.user_id || ''},${log.ip_address || ''},${log.created_at}`)
                ].join('\n');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
                return res.send(csv);
            }
            return res.json({ logs: data });
        }
        catch (error) {
            console.error('Error exporting audit logs:', error);
            return res.status(500).json({ error: 'Failed to export audit logs', message: error.message });
        }
    }
}
exports.default = SecurityController;
//# sourceMappingURL=securityController.js.map