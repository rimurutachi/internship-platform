export declare class InternshipsService {
    /**
     * Validate internship assignment constraints
     * Checks:
     * - Student doesn't have active internship
     * - Student is actually a student role
     * - Advisor is from same university as student
     * - Advisor has advisor role
     * - Supervisor belongs to selected company
     * - Supervisor has supervisor role
     */
    validateInternshipAssignment(student_id: string, company_id: string, advisor_id: string, supervisor_id: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Validate internship update constraints
     * Similar to create but allows skipping unchanged fields
     */
    validateInternshipUpdate(internship_id: string, advisor_id?: string, supervisor_id?: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Format internship for display with calculated fields
     */
    formatInternship(internship: any): any;
    /**
     * Build query filters for internships list
     */
    buildInternshipsQuery(filters: {
        status?: string;
        university_id?: string;
        company_id?: string;
        search?: string;
    }): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, any[], "internships", unknown, "GET">;
    /**
     * Log internship activity to audit trail
     */
    logActivity(user_id: string, action: string, internship_id: string, description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Calculate field changes for audit log
     */
    calculateChanges(oldData: any, newData: any): Record<string, any>;
}
export declare const internshipsService: InternshipsService;
//# sourceMappingURL=internshipsService.d.ts.map