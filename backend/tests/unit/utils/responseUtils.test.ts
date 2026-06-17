import { Response } from 'express';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationError,
  sendAuthError,
  sendAuthorizationError,
  sendNotFoundError,
  sendInternalError,
  asyncHandler,
  globalErrorHandler,
} from '../../../src/utils/responseUtils';

// Helper to create mock response
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Response Utilities', () => {
  describe('sendSuccessResponse', () => {
    it('should send 200 with success: true and message', () => {
      const res = mockResponse();
      sendSuccessResponse(res, 'Operation successful');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful',
      });
    });

    it('should include data when provided', () => {
      const res = mockResponse();
      sendSuccessResponse(res, 'Found', { id: 1 });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Found',
        data: { id: 1 },
      });
    });

    it('should use custom status code', () => {
      const res = mockResponse();
      sendSuccessResponse(res, 'Created', { id: 1 }, 201);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendErrorResponse', () => {
    it('should send 400 with error details', () => {
      const res = mockResponse();
      sendErrorResponse(res, 'Bad Request', 'Invalid input');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid input',
      });
    });

    it('should use custom status code', () => {
      const res = mockResponse();
      sendErrorResponse(res, 'Error', 'Custom', 422);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('shortcut error functions', () => {
    it('sendValidationError sends 400', () => {
      const res = mockResponse();
      sendValidationError(res, 'Field required');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation Error' })
      );
    });

    it('sendAuthError sends 401', () => {
      const res = mockResponse();
      sendAuthError(res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication Error' })
      );
    });

    it('sendAuthorizationError sends 403', () => {
      const res = mockResponse();
      sendAuthorizationError(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authorization Error' })
      );
    });

    it('sendNotFoundError sends 404', () => {
      const res = mockResponse();
      sendNotFoundError(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Not Found' })
      );
    });

    it('sendInternalError sends 500', () => {
      const res = mockResponse();
      sendInternalError(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Internal Server Error' })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should call the wrapped function', async () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const handler = asyncHandler(fn);
      const req = {} as any;
      const res = mockResponse();
      const next = jest.fn();

      await handler(req, res, next);

      expect(fn).toHaveBeenCalledWith(req, res, next);
    });

    it('should forward errors to next()', async () => {
      const error = new Error('Async failure');
      const fn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(fn);
      const req = {} as any;
      const res = mockResponse();
      const next = jest.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('globalErrorHandler', () => {
    it('should send 500 for generic errors', () => {
      const res = mockResponse();
      const error = new Error('Something broke');

      globalErrorHandler(error, {} as any, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Something broke' })
      );
    });

    it('should use error.statusCode if present', () => {
      const res = mockResponse();
      const error = { statusCode: 422, message: 'Validation failed' };

      globalErrorHandler(error, {} as any, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });
});
