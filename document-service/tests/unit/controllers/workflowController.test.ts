import { Request, Response } from 'express';
import { preApproveDraft, revertPreApproval } from '../../../src/controllers/workflowController';
import { createClient } from '@supabase/supabase-js';

// Supabase is already mocked in setup.ts
const mockSupabaseClient = (createClient as jest.Mock)();

// Mock pdfExportService
jest.mock('../../../src/services/pdfExportService', () => ({
  pdfExportService: {
    generatePreApprovedPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  }
}));

describe('WorkflowController - Hybrid Workflow Features', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('generateDocument (Pre-approve)', () => {
    it('should generate pre-approved document with watermark and qr code', async () => {
      mockReq = {
        params: { documentId: 'doc-123' },
        user: { id: 'adv-123', role: 'advisor' },
        body: { templateData: { student_name: 'John' } }
      } as any;

      (mockSupabaseClient.from().single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', status: 'draft', owner_id: 'adv-123' },
        error: null
      });

      // Update mock
      (mockSupabaseClient.from().update as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', status: 'pre_approved' },
        error: null
      });

      await preApproveDraft(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Document successfully generated and pre-approved.',
      }));
    });
  });

  describe('revertDocumentStatus (Revert to Draft)', () => {
    it('should revert a pre-approved document back to draft', async () => {
      mockReq = {
        params: { documentId: 'doc-123' },
        user: { id: 'adv-123', role: 'advisor' }
      } as any;

      // Mock ownership check
      (mockSupabaseClient.from().single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', owner_id: 'adv-123', status: 'pre_approved' },
        error: null
      });

      // Mock update
      (mockSupabaseClient.from().update as jest.Mock).mockResolvedValueOnce({
        data: { id: 'doc-123', status: 'draft' },
        error: null
      });

      await revertPreApproval(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Document reverted to draft successfully.',
      }));
    });

    it('should block reverting if user is not advisor or admin', async () => {
      mockReq = {
        params: { documentId: 'doc-123' },
        user: { id: 'student-123', role: 'student' }
      } as any;

      await revertPreApproval(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Only advisors and admins can revert documents to draft.',
      }));
    });
  });
});
