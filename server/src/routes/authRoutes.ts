import { Router } from 'express';
import { AuthenticatedRequest, authenticateToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.get('/me', authenticateToken, requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user,
    profile: req.userProfile,
  });
});
