import { authenticateToken, requireRole, AuthRequest } from '../../../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

// Helper to create mock req/res/next
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no Authorization header', async () => {
      const req = { headers: {} } as AuthRequest;
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No token provided' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has no Bearer prefix', async () => {
      const req = { headers: { authorization: 'InvalidToken' } } as AuthRequest;
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    it('should return 401 when user is not authenticated', async () => {
      const middleware = requireRole(['admin']);
      const req = { user: undefined } as AuthRequest;
      const res = mockResponse();

      await middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user has wrong role', async () => {
      const middleware = requireRole(['admin']);
      const req = {
        user: { id: 'test', email: 'test@test.com', role: 'student' }
      } as AuthRequest;
      const res = mockResponse();

      await middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Insufficient permissions' })
      );
    });

    it('should call next() when user has correct role', async () => {
      const middleware = requireRole(['admin', 'advisor']);
      const req = {
        user: { id: 'test', email: 'test@test.com', role: 'admin' }
      } as AuthRequest;
      const res = mockResponse();

      await middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
