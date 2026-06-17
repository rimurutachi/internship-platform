import ReportsService from '../../../src/services/reportsService';
import { createClient } from '@supabase/supabase-js';

const mockCreateClient = createClient as jest.Mock;
const supabaseAdmin = mockCreateClient.mock.results[0].value;

jest.mock('../../../src/services/analyticsService', () => ({
  getTrendAnalysis: jest.fn().mockResolvedValue({ status: 'success' }),
}));

describe('ReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should fetch overview stats and calculate completion rate', async () => {
      // Setup mock queries for each table
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ count: 10, error: null })),
      };

      // Mock completion specific count to test math (completed / total * 100)
      const completedQuery = {
        ...mockQuery,
        then: jest.fn((resolve) => resolve({ count: 5, error: null })), // 5 completed
      };
      const totalQuery = {
        ...mockQuery,
        then: jest.fn((resolve) => resolve({ count: 10, error: null })), // 10 total
      };

      supabaseAdmin.from = jest.fn().mockImplementation((table) => {
        if (table === 'users' || table === 'evaluations') return mockQuery;
        if (table === 'internships') {
          // Since getOverview chains .eq('status', '...'), we can just return a query builder 
          // that resolves to some numbers.
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, val) => {
              if (val === 'completed') return completedQuery;
              return mockQuery;
            }),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: totalQuery.then, // Default resolve for total internships
          };
        }
        return mockQuery;
      });

      const result = await ReportsService.getOverview();

      expect(result.total_users).toBe(10);
      expect(result.total_internships).toBe(10);
      expect(result.completed_internships).toBe(5);
      expect(result.completion_rate).toBe(50); // 5/10 = 50%
    });

    it('should throw error if db fails', async () => {
      const errorQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ count: 0, error: { message: 'db error' } })),
      };
      
      supabaseAdmin.from = jest.fn().mockReturnValue(errorQuery);

      await expect(ReportsService.getOverview()).rejects.toThrow('DB error in overview stats');
    });
  });

  describe('generateMonthlyStats', () => {
    it('should generate stats for given number of months', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ count: 5, error: null })),
      };

      supabaseAdmin.from = jest.fn().mockReturnValue(mockQuery);

      const result = await ReportsService.generateMonthlyStats(3); // 3 months

      expect(result).toHaveLength(3);
      expect(result[0].users).toBe(5);
      expect(result[0].internships).toBe(5);
      expect(result[0].evaluations).toBe(5);
    });
  });

  describe('generateInternshipStatus', () => {
    it('should group internships by status and program', async () => {
      const mockInternships = [
        { status: 'active', program_code: 'BSIT' },
        { status: 'completed', program_code: 'BSIT' },
        { status: 'pending', users: { profile_data: { program: 'BSCS' } } },
        { status: 'cancelled', program_code: null, users: null },
      ];

      const queryInternships = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockInternships, error: null })),
      };

      const queryPrograms = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ 
          data: [{ program_code: 'BSIT', program_name: 'Information Tech' }], 
          error: null 
        })),
      };

      supabaseAdmin.from = jest.fn().mockImplementation((table) => {
        if (table === 'internships') return queryInternships;
        if (table === 'program_hours') return queryPrograms;
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), then: jest.fn((res) => res({data: []})) };
      });

      const result = await ReportsService.generateInternshipStatus();

      expect(result.statuses).toEqual(expect.arrayContaining([
        expect.objectContaining({ status: 'active', count: 1 }),
        expect.objectContaining({ status: 'completed', count: 1 }),
        expect.objectContaining({ status: 'pending', count: 1 }),
        expect.objectContaining({ status: 'cancelled', count: 1 }),
      ]));
      
      expect(result.avg_completion_rate).toBe(25); // 1 completed out of 4 = 25%
      expect(result.by_program.length).toBeGreaterThan(0);
    });
  });

  describe('exportReport', () => {
    it('should return JSON format', async () => {
      jest.spyOn(ReportsService, 'getOverview').mockResolvedValue({} as any);
      
      const result = await ReportsService.exportReport('json', ['overview'], null);
      
      expect(typeof result).toBe('string');
      expect(JSON.parse(result as string)).toHaveProperty('overview');
    });

    it('should reject unsupported formats', async () => {
      await expect(
        ReportsService.exportReport('xml', ['overview'], null)
      ).rejects.toThrow('Unsupported format');
    });
  });
});
