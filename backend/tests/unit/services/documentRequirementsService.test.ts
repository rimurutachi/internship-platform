import { documentRequirementsService, DocumentRequirementsService } from '../../../src/services/documentRequirementsService';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../../../src/services/notificationService';

const mockCreateClient = createClient as jest.Mock;
const supabase = mockCreateClient.mock.results[0].value;

jest.mock('../../../src/services/notificationService', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      createNotification: jest.fn(),
    })),
  };
});

describe('DocumentRequirementsService', () => {
  let service: DocumentRequirementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentRequirementsService();
  });

  describe('createRequirement', () => {
    it('should create requirement and notify students', async () => {
      const mockAdvisor = { profile_data: { university_id: 'u1' } };
      const mockRequirement = { id: 'req1', title: 'Test Req', created_by: 'adv1', target_audience: 'all_students' };
      
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAdvisor, error: null }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockRequirement, error: null }),
        }),
      });

      // Mocks for notifyStudentsAboutRequirement
      const internshipsSelect = {
        eq: jest.fn().mockReturnValue({
          neq: jest.fn().mockResolvedValue({ data: [{ student_id: 's1' }] }),
        }),
      };
      
      const profileSelect = {
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((res) => res({ data: [{ id: 's2' }] })),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'users') return { select: selectMock };
        if (table === 'document_requirements') return { insert: insertMock };
        if (table === 'internships') return { select: jest.fn().mockReturnValue(internshipsSelect) };
        return { select: jest.fn().mockReturnValue(profileSelect) };
      });

      // Since profileSelect eq returns itself, we need to handle the chaining
      profileSelect.eq = jest.fn().mockReturnThis();
      profileSelect.then = jest.fn((res) => res({ data: [{ id: 's2' }] }));

      // Fix users table select for the second call
      const usersSelectMock = jest.fn().mockImplementation((cols) => {
        if (cols === 'id, profile_data') {
           return {
             eq: jest.fn().mockReturnValue({
               single: jest.fn().mockResolvedValue({ data: mockAdvisor, error: null }),
             })
           }
        }
        return profileSelect;
      });

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'users') return { select: usersSelectMock };
        if (table === 'document_requirements') return { insert: insertMock };
        if (table === 'internships') return { select: jest.fn().mockReturnValue(internshipsSelect) };
        return {};
      });


      const result = await service.createRequirement('adv1', {
        title: 'Test Req',
        target_audience: 'all_students'
      });

      expect(result).toEqual(mockRequirement);
      expect(insertMock).toHaveBeenCalled();
    });
  });

  describe('getAdvisorRequirements', () => {
    it('should fetch requirements and stats', async () => {
      const mockReqs = [{ id: 'req1' }];
      const queryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockReqs, error: null, count: 1 }),
      };

      const submissionsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ status: 'approved' }] }),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'document_requirements') return queryMock;
        if (table === 'document_submissions') return submissionsMock;
        return {};
      });

      const result = await service.getAdvisorRequirements('adv1');

      expect(result.total).toBe(1);
      expect(result.requirements[0].submission_stats?.approved).toBe(1);
    });
  });

  describe('getRequirementById', () => {
    it('should fetch requirement and check student access', async () => {
      const mockReq = { id: 'req1', created_by: 'adv1' };
      
      const reqQueryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReq, error: null }),
      };

      const internshipQueryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'int1' }, error: null }),
      };

      const submissionsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [] }),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'document_requirements') return reqQueryMock;
        if (table === 'internships') return internshipQueryMock;
        if (table === 'document_submissions') return submissionsMock;
        return {};
      });

      const result = await service.getRequirementById('req1', 's1', 'student');
      expect(result).toBeDefined();
      expect(result?.id).toBe('req1');
    });

    it('should deny access if student is not assigned to creator', async () => {
      const mockReq = { id: 'req1', created_by: 'adv2' };
      
      const reqQueryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReq, error: null }),
      };

      const internshipQueryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }), // No internship
      };

      const profileMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { profile_data: { assigned_advisor_id: 'adv1' } }, error: null }),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'document_requirements') return reqQueryMock;
        if (table === 'internships') return internshipQueryMock;
        if (table === 'users') return profileMock;
        return {};
      });

      await expect(service.getRequirementById('req1', 's1', 'student')).rejects.toThrow('Access denied - this requirement is not assigned to you');
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement successfully', async () => {
      const checkMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'req1', created_by: 'adv1' }, error: null }),
      };

      const updateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'req1', title: 'New' }, error: null }),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'document_requirements') {
          return {
            select: jest.fn().mockReturnValue(checkMock),
            update: jest.fn().mockReturnValue(updateMock),
          };
        }
        return {};
      });

      const result = await service.updateRequirement('req1', 'adv1', { title: 'New' });
      expect(result.title).toBe('New');
    });

    it('should throw if not owner', async () => {
      const checkMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'req1', created_by: 'adv2' }, error: null }),
      };

      supabase.from = jest.fn().mockImplementation(() => ({ select: jest.fn().mockReturnValue(checkMock) }));

      await expect(service.updateRequirement('req1', 'adv1', {})).rejects.toThrow('You can only update your own requirements');
    });
  });

  describe('deleteRequirement', () => {
    it('should soft delete requirement', async () => {
      const checkMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'req1', created_by: 'adv1' }, error: null }),
      };

      const updateMock = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockUpdateFn = jest.fn().mockReturnValue(updateMock);

      supabase.from = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnValue(checkMock),
        update: mockUpdateFn,
      }));

      await expect(service.deleteRequirement('req1', 'adv1')).resolves.not.toThrow();
      expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'archived' }));
    });
  });

  describe('getStudentRequirements', () => {
    it('should fetch requirements for a student based on their advisors', async () => {
      // Setup mock internships
      const internshipsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockResolvedValue({ data: [{ id: 'int1', advisor_id: 'adv1' }] }),
      };

      // Setup requirements fetch
      const reqsMock = [{ id: 'req1', target_audience: 'all_students' }];
      const queryMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: reqsMock, error: null, count: 1 }),
      };

      // Setup submissions fetch
      const submissionsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { status: 'approved' } }),
      };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'internships') return internshipsMock;
        if (table === 'document_requirements') return queryMock;
        if (table === 'document_submissions') return submissionsMock;
        return {};
      });

      const result = await service.getStudentRequirements('s1');

      expect(result.total).toBe(1);
      expect(result.requirements[0].submission_status).toBe('approved');
    });
  });
});
