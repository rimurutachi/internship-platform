"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No Token Provided.' });
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid Token.' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Authentication Failed, try again.' });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based Authentication
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', req.user.id)
                .single();
            if (!userProfile || !roles.includes(userProfile.role)) {
                return res.status(403).json({ error: 'Insufficient permissions, sorry!' });
            }
            next();
        }
        catch (error) {
            res.status(500).json({ error: 'Authorization Failed.' });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map