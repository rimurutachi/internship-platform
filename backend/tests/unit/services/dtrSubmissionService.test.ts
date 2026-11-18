import { createClient } from '@supabase/supabase-js';
import { dtrSubmissionService } from '../../../src/services/dtrSubmissionService';

const mockCreateClient = createClient as jest.Mock;
const supabase = mockCreateClient.mock.results[mockCreateClient.mock.results.length - 1]?.value;

describe('dtrSubmissionService - Date Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject a week_start_date that is before the internship start date', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
              student_id: 'student-1',
              advisor_id: 'advisor-1',
              start_date: '2025-07-29',
              end_date: '2025-09-08',
              status: 'active',
            },
            error: null,
          }),
        }),
      }),
    });

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: selectMock };
      }
      return {};
    });

    await expect(
      dtrSubmissionService.submitDTR('student-1', {
        internship_id: 'intern-123',
        week_number: 1,
        week_start_date: '2025-07-20', // Before July 29 start
        week_end_date: '2025-07-25',
        file_url: 'http://example.com/dtr1.pdf',
        file_name: 'dtr1.pdf',
      })
    ).rejects.toThrow('Week start date cannot be before the internship start date');
  });

  it('should ALLOW a week_end_date that is beyond the initial projected end_date (extension week)', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
              student_id: 'student-1',
              advisor_id: 'advisor-1',
              start_date: '2025-07-29',
              end_date: '2025-09-08', // Initial projected end date
              status: 'active',
            },
            error: null,
          }),
        }),
      }),
    });

    const existingDTRMock = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'dtr-777',
              internship_id: 'intern-123',
              student_id: 'student-1',
              week_number: 7,
              week_start_date: '2025-09-08',
              week_end_date: '2025-09-15', // Past September 8
              status: 'pending',
            },
            error: null,
          }),
        }),
      }),
    };

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: selectMock };
      }
      if (table === 'weekly_dtr_submissions') {
        return existingDTRMock;
      }
      return {};
    });

    const result = await dtrSubmissionService.submitDTR('student-1', {
      internship_id: 'intern-123',
      week_number: 7,
      week_start_date: '2025-09-08',
      week_end_date: '2025-09-15', // Extension week
      file_url: 'http://example.com/dtr7.pdf',
      file_name: 'dtr7.pdf',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('dtr-777');
    expect(result.week_end_date).toBe('2025-09-15');
  });

  it('should reject when week_end_date is before week_start_date', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
              student_id: 'student-1',
              advisor_id: 'advisor-1',
              start_date: '2025-07-29',
              end_date: '2025-09-08',
              status: 'active',
            },
            error: null,
          }),
        }),
      }),
    });

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: selectMock };
      }
      return {};
    });

    await expect(
      dtrSubmissionService.submitDTR('student-1', {
        internship_id: 'intern-123',
        week_number: 2,
        week_start_date: '2025-08-10',
        week_end_date: '2025-08-05', // End is before start
        file_url: 'http://example.com/dtr2.pdf',
        file_name: 'dtr2.pdf',
      })
    ).rejects.toThrow('Week end date must be after week start date');
  });
});
