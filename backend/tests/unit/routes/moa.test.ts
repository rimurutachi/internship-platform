import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import moaRouter, { isMOARequirement } from '../../../src/routes/admin/moa';

const mockCreateClient = createClient as jest.Mock;
const supabase = mockCreateClient.mock.results[0].value;

function createMockResponse() {
  const res: Partial<Response> & { statusCode: number; body: any } = {
    statusCode: 200,
    body: undefined,
  };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn((payload: any) => {
    res.body = payload;
    return res as Response;
  });
  return res;
}

async function invokeRoute(method: 'get', path: string, query: Record<string, any> = {}) {
  const layer = moaRouter.stack.find(
    (entry: any) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer || !layer.route) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  const handler = layer.route.stack[0].handle;
  const req: any = { query, params: {} };
  const res = createMockResponse();
  await handler(req, res as unknown as Response, jest.fn());
  return res;
}

describe('Admin MOA Route & Requirement Matching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isMOARequirement', () => {
    it('matches valid Memorandum of Agreement / MOA titles', () => {
      expect(isMOARequirement('Memorandum of Agreement')).toBe(true);
      expect(isMOARequirement('Memorandum of Agreement (MOA)')).toBe(true);
      expect(isMOARequirement('Memoramdum of Agreement')).toBe(true);
      expect(isMOARequirement('MOA')).toBe(true);
      expect(isMOARequirement('Signed & Notarized MOA')).toBe(true);
      expect(isMOARequirement('OJT M.O.A.')).toBe(true);
      expect(isMOARequirement('M.O.A - BSCS')).toBe(true);
    });

    it('excludes non-MOA documents such as waivers and general agreements', () => {
      expect(isMOARequirement('Trainee-Industry Agreement Liability Waiver')).toBe(false);
      expect(isMOARequirement('Parent Certification of Waiver of OJT Practicum')).toBe(false);
      expect(isMOARequirement('Confidentiality Agreement')).toBe(false);
      expect(isMOARequirement('Non-Disclosure Agreement')).toBe(false);
      expect(isMOARequirement('Training Agreement')).toBe(false);
      expect(isMOARequirement('Memorandum of Understanding')).toBe(false);
      expect(isMOARequirement('OJT Placement Form')).toBe(false);
      expect(isMOARequirement('Samoa Form')).toBe(false);
      expect(isMOARequirement('')).toBe(false);
    });
  });

  describe('GET /submissions and /stats', () => {
    const mockRequirements = [
      { id: 'req-moa', title: 'Memorandum of Agreement' },
      { id: 'req-mou', title: 'Memorandum of Understanding' },
    ];

    const mockSubmissions = [
      {
        id: 'sub-1',
        requirement_id: 'req-moa',
        student_id: 'stu-1',
        file_url: 'stu-1/req-moa/moa.pdf',
        file_name: 'Idioma_MOA.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        version: 2,
        status: 'approved',
        feedback: null,
        reviewed_at: '2026-11-10T00:00:00Z',
        submitted_at: '2026-11-09T00:00:00Z',
        created_at: '2026-11-09T00:00:00Z',
      },
      {
        id: 'sub-1-old',
        requirement_id: 'req-moa',
        student_id: 'stu-1',
        file_url: 'stu-1/req-moa/moa-v1.pdf',
        file_name: 'Idioma_MOA_v1.pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
        version: 1,
        status: 'approved',
        feedback: null,
        reviewed_at: '2026-11-05T00:00:00Z',
        submitted_at: '2026-11-04T00:00:00Z',
        created_at: '2026-11-04T00:00:00Z',
      },
    ];

    const mockStudents = [
      {
        id: 'stu-1',
        first_name: 'Jimmar',
        last_name: 'Idioma',
        email: 'bc.jimmar.idioma@cvsu.edu.ph',
        name: 'Jimmar Idioma',
        year_level: '3rd Year',
        profile_data: { program: 'BSCS', section: '3-5' },
      },
    ];

    function setupSupabaseMock(allSubsForStats: any[]) {
      supabase.from = jest.fn((table: string) => {
        if (table === 'document_requirements') {
          return {
            select: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({ data: mockRequirements, error: null }),
            }),
          };
        }
        if (table === 'document_submissions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: mockSubmissions, error: null }),
                }),
              }),
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: allSubsForStats, error: null }),
              }),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({ data: mockStudents, error: null }),
            }),
          };
        }
        return {};
      });
    }

    it('returns only true MOA requirements and deduplicates approved submissions', async () => {
      setupSupabaseMock(mockSubmissions);

      const res = await invokeRoute('get', '/submissions');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requirements).toEqual([{ id: 'req-moa', title: 'Memorandum of Agreement' }]);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('sub-1');
      expect(res.body.data[0].student_program).toBe('BSCS');
      expect(res.body.data[0].student_section).toBe('3-5');
    });

    it('returns consistent deduplicated counts in /stats', async () => {
      setupSupabaseMock([
        ...mockSubmissions,
        {
          id: 'sub-2-pending',
          requirement_id: 'req-moa',
          student_id: 'stu-2',
          status: 'pending',
          submitted_at: '2026-11-11T00:00:00Z',
        },
      ]);

      const res = await invokeRoute('get', '/stats');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        total_requirements: 1,
        total_approved: 1,
        total_pending: 1,
        total_rejected: 0,
        total_revision_requested: 0,
        by_program: { BSCS: 1 },
      });
    });
  });
});
