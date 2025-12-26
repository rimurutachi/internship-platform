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

export class InternshipServiceFacade {
  // Service instances
  private crudService: InternshipService;
  private validationService: InternshipsService;

  constructor() {
    this.crudService = new InternshipService();
    this.validationService = new InternshipsService();
  }

  // ============================================================
  // CRUD Operations (from InternshipService)
  // ============================================================

  /**
   * Create a new internship
   */
  async create(data: CreateInternshipDTO): Promise<Internship> {
    console.log('[InternshipFacade] create start', { studentId: data.student_id, companyId: data.company_id, advisorId: data.advisor_id, supervisorId: data.supervisor_id });
    try {
      const result = await this.crudService.create(data);
      console.log('[InternshipFacade] create success', { internshipId: result.id });
      return result;
    } catch (error) {
      console.error('[InternshipFacade] create failed', { studentId: data.student_id, error });
      throw error;
    }
  }

  /**
   * Get internship by ID with full relations
   */
  async getById(id: string): Promise<Internship | null> {
    console.log('[InternshipFacade] getById', { internshipId: id });
    try {
      return await this.crudService.getById(id);
    } catch (error) {
      console.error('[InternshipFacade] getById failed', { internshipId: id, error });
      throw error;
    }
  }

  /**
   * Get all internships with optional filters
   */
  async getAll(filters?: any): Promise<Internship[]> {
    console.log('[InternshipFacade] getAll', { filters });
    try {
      return await this.crudService.getAll(filters);
    } catch (error) {
      console.error('[InternshipFacade] getAll failed', { filters, error });
      throw error;
    }
  }

  /**
   * Update internship
   */
  async update(id: string, updates: UpdateInternshipDTO): Promise<Internship> {
    console.log('[InternshipFacade] update start', { internshipId: id });
    try {
      const result = await this.crudService.update(id, updates);
      console.log('[InternshipFacade] update success', { internshipId: id });
      return result;
    } catch (error) {
      console.error('[InternshipFacade] update failed', { internshipId: id, error });
      throw error;
    }
  }

  /**
   * Delete internship
   */
  async delete(id: string): Promise<void> {
    console.log('[InternshipFacade] delete start', { internshipId: id });
    try {
      await this.crudService.delete(id);
      console.log('[InternshipFacade] delete success', { internshipId: id });
    } catch (error) {
      console.error('[InternshipFacade] delete failed', { internshipId: id, error });
      throw error;
    }
  }

  /**
   * Get all internships for a student
   */
  async getStudentInternships(studentId: string): Promise<Internship[]> {
    console.log('[InternshipFacade] getStudentInternships', { studentId });
    try {
      return await this.crudService.getStudentInternships(studentId);
    } catch (error) {
      console.error('[InternshipFacade] getStudentInternships failed', { studentId, error });
      throw error;
    }
  }

  /**
   * Get all internships for an advisor
   */
  async getAdvisorInternships(advisorId: string): Promise<Internship[]> {
    console.log('[InternshipFacade] getAdvisorInternships', { advisorId });
    try {
      return await this.crudService.getAdvisorInternships(advisorId);
    } catch (error) {
      console.error('[InternshipFacade] getAdvisorInternships failed', { advisorId, error });
      throw error;
    }
  }

  /**
   * Get all internships for a supervisor
   */
  async getSupervisorInternships(supervisorId: string): Promise<Internship[]> {
    console.log('[InternshipFacade] getSupervisorInternships', { supervisorId });
    try {
      return await this.crudService.getSupervisorInternships(supervisorId);
    } catch (error) {
      console.error('[InternshipFacade] getSupervisorInternships failed', { supervisorId, error });
      throw error;
    }
  }

  // ============================================================
  // Validation & Business Logic (from InternshipsService)
  // ============================================================

  /**
   * Validate internship assignment constraints
   * Checks student, advisor, supervisor roles and relationships
   */
  async validateInternshipAssignment(
    student_id: string,
    company_id: string,
    advisor_id: string,
    supervisor_id: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    return this.validationService.validateInternshipAssignment(
      student_id,
      company_id,
      advisor_id,
      supervisor_id
    );
  }

  /**
   * Validate internship update constraints
   */
  async validateInternshipUpdate(
    internship_id: string,
    advisor_id?: string,
    supervisor_id?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    return this.validationService.validateInternshipUpdate(internship_id, advisor_id, supervisor_id);
  }

  /**
   * Build query for internship listing with filters
   */
  buildInternshipsQuery(filters: any): any {
    return this.validationService.buildInternshipsQuery(filters);
  }

  /**
   * Log activity for internship audit trail
   */
  async logActivity(
    user_id: string,
    action: string,
    internship_id: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.validationService.logActivity(
      user_id,
      action,
      internship_id,
      description,
      metadata
    );
  }

  /**
   * Calculate field changes for audit logging
   */
  calculateChanges(oldData: any, newData: any): Record<string, any> {
    return this.validationService.calculateChanges(oldData, newData);
  }

  // ============================================================
  // Enhanced Features (from InternshipsEnhancedService)
  // ============================================================

  /**
   * Update company student count when internship created/deleted
   * Call this after create (+1) or delete (-1)
   */
  async updateCompanyStudentCount(company_id: string, delta: number): Promise<void> {
    return InternshipsEnhancedService.updateCompanyStudentCount(company_id, delta);
  }

  /**
   * Export internships data to CSV, JSON, or Excel
   */
  async exportInternships(internship_ids: string[], format: 'csv' | 'json' | 'excel'): Promise<any> {
    return InternshipsEnhancedService.exportInternships(internship_ids, format);
  }

  /**
   * Get document completion rate for internships
   */
  async getDocumentCompletionRate(internship_ids: string[]): Promise<Record<string, number>> {
    return InternshipsEnhancedService.getDocumentCompletionRate(internship_ids);
  }

  /**
   * Get company capacity analytics
   */
  async getCompanyCapacityAnalytics(): Promise<any> {
    return InternshipsEnhancedService.getCompanyCapacityAnalytics();
  }

  /**
   * Validate if company can accept more students
   */
  async validateCompanyCapacity(company_id: string): Promise<{ canAccept: boolean; message?: string }> {
    return InternshipsEnhancedService.validateCompanyCapacity(company_id);
  }
}

// Export singleton instance
export const internshipService = new InternshipServiceFacade();

// Export individual services for backward compatibility
export { InternshipService, InternshipsService, InternshipsEnhancedService };
