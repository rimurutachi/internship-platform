/**
 * Grade Conversion Utilities
 * 
 * Handles conversion of total scores (0-70) to CvSU grade scale (1.0-5.0)
 */

/**
 * Convert total score (0-70) to CvSU grade equivalent (1.0-5.0)
 * 
 * CvSU Grade Scale:
 * - 67-70 → 1.0 (Excellent)
 * - 63-66 → 1.25
 * - 59-62 → 1.5
 * - 54-58 → 1.75
 * - 50-53 → 2.0 (Good)
 * - 45-49 → 2.25
 * - 41-44 → 2.5
 * - 36-40 → 2.75
 * - 32-35 → 3.0 (Fair)
 * - 28-31 → 4.0 (Poor)
 * - 18-27 → 4.0
 * - 1-17 → 5.0 (Failing)
 */
export function convertScoreToGrade(totalScore: number): number {
  const score = Math.round(totalScore);

  if (score >= 67 && score <= 70) return 1.0;
  if (score >= 63 && score <= 66) return 1.25;
  if (score >= 59 && score <= 62) return 1.5;
  if (score >= 54 && score <= 58) return 1.75;
  if (score >= 50 && score <= 53) return 2.0;
  if (score >= 45 && score <= 49) return 2.25;
  if (score >= 41 && score <= 44) return 2.5;
  if (score >= 36 && score <= 40) return 2.75;
  if (score >= 32 && score <= 35) return 3.0;
  if (score >= 28 && score <= 31) return 4.0;
  if (score >= 18 && score <= 27) return 4.0;
  if (score >= 1 && score <= 17) return 5.0;

  // Out of range handling
  if (score > 70) return 1.0;
  if (score < 1) return 5.0;

  return 5.0; // Default to failing if invalid
}

/**
 * Get grade description for display
 */
export function getGradeDescription(grade: number): string {
  if (grade === 1.0) return 'Excellent';
  if (grade >= 1.25 && grade <= 1.75) return 'Very Good';
  if (grade >= 2.0 && grade <= 2.75) return 'Good';
  if (grade === 3.0) return 'Fair';
  if (grade === 4.0) return 'Poor';
  if (grade === 5.0) return 'Failing';
  return 'Unknown';
}

/**
 * Get grade color for visual feedback
 */
export function getGradeColor(grade: number): string {
  if (grade <= 1.75) return 'text-green-600 dark:text-green-400'; // Excellent to Very Good
  if (grade <= 2.75) return 'text-blue-600 dark:text-blue-400'; // Good
  if (grade <= 3.0) return 'text-yellow-600 dark:text-yellow-400'; // Fair
  if (grade <= 4.0) return 'text-orange-600 dark:text-orange-400'; // Poor
  return 'text-red-600 dark:text-red-400'; // Failing
}

/**
 * Get badge variant for grade
 */
export function getGradeBadgeVariant(
  grade: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (grade <= 1.75) return 'default'; // Excellent/Very Good
  if (grade <= 2.75) return 'secondary'; // Good
  if (grade <= 3.0) return 'outline'; // Fair
  return 'destructive'; // Poor/Failing
}
