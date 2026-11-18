import { createClient } from '@supabase/supabase-js';
import { createDailyReport } from '../../../src/services/dailyReportsService';

const mockCreateClient = createClient as jest.Mock;
const supabase = mockCreateClient.mock.results[mockCreateClient.mock.results.length - 1]?.value;

describe('dailyReportsService - Date Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject a report date that is before the internship start date', async () => {
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
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

    const result = await createDailyReport('student-1', {
      internship_id: 'intern-123',
      report_date: '2025-07-28', // 1 day before start
      activities: 'Participated in orientation and setup',
      hours_worked: 8,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Report date cannot be before the internship start date');
  });

  it('should ALLOW a report date that is beyond the projected end_date (e.g. extension due to absences)', async () => {
    const insertedReports: any[] = [];

    const selectInternshipMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
              start_date: '2025-07-29',
              end_date: '2025-09-08', // Initial projected end date
              status: 'active',
            },
            error: null,
          }),
        }),
      }),
    });

    const insertMock = jest.fn().mockImplementation((payload: any) => ({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockImplementation(() => {
          insertedReports.push(payload);
          return Promise.resolve({
            data: { id: 'report-999', ...payload },
            error: null,
          });
        }),
      }),
    }));

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === 'internships') {
        return { select: selectInternshipMock };
      }
      if (table === 'student_daily_reports') {
        return { insert: insertMock };
      }
      return {};
    });

    // Student logs September 9, 2025 (which is 1 day past projected end_date 2025-09-08)
    const result = await createDailyReport('student-1', {
      internship_id: 'intern-123',
      report_date: '2025-09-09',
      activities: 'Assisted IT team with fixing network and door locks',
      hours_worked: 8,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.report_date).toBe('2025-09-09');
    expect(insertedReports.length).toBe(1);
  });

  it('should reject a report for future dates', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDateString = futureDate.toISOString().split('T')[0];

    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'intern-123',
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

    const result = await createDailyReport('student-1', {
      internship_id: 'intern-123',
      report_date: futureDateString,
      activities: 'This is in the future and should fail',
      hours_worked: 8,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot submit a report for a future date');
  });
});
