/**
 * Internship Service Facade
 *
 * Unified interface combining:
 * - InternshipService: Core CRUD operations
 * - InternshipsService: Validation & activity logging
 * - InternshipsEnhancedService: Advanced features (reminders, capacity, export)
 *
 * This facade provides a clean, single entry point for all internship-related operations
 * while maintaining backward compatibility with existing services.
 */
import { InternshipService } from './internshipService';
import { InternshipsService } from './internshipsService';
import { InternshipsEnhancedService } from './internshipsEnhancedService';
import { Internship, CreateInternshipDTO, UpdateInternshipDTO } from '../models/internship';
export declare class InternshipServiceFacade {
    private crudService;
    private validationService;
    constructor();
    /**
     * Create a new internship
     */
    create(data: CreateInternshipDTO): Promise<Internship>;
    /**
     * Get internship by ID with full relations
     */
    getById(id: string): Promise<Internship | null>;
    /**
     * Get all internships with optional filters
     */
    getAll(filters?: any): Promise<Internship[]>;
    /**
     * Update internship
     */
    update(id: string, updates: UpdateInternshipDTO): Promise<Internship>;
    /**
     * Delete internship
     */
    delete(id: string): Promise<void>;
    /**
     * Get all internships for a student
     */
    getStudentInternships(studentId: string): Promise<Internship[]>;
    /**
     * Get all internships for an advisor
     */
    getAdvisorInternships(advisorId: string): Promise<Internship[]>;
    /**
     * Get all internships for a supervisor
     */
    getSupervisorInternships(supervisorId: string): Promise<Internship[]>;
    /**
     * Validate internship assignment constraints
     * Checks student, advisor, supervisor roles and relationships
     */
    validateInternshipAssignment(student_id: string, company_id: string, advisor_id: string, supervisor_id: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Validate internship update constraints
     */
    validateInternshipUpdate(internship_id: string, advisor_id?: string, supervisor_id?: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Build query for internship listing with filters
     */
    buildInternshipsQuery(filters: any): any;
    /**
     * Log activity for internship audit trail
     */
    logActivity(user_id: string, action: string, internship_id: string, description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Calculate field changes for audit logging
     */
    calculateChanges(oldData: any, newData: any): Record<string, any>;
    /**
     * Update company student count when internship created/deleted
     * Call this after create (+1) or delete (-1)
     */
    updateCompanyStudentCount(company_id: string, delta: number): Promise<void>;
    /**
     * Export internships data to CSV, JSON, or Excel
     */
    exportInternships(internship_ids: string[], format: 'csv' | 'json' | 'excel'): Promise<any>;
    /**
     * Get document completion rate for internships
     */
    getDocumentCompletionRate(internship_ids: string[]): Promise<Record<string, number>>;
    /**
     * Get company capacity analytics
     */
    getCompanyCapacityAnalytics(): Promise<any>;
    /**
     * Validate if company can accept more students
     */
    validateCompanyCapacity(company_id: string): Promise<{
        canAccept: boolean;
        message?: string;
    }>;
}
export declare const internshipService: InternshipServiceFacade;
export { InternshipService, InternshipsService, InternshipsEnhancedService };
//# sourceMappingURL=internship.service.d.ts.map