import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { error } from 'console';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No Token Provided.'});
        }

        const { data: { user}, error } = await supabase.auth.getUser(token);

        if(error || !user) {
            return res.status(401).json({ error: 'Invalid Token.'});
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication Failed, try again.'})
    }
}

// Role-based Authentication
export const requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (!userProfile || !roles.includes(userProfile.role)) {
            return res.status(403).json({ error: 'Insufficient permissions, sorry!'});
        }

        next();
        } catch (error) {
            res.status(500).json({ error: 'Authorization Failed.'});
        }
    };
};