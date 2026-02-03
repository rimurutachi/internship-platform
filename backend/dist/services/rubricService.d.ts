export interface RubricCriterion {
    code: string;
    name: string;
    description: string;
    scale_descriptions: {
        '1-2': string;
        '3-4': string;
        '5-6': string;
        '7-8': string;
        '9-10': string;
    };
    max_score: number;
}
export interface GradingScale {
    min_score: number;
    max_score: number;
    grade: number;
}
export interface RubricData {
    university_id: string;
    academic_year: string;
    rubric_name: string;
    criteria: RubricCriterion[];
    grading_scale: GradingScale[];
    description?: string;
}
/**
 * Get active rubric for a university
 */
export declare function getActiveRubric(universityId: string): Promise<{
    success: boolean;
    data: any;
    isDefault: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    isDefault?: undefined;
}>;
/**
 * Get rubric by ID
 */
export declare function getRubricById(rubricId: string): Promise<{
    success: boolean;
    data: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get all rubrics for a university
 */
export declare function getAllRubrics(universityId: string, includeInactive?: boolean): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Create new rubric
 */
export declare function createRubric(rubricData: RubricData, createdBy: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Update rubric (creates new version in history)
 */
export declare function updateRubric(rubricId: string, updates: Partial<RubricData>, changedBy: string, changeReason: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Get rubric version history
 */
export declare function getRubricHistory(rubricId: string): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Deactivate rubric
 */
export declare function deactivateRubric(rubricId: string, deactivatedBy: string, reason?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Activate rubric (and deactivate others for same university)
 */
export declare function activateRubric(rubricId: string, activatedBy: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Calculate grade from total score using rubric's grading scale
 */
export declare function calculateGrade(rubricId: string, totalScore: number): Promise<number | null>;
//# sourceMappingURL=rubricService.d.ts.map