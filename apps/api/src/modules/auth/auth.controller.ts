import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/helpers';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.id);
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { default: prisma } = await import('../../config/database');
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          mobile: true,
          firstName: true,
          lastName: true,
          avatar: true,
          language: true,
          isSuperAdmin: true,
          tenant: {
            select: {
              id: true,
              companyName: true,
              ownerName: true,
              mobile: true,
              address: true,
              logo: true,
              status: true,
              language: true,
              currency: true,
              dateFormat: true,
              lockedModules: true,
            },
          },
          userRoles: {
            include: { role: { select: { name: true, displayName: true } } },
          },
        },
      });
      sendSuccess(res, {
        ...user,
        roles: user?.userRoles.map(ur => ur.role) || [],
        permissions: req.user!.permissions,
      });
    } catch (error) {
      next(error);
    }
  }
}
