import { EvaluationService } from '../../../src/services/evaluationService';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { emitEvaluationUpdate } from '../../../src/socket/emitters';
import notificationService from '../../../src/services/notificationService';
import { archiveService } from '../../../src/services/archiveService';

const mockCreateClient = createClient as jest.Mock;
// Capture the mock instance created when evaluationService is imported
const supabase = mockCreateClient.mock.results[0].value;

jest.mock('axios');
jest.mock('../../../src/socket/emitters', () => ({
  emitEvaluationUpdate: jest.fn(),
}));
jest.mock('../../../src/services/notificationService', () => ({
  __esModule: true,
  default: {
    createNotification: jest.fn(),
  },
}));
jest.mock('../../../src/services/archiveService', () => ({
  archiveService: {
    checkSupervisorEvaluationCompletion: jest.fn(),
  },
}));
jest.mock('../../../src/utils/gradeUtils', () => ({
  convertScoreToGrade: jest.fn().mockReturnValue(1.5),
}));

describe('EvaluationService', () => {
  let evaluationService: EvaluationService;

  beforeEach(() => {
    jest.clearAllMocks();
    evaluationService = new EvaluationService();
  });

  describe('create', () => {
    it('should throw error if weekly eval lacks week_number', async () => {
      await expect(
        evaluationService.create({ evaluation_type: 'weekly' } as any)
      ).rejects.toThrow('week_number is required for weekly evaluations');
    });

    it('should throw error if non-weekly eval has week_number', async () => {
      await expect(
        evaluationService.create({ evaluation_type: 'final', week_number: 1 } as any)
      ).rejects.toThrow('week_number should only be set for weekly evaluations');
    });

    it('should create evaluation and emit socket event', async () => {
      const mockInternship = { advisor_id: 'a1' };
      const mockEval = { id: 'e1', status: 'draft', internship_id: 'i1' };

      supabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'internships') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockInternship, error: null }),
              }),
            }),
          };
        }
        if (table === 'evaluations') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockEval, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await evaluationService.create({ internship_id: 'i1', evaluation_type: 'final' } as any);

      expect(result).toEqual(mockEval);
      expect(emitEvaluationUpdate).toHaveBeenCalledWith('e1', {
        event: 'evaluation_created',
        evaluation: mockEval,
      });
    });
  });

  describe('getById', () => {
    it('should fetch evaluation by id with relations', async () => {
      const mockData = { id: 'e1' };
      supabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await evaluationService.getById('e1');
      expect(result).toEqual(mockData);
    });
  });

  describe('update', () => {
    it('should throw if evaluation not found', async () => {
      jest.spyOn(evaluationService, 'getById').mockResolvedValue(null);
      await expect(evaluationService.update('e1', {})).rejects.toThrow('Evaluation not found');
    });

    it('should throw if evaluation is not draft', async () => {
      jest.spyOn(evaluationService, 'getById').mockResolvedValue({ status: 'approved' } as any);
      await expect(evaluationService.update('e1', {})).rejects.toThrow('Can only update draft evaluations');
    });

    it('should update evaluation successfully', async () => {
      jest.spyOn(evaluationService, 'getById').mockResolvedValue({ status: 'draft' } as any);
      
      const mockUpdated = { id: 'e1', feedback_text: 'updated' };
      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
            }),
          }),
        }),
      });

      const result = await evaluationService.update('e1', { feedback_text: 'updated' });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('processWithAI', () => {
    it('should call ai service, update DB, and emit event', async () => {
      const mockEval = { id: 'e1', feedback_text: 'Good', rating_overall: 5 };
      jest.spyOn(evaluationService, 'getById').mockResolvedValue(mockEval as any);

      const mockAiResult = { recommended_grade: 1.0, sentiment_scores: {} };
      (axios.post as jest.Mock).mockResolvedValue({ data: mockAiResult });

      const mockUpdated = { id: 'e1', status: 'processed', ...mockAiResult };
      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
            }),
          }),
        }),
      });

      const result = await evaluationService.processWithAI('e1');
      expect(axios.post).toHaveBeenCalled();
      expect(emitEvaluationUpdate).toHaveBeenCalled();
      expect(result.evaluation).toEqual(mockUpdated);
      expect(result.aiResult).toEqual(mockAiResult);
    });
  });

  describe('submit', () => {
    it('should auto-approve, emit event, and notify', async () => {
      const mockEval = { 
        id: 'e1', 
        total_score: 95, 
        evaluation_type: 'final',
        supervisor_id: 'sup1',
        internship: { 
          advisor_id: 'a1', 
          student: { id: 's1', first_name: 'Jane', last_name: 'Doe' } 
        } 
      };
      jest.spyOn(evaluationService, 'getById').mockResolvedValue(mockEval as any);

      const mockUpdated = { id: 'e1', status: 'approved', final_grade: 1.5 };
      supabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
            }),
          }),
        }),
      });

      const result = await evaluationService.submit('e1');
      
      expect(result.evaluation).toEqual(mockUpdated);
      expect(emitEvaluationUpdate).toHaveBeenCalledWith('e1', {
        event: 'evaluation_approved',
        evaluation: mockUpdated,
      });
      // Advisor notification
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'a1', type: 'evaluation_submitted' })
      );
      // Student notification
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 's1', type: 'evaluation_approved' })
      );
      // Archive check
      expect(archiveService.checkSupervisorEvaluationCompletion).toHaveBeenCalledWith('sup1');
    });
  });

  describe('getBySupervisor', () => {
    it('should fetch evaluations filtered by supervisor and status', async () => {
      const mockData = [{ id: 'e1' }];
      
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null })),
      };

      supabase.from = jest.fn().mockReturnValue(queryBuilder);

      const result = await evaluationService.getBySupervisor('sup1', 'draft');
      
      expect(supabase.from).toHaveBeenCalledWith('evaluations');
      expect(queryBuilder.eq).toHaveBeenCalledWith('supervisor_id', 'sup1');
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'draft');
      expect(result).toEqual(mockData);
    });
  });
});
