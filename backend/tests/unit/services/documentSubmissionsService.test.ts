import { DocumentSubmissionsService } from '../../../src/services/documentSubmissionsService';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const mockCreateClient = createClient as jest.Mock;
// Capture all supabase instances created on file load before clearAllMocks wipes results
const capturedClients = mockCreateClient.mock.results.map((r) => r.value).filter(Boolean);

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../../src/services/notificationService', () => {
  return {
    __esModule: true,
    default: {
      createNotification: jest.fn(),
    },
    NotificationService: jest.fn().mockImplementation(() => ({
      createNotification: jest.fn(),
    })),
  };
});

describe('DocumentSubmissionsService - AI Signature Scan', () => {
  let service: DocumentSubmissionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentSubmissionsService();
  });

  const mockReqId = 'req-123';
  const mockStudentId = 'student-123';

  // Helper to setup supabase mocks for submitDocument
  const setupSupabaseMocks = (requirementOverrides: Partial<any> = {}) => {
    const requirementData = {
      id: mockReqId,
      target_audience: 'all_students',
      metadata: {},
      status: 'active',
      title: 'Memorandum of Agreement (MOA)',
      created_by: 'adv-123',
      ...requirementOverrides,
    };

    const reqChain: any = {};
    reqChain.eq = jest.fn().mockReturnValue(reqChain);
    reqChain.single = jest.fn().mockResolvedValue({
      data: requirementData,
      error: null,
    });

    const versionChain: any = {};
    versionChain.eq = jest.fn().mockReturnValue(versionChain);
    versionChain.order = jest.fn().mockReturnValue(versionChain);
    versionChain.limit = jest.fn().mockResolvedValue({
      data: [{ version: 1 }],
      error: null,
    });

    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'sub-123', status: 'pending' },
          error: null,
        }),
      }),
    });

    const genericQuery = (table: string) => {
      if (table === 'document_requirements') {
        return { select: jest.fn().mockReturnValue(reqChain) };
      }
      if (table === 'document_submissions') {
        return {
          select: jest.fn().mockReturnValue(versionChain),
          insert: insertMock,
        };
      }
      return { select: jest.fn().mockReturnThis() };
    };

    capturedClients.forEach((client) => {
      client.from = jest.fn().mockImplementation(genericQuery);
      client.storage = {
        from: jest.fn().mockReturnValue({
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: 'http://test-signed-url.com' },
            error: null,
          }),
        }),
      };
    });

    // Mock private methods used in submitDocument
    jest.spyOn(service as any, 'isStudentTargeted').mockReturnValue(true);
    jest.spyOn(service as any, 'notifyAdvisorAboutSubmission').mockResolvedValue(undefined);

    return insertMock;
  };

  it('should call runAiSignatureScan and succeed when AI detects a signature on PDF', async () => {
    const insertMock = setupSupabaseMocks({ title: 'Memorandum of Agreement (MOA)' });

    mockedAxios.post.mockResolvedValueOnce({
      data: { has_signature: true, confidence_score: 0.95 },
    });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/path.pdf',
      file_name: 'test.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/scan-signatures'),
      expect.objectContaining({ file_url: 'http://test-signed-url.com' })
    );

    // Verify metadata was updated with the ai result
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({
      ai_scan_result: { has_signature: true, confidence_score: 0.95 },
    });
  });

  it('should throw an error and block submission when AI detects NO signature on required documents', async () => {
    setupSupabaseMocks({ title: 'Memorandum of Agreement (MOA)' });

    mockedAxios.post.mockResolvedValueOnce({
      data: { has_signature: false, confidence_score: 0.1 },
    });

    await expect(
      service.submitDocument(mockStudentId, {
        requirement_id: mockReqId,
        file_url: 'test/path.pdf',
        file_name: 'test.pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
      })
    ).rejects.toThrow('AI Signature Verification Failed: No handwritten signatures detected on the document.');

    // It should have called the AI service
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should skip AI scanning if the file is not a PDF or Image (e.g., DOCX)', async () => {
    const insertMock = setupSupabaseMocks({ title: 'Memorandum of Agreement (MOA)' });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/path.docx',
      file_name: 'test.docx',
      file_size: 1000,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Axios should NOT be called
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // Verify metadata is empty object
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });

  it('should skip AI scanning for Updated Resume even if file is PDF', async () => {
    const insertMock = setupSupabaseMocks({ title: 'Updated Resume' });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/resume.pdf',
      file_name: 'resume.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    // Axios should NOT be called
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // Submission succeeded without AI signature scan
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });

  it('should skip AI scanning for Narrative Report even if file is PDF', async () => {
    const insertMock = setupSupabaseMocks({ title: 'Final Narrative Report' });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/narrative_report.pdf',
      file_name: 'narrative_report.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    // Axios should NOT be called
    expect(mockedAxios.post).not.toHaveBeenCalled();

    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });

  it('should skip AI scanning for Job Description even if file is PDF', async () => {
    const insertMock = setupSupabaseMocks({ title: 'Approved Job Description' });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/job_description.pdf',
      file_name: 'job_description.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    // Axios should NOT be called
    expect(mockedAxios.post).not.toHaveBeenCalled();

    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });

  it('should respect metadata.requires_signature = false override even for MOA', async () => {
    const insertMock = setupSupabaseMocks({
      title: 'Memorandum of Agreement',
      metadata: { requires_signature: false },
    });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/moa.pdf',
      file_name: 'moa.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    // Axios should NOT be called because requires_signature is explicitly false
    expect(mockedAxios.post).not.toHaveBeenCalled();

    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });

  it('should respect metadata.requires_signature = true override even for Resume', async () => {
    setupSupabaseMocks({
      title: 'Signed Resume Copy',
      metadata: { requires_signature: true },
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: { has_signature: true, confidence_score: 0.99 },
    });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/signed_resume.pdf',
      file_name: 'signed_resume.pdf',
      file_size: 1000,
      mime_type: 'application/pdf',
    });

    // Axios should be called because requires_signature is explicitly true
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
