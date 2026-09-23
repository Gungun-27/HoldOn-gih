import { UserProfile, UserRole } from '@holdon/shared';
import { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  userProfile?: UserProfile;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    logger.warn('authenticateToken: Received empty or literal null/undefined token');
    return next();
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      logger.warn({ error: error?.message }, 'authenticateToken: Supabase auth.getUser failed');
      return next();
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    // Fetch profile for role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      req.userProfile = profile as UserProfile;
    } else {
      req.userProfile = {
        id: data.user.id,
        name: (data.user.user_metadata?.name as string) || 'Citizen',
        role: ((data.user.user_metadata?.role as UserRole) || 'user'),
      };
    }

    next();
  } catch (err: any) {
    logger.error({ err: err?.message }, 'authenticateToken: Exception during token verification');
    next();
  }
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required for this endpoint',
    });
  }
  next();
};

export const requireOfficer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required for this endpoint',
    });
  }

  if (req.userProfile?.role !== 'officer') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Officer access required',
    });
  }

  next();
};
