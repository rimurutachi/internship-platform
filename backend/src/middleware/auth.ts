import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export interface AuthRequest extends Request {
    user?: User;
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'No token provided',
                message: 'Authorization header with Bearer token is required'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'Token is invalid or expired'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ 
            error: 'Authentication failed',
            message: 'Unable to verify authentication'
        });
    }
}

// Role-based Authentication
export const requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ 
                    error: 'User not authenticated',
                    message: 'Please authenticate first'
                });
            }

            const { data: userProfile, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (error || !userProfile) {
                return res.status(404).json({ 
                    error: 'User profile not found',
                    message: 'Unable to find user profile'
                });
            }

            if (!roles.includes(userProfile.role)) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    message: `Access denied. Required roles: ${roles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ 
                error: 'Authorization failed',
                message: 'Unable to verify user permissions'
            });
        }
    };
};