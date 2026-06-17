import { EvaluationServiceFacade } from '../../../src/services/evaluation.service';

// Mock the inner services with proper return values
jest.mock('../../../src/services/evaluationService');
jest.mock('../../../src/services/evaluationsService', () => {
  return {
    EvaluationsService: jest.fn().mockImplementation(() => ({
      calculateAverageRating: jest.fn((evaluation: any) => {
        // Replicate the real logic: average all rating_* fields
        const ratings = [
          evaluation.rating_overall,
          evaluation.rating_technical,
          evaluation.rating_communication,
          evaluation.rating_work_ethic,
        ].filter((r: any): r is number => r !== null && r !== undefined);

        if (ratings.length === 0) return 0;
        return parseFloat(
          (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2)
        );
      }),
      formatAIResults: jest.fn((evaluation: any) => ({
        sentiment_analysis: evaluation.sentiment_scores || {},
        features: evaluation.lit_features || [],
        recommended_grade: evaluation.recommended_grade || null,
        confidence_score: evaluation.confidence_score || 0,
        bias_check_passed: evaluation.bias_check_passed || false,
      })),
      isReadyForApproval: jest.fn((evaluation: any) => {
        return (
          evaluation.status === 'processed' &&
          evaluation.bias_check_passed === true &&
          (evaluation.recommended_grade !== null || evaluation.final_grade !== null)
        );
      }),
      getQualityMetrics: jest.fn().mockResolvedValue({ total: 0, on_draft: 0, submitted: 0, approved: 0 }),
      getMetricsBySupervisor: jest.fn().mockResolvedValue([]),
      getMetricsByCompany: jest.fn().mockResolvedValue([]),
      exportEvaluations: jest.fn().mockResolvedValue('[]'),
      generateQualityReport: jest.fn().mockResolvedValue({ total: 0 }),
    })),
  };
});

describe('EvaluationServiceFacade', () => {
  let facade: EvaluationServiceFacade;

  beforeEach(() => {
    facade = new EvaluationServiceFacade();
  });

  describe('calculateAverageRating', () => {
    it('should return the average of all rating fields', () => {
      const mockEval = {
        rating_overall: 8,
        rating_technical: 6,
        rating_communication: 7,
        rating_work_ethic: 9,
      };
      const result = facade.calculateAverageRating(mockEval);
      expect(typeof result).toBe('number');
      expect(result).toBe(7.5);
    });

    it('should return 0 when no ratings are provided', () => {
      const mockEval = {};
      const result = facade.calculateAverageRating(mockEval);
      expect(result).toBe(0);
    });

    it('should ignore null/undefined ratings', () => {
      const mockEval = {
        rating_overall: 10,
        rating_technical: null,
        rating_communication: undefined,
        rating_work_ethic: 8,
      };
      const result = facade.calculateAverageRating(mockEval);
      expect(typeof result).toBe('number');
      expect(result).toBe(9);
    });
  });

  describe('isReadyForApproval', () => {
    it('should return true when evaluation is processed with bias check passed and has grade', () => {
      const mockEval = {
        status: 'processed',
        bias_check_passed: true,
        recommended_grade: 85,
      };
      const result = facade.isReadyForApproval(mockEval);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should return false when evaluation is only submitted', () => {
      const mockEval = {
        status: 'submitted',
        bias_check_passed: true,
        recommended_grade: 85,
      };
      const result = facade.isReadyForApproval(mockEval);
      expect(result).toBe(false);
    });

    it('should return false when bias check has not passed', () => {
      const mockEval = {
        status: 'processed',
        bias_check_passed: false,
        recommended_grade: 85,
      };
      const result = facade.isReadyForApproval(mockEval);
      expect(result).toBe(false);
    });

    it('should return false when no grade is available', () => {
      const mockEval = {
        status: 'processed',
        bias_check_passed: true,
        recommended_grade: null,
        final_grade: null,
      };
      const result = facade.isReadyForApproval(mockEval);
      expect(result).toBe(false);
    });
  });
});
