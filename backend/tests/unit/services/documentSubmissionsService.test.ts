import { DocumentSubmissionsService } from '../../../src/services/documentSubmissionsService';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Get the mocked supabase client
const supabase = createClient('mock', 'mock');

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
  const setupSupabaseMocks = () => {
    const reqSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: mockReqId, target_audience: 'all_students', metadata: {}, status: 'active', title: 'Test Req', created_by: 'adv-123' },
            error: null
          })
        })
      })
    });

    const versionSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [{ version: 1 }], error: null })
          })
        })
      })
    });

    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'sub-123', status: 'pending' },
          error: null
        })
      })
    });

    const genericQuery = (table: string) => {
      if (table === 'document_requirements') return { select: reqSelect };
      if (table === 'document_submissions') {
        return { select: versionSelect, insert: insertMock };
      }
      return { select: jest.fn().mockReturnThis() };
    };
    supabase.from = jest.fn().mockImplementation(genericQuery);

    supabase.storage = {
      from: jest.fn().mockReturnValue({
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'http://test-signed-url.com' },
          error: null
        })
      })
    } as any;

    // We also need to mock `isStudentTargeted` because it's a private method used in submitDocument
    jest.spyOn(service as any, 'isStudentTargeted').mockReturnValue(true);
    jest.spyOn(service as any, 'notifyAdvisorAboutSubmission').mockResolvedValue(undefined);

    return insertMock;
  };

  it('should call runAiSignatureScan and succeed when AI detects a signature on PDF', async () => {
    const insertMock = setupSupabaseMocks();

    mockedAxios.post.mockResolvedValueOnce({
      data: { has_signature: true, confidence_score: 0.95 }
    });

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/path.pdf',
      file_name: 'test.pdf',
      file_size: 1000,
      mime_type: 'application/pdf'
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/scan-signatures'),
      expect.objectContaining({ file_url: 'http://test-signed-url.com' })
    );

    // Verify metadata was updated with the ai result
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({
      ai_scan_result: { has_signature: true, confidence_score: 0.95 }
    });
  });

  it('should throw an error and block submission when AI detects NO signature', async () => {
    setupSupabaseMocks();

    mockedAxios.post.mockResolvedValueOnce({
      data: { has_signature: false, confidence_score: 0.1 }
    });

    await expect(service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/path.pdf',
      file_name: 'test.pdf',
      file_size: 1000,
      mime_type: 'application/pdf'
    })).rejects.toThrow('AI Signature Verification Failed: No handwritten signatures detected on the document.');
    
    // It should have called the AI service
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should skip AI scanning if the file is not a PDF or Image (e.g., DOCX)', async () => {
    const insertMock = setupSupabaseMocks();

    await service.submitDocument(mockStudentId, {
      requirement_id: mockReqId,
      file_url: 'test/path.docx',
      file_name: 'test.docx',
      file_size: 1000,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // Axios should NOT be called
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // Verify metadata is empty object
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs.metadata).toEqual({});
  });
});
