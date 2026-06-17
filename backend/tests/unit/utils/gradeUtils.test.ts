import { convertScoreToGrade, getGradeDescription } from '../../../src/utils/gradeUtils';

describe('Grade Utilities', () => {
  describe('convertScoreToGrade', () => {
    it('should return 1.0 for scores 67-70 (Excellent)', () => {
      expect(convertScoreToGrade(67)).toBe(1.0);
      expect(convertScoreToGrade(70)).toBe(1.0);
      expect(convertScoreToGrade(68)).toBe(1.0);
    });

    it('should return 1.25 for scores 63-66', () => {
      expect(convertScoreToGrade(63)).toBe(1.25);
      expect(convertScoreToGrade(66)).toBe(1.25);
    });

    it('should return 1.5 for scores 59-62', () => {
      expect(convertScoreToGrade(59)).toBe(1.5);
      expect(convertScoreToGrade(62)).toBe(1.5);
    });

    it('should return 1.75 for scores 54-58', () => {
      expect(convertScoreToGrade(54)).toBe(1.75);
      expect(convertScoreToGrade(58)).toBe(1.75);
    });

    it('should return 2.0 for scores 50-53 (Good)', () => {
      expect(convertScoreToGrade(50)).toBe(2.0);
      expect(convertScoreToGrade(53)).toBe(2.0);
    });

    it('should return 2.25 for scores 45-49', () => {
      expect(convertScoreToGrade(45)).toBe(2.25);
      expect(convertScoreToGrade(49)).toBe(2.25);
    });

    it('should return 2.5 for scores 41-44', () => {
      expect(convertScoreToGrade(41)).toBe(2.5);
      expect(convertScoreToGrade(44)).toBe(2.5);
    });

    it('should return 2.75 for scores 36-40', () => {
      expect(convertScoreToGrade(36)).toBe(2.75);
      expect(convertScoreToGrade(40)).toBe(2.75);
    });

    it('should return 3.0 for scores 32-35 (Fair)', () => {
      expect(convertScoreToGrade(32)).toBe(3.0);
      expect(convertScoreToGrade(35)).toBe(3.0);
    });

    it('should return 4.0 for scores 18-31 (Poor)', () => {
      expect(convertScoreToGrade(18)).toBe(4.0);
      expect(convertScoreToGrade(27)).toBe(4.0);
      expect(convertScoreToGrade(28)).toBe(4.0);
      expect(convertScoreToGrade(31)).toBe(4.0);
    });

    it('should return 5.0 for scores 1-17 (Failing)', () => {
      expect(convertScoreToGrade(1)).toBe(5.0);
      expect(convertScoreToGrade(17)).toBe(5.0);
    });

    it('should handle out-of-range: score > 70 returns 1.0', () => {
      expect(convertScoreToGrade(100)).toBe(1.0);
      expect(convertScoreToGrade(71)).toBe(1.0);
    });

    it('should handle out-of-range: score < 1 returns 5.0', () => {
      expect(convertScoreToGrade(0)).toBe(5.0);
      expect(convertScoreToGrade(-5)).toBe(5.0);
    });

    it('should round decimal scores before grading', () => {
      // 66.7 rounds to 67 → 1.0
      expect(convertScoreToGrade(66.7)).toBe(1.0);
      // 66.4 rounds to 66 → 1.25
      expect(convertScoreToGrade(66.4)).toBe(1.25);
    });
  });

  describe('getGradeDescription', () => {
    it('should return "Excellent" for grade 1.0', () => {
      expect(getGradeDescription(1.0)).toBe('Excellent');
    });

    it('should return "Very Good" for grades 1.25-1.75', () => {
      expect(getGradeDescription(1.25)).toBe('Very Good');
      expect(getGradeDescription(1.5)).toBe('Very Good');
      expect(getGradeDescription(1.75)).toBe('Very Good');
    });

    it('should return "Good" for grades 2.0-2.75', () => {
      expect(getGradeDescription(2.0)).toBe('Good');
      expect(getGradeDescription(2.5)).toBe('Good');
      expect(getGradeDescription(2.75)).toBe('Good');
    });

    it('should return "Fair" for grade 3.0', () => {
      expect(getGradeDescription(3.0)).toBe('Fair');
    });

    it('should return "Poor" for grade 4.0', () => {
      expect(getGradeDescription(4.0)).toBe('Poor');
    });

    it('should return "Failing" for grade 5.0', () => {
      expect(getGradeDescription(5.0)).toBe('Failing');
    });

    it('should return "Unknown" for unrecognized grades', () => {
      expect(getGradeDescription(3.5)).toBe('Unknown');
      expect(getGradeDescription(6.0)).toBe('Unknown');
    });
  });
});
