import { StudentInternship, StudentEvaluation, ProgressMetrics, AIInsights, DashboardData } from '../types/student';
declare class StudentService {
    /**
     * Calculate internship progress based on start and end dates
     */
    calculateProgress(startDate: string, endDate: string): number;
    /**
     * Calculate detailed progress metrics including phase completion
     */
    calculateProgressMetrics(startDate: string, endDate: string): ProgressMetrics;
    /**
     * Get AI insights from evaluations (aggregated sentiment and features)
     */
    getAIInsights(internshipId: string): Promise<AIInsights | null>;
    /**
     * Check required documents status for an internship
     */
    getRequiredDocumentsStatus(internshipId: string): Promise<{
        moa: any;
        job_description: any;
        weekly_reports: any;
        final_evaluation: any;
    }>;
    /**
     * Get student's current internship with all related data
     */
    getCurrentInternship(studentId: string): Promise<StudentInternship | null>;
    /**
     * Get all evaluations for student's current internship
     */
    getEvaluations(internshipId: string, limit?: number, offset?: number): Promise<{
        evaluations: StudentEvaluation[];
        count: number;
        summary: any;
    }>;
    /**
     * Get dashboard overview data (combined query for efficiency)
     */
    getDashboardData(studentId: string): Promise<DashboardData | null>;
    /**
     * Get skills assessment (aggregated from evaluations)
     */
    getSkillsAssessment(internshipId: string): Promise<{
        skills: {
            name: string;
            rating: number;
            trend: "up" | "down" | "stable";
        }[];
        ai_confidence_score: number;
        last_updated: any;
    }>;
}
declare const _default: StudentService;
export default _default;
//# sourceMappingURL=studentService.d.ts.map