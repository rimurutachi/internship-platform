import { Request, Response, NextFunction } from 'express';
import {
  validateLoginRequest,
  validateRegisterRequest,
  validateProfileUpdateRequest,
  validateRoleChangeRequest,
  sanitizeInput,
  validateExpectedFields,
  validateInputLength,
} from '../../../src/middleware/validation';

// Helper to create mock req/res/next
const mockRequest = (body: any = {}) => ({ body } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};
const mockNext: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Validation Middleware', () => {
  describe('validateLoginRequest', () => {
    it('should call next() for valid login', () => {
      const req = mockRequest({ email: 'user@test.com', password: 'secret123' });
      const res = mockResponse();

      validateLoginRequest(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      const req = mockRequest({ email: 'not-an-email', password: 'secret123' });
      const res = mockResponse();

      validateLoginRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid email format' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing email', () => {
      const req = mockRequest({ password: 'secret123' });
      const res = mockResponse();

      validateLoginRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject password shorter than 6 chars', () => {
      const req = mockRequest({ email: 'user@test.com', password: '123' });
      const res = mockResponse();

      validateLoginRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid password' })
      );
    });
  });

  describe('validateRegisterRequest', () => {
    const validBody = {
      email: 'new@test.com',
      password: 'secret123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'student',
    };

    it('should call next() for valid registration', () => {
      const req = mockRequest(validBody);
      const res = mockResponse();

      validateRegisterRequest(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject missing first_name', () => {
      const req = mockRequest({ ...validBody, first_name: undefined });
      const res = mockResponse();

      validateRegisterRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing required fields' })
      );
    });

    it('should reject short names (< 2 chars)', () => {
      const req = mockRequest({ ...validBody, first_name: 'J' });
      const res = mockResponse();

      validateRegisterRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid name format' })
      );
    });

    it('should reject invalid role', () => {
      const req = mockRequest({ ...validBody, role: 'hacker' });
      const res = mockResponse();

      validateRegisterRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid role' })
      );
    });

    it('should accept all valid roles', () => {
      for (const role of ['student', 'advisor', 'supervisor', 'admin']) {
        const req = mockRequest({ ...validBody, role });
        const res = mockResponse();
        const next = jest.fn();

        validateRegisterRequest(req, res, next);

        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('validateProfileUpdateRequest', () => {
    it('should call next() for valid update', () => {
      const req = mockRequest({ first_name: 'Jane' });
      const res = mockResponse();

      validateProfileUpdateRequest(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject short first_name', () => {
      const req = mockRequest({ first_name: 'J' });
      const res = mockResponse();

      validateProfileUpdateRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject non-object profile_data', () => {
      const req = mockRequest({ profile_data: 'not-object' });
      const res = mockResponse();

      validateProfileUpdateRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid profile data' })
      );
    });

    it('should reject empty update (no fields)', () => {
      const req = mockRequest({});
      const res = mockResponse();

      validateProfileUpdateRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No updates provided' })
      );
    });
  });

  describe('validateRoleChangeRequest', () => {
    it('should call next() for valid role', () => {
      const req = mockRequest({ role: 'admin' });
      const res = mockResponse();

      validateRoleChangeRequest(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid role', () => {
      const req = mockRequest({ role: 'superadmin' });
      const res = mockResponse();

      validateRoleChangeRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject missing role', () => {
      const req = mockRequest({});
      const res = mockResponse();

      validateRoleChangeRequest(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize string fields in body', () => {
      // Note: DOMPurify is mocked in tests (returns input as-is)
      // We test the post-DOMPurify cleanup logic: javascript:/data: protocol removal
      const req = mockRequest({ name: 'javascript:alert(1)', link: 'data:text/html,test' });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.name).not.toContain('javascript:');
      expect(req.body.link).not.toContain('data:');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove javascript: protocol', () => {
      const req = mockRequest({ link: 'javascript:alert(1)' });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.link).not.toContain('javascript:');
    });

    it('should leave numbers and booleans unchanged', () => {
      const req = mockRequest({ count: 42, active: true });
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(req.body.count).toBe(42);
      expect(req.body.active).toBe(true);
    });

    it('should handle empty body gracefully', () => {
      const req = { body: null } as Request;
      const res = mockResponse();

      sanitizeInput(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateExpectedFields', () => {
    it('should call next() when all fields are allowed', () => {
      const middleware = validateExpectedFields(['name', 'email']);
      const req = mockRequest({ name: 'John', email: 'j@test.com' });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unexpected fields', () => {
      const middleware = validateExpectedFields(['name']);
      const req = mockRequest({ name: 'John', isAdmin: true });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request',
          allowedFields: ['name'],
        })
      );
    });

    it('should pass through when body is empty', () => {
      const middleware = validateExpectedFields(['name']);
      const req = { body: null } as Request;
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateInputLength', () => {
    it('should call next() when fields are within limits', () => {
      const middleware = validateInputLength({ name: 50 });
      const req = mockRequest({ name: 'John' });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject fields exceeding max length', () => {
      const middleware = validateInputLength({ name: 5 });
      const req = mockRequest({ name: 'JohnDoeExtraLong' });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Input too long',
          field: 'name',
          maxLength: 5,
        })
      );
    });

    it('should ignore non-string fields', () => {
      const middleware = validateInputLength({ count: 5 });
      const req = mockRequest({ count: 999999 });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
