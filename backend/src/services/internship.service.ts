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
    return this.crudService.create(data);
  }

  /**
   * Get internship by ID with full relations
   */
  async getById(id: string): Promise<Internship | null> {
    return this.crudService.getById(id);
  }

  /**
   * Get all internships with optional filters
   */
  async getAll(filters?: any): Promise<Internship[]> {
    return this.crudService.getAll(filters);
  }

  /**
   * Update internship
   */
  async update(id: string, updates: UpdateInternshipDTO): Promise<Internship> {
    return this.crudService.update(id, updates);
  }

  /**
   * Delete internship
   */
  async delete(id: string): Promise<void> {
    return this.crudService.delete(id);
  }

  /**
   * Get all internships for a student
   */
  async getStudentInternships(studentId: string): Promise<Internship[]> {
    return this.crudService.getStudentInternships(studentId);
  }

  /**
   * Get all internships for an advisor
   */
  async getAdvisorInternships(advisorId: string): Promise<Internship[]> {
    return this.crudService.getAdvisorInternships(advisorId);
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
    internship_id: string,
    action: string,
    performed_by: string,
    old_values?: any,
    new_values?: any
  ): Promise<void> {
    return this.validationService.logActivity(
      internship_id,
      action,
      performed_by,
      old_values,
      new_values
    );
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
