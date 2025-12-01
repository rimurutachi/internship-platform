"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternshipsEnhancedService = exports.InternshipsService = exports.InternshipService = exports.internshipService = exports.InternshipServiceFacade = void 0;
const internshipService_1 = require("./internshipService");
Object.defineProperty(exports, "InternshipService", { enumerable: true, get: function () { return internshipService_1.InternshipService; } });
const internshipsService_1 = require("./internshipsService");
Object.defineProperty(exports, "InternshipsService", { enumerable: true, get: function () { return internshipsService_1.InternshipsService; } });
const internshipsEnhancedService_1 = require("./internshipsEnhancedService");
Object.defineProperty(exports, "InternshipsEnhancedService", { enumerable: true, get: function () { return internshipsEnhancedService_1.InternshipsEnhancedService; } });
class InternshipServiceFacade {
    constructor() {
        this.crudService = new internshipService_1.InternshipService();
        this.validationService = new internshipsService_1.InternshipsService();
    }
    // ============================================================
    // CRUD Operations (from InternshipService)
    // ============================================================
    /**
     * Create a new internship
     */
    async create(data) {
        return this.crudService.create(data);
    }
    /**
     * Get internship by ID with full relations
     */
    async getById(id) {
        return this.crudService.getById(id);
    }
    /**
     * Get all internships with optional filters
     */
    async getAll(filters) {
        return this.crudService.getAll(filters);
    }
    /**
     * Update internship
     */
    async update(id, updates) {
        return this.crudService.update(id, updates);
    }
    /**
     * Delete internship
     */
    async delete(id) {
        return this.crudService.delete(id);
    }
    /**
     * Get all internships for a student
     */
    async getStudentInternships(studentId) {
        return this.crudService.getStudentInternships(studentId);
    }
    /**
     * Get all internships for an advisor
     */
    async getAdvisorInternships(advisorId) {
        return this.crudService.getAdvisorInternships(advisorId);
    }
    // ============================================================
    // Validation & Business Logic (from InternshipsService)
    // ============================================================
    /**
     * Validate internship assignment constraints
     * Checks student, advisor, supervisor roles and relationships
     */
    async validateInternshipAssignment(student_id, company_id, advisor_id, supervisor_id) {
        return this.validationService.validateInternshipAssignment(student_id, company_id, advisor_id, supervisor_id);
    }
    /**
     * Validate internship update constraints
     */
    async validateInternshipUpdate(internship_id, advisor_id, supervisor_id) {
        return this.validationService.validateInternshipUpdate(internship_id, advisor_id, supervisor_id);
    }
    /**
     * Build query for internship listing with filters
     */
    buildInternshipsQuery(filters) {
        return this.validationService.buildInternshipsQuery(filters);
    }
    /**
     * Log activity for internship audit trail
     */
    async logActivity(internship_id, action, performed_by, old_values, new_values) {
        return this.validationService.logActivity(internship_id, action, performed_by, old_values, new_values);
    }
    // ============================================================
    // Enhanced Features (from InternshipsEnhancedService)
    // ============================================================
    /**
     * Update company student count when internship created/deleted
     * Call this after create (+1) or delete (-1)
     */
    async updateCompanyStudentCount(company_id, delta) {
        return internshipsEnhancedService_1.InternshipsEnhancedService.updateCompanyStudentCount(company_id, delta);
    }
    /**
     * Export internships data to CSV, JSON, or Excel
     */
    async exportInternships(internship_ids, format) {
        return internshipsEnhancedService_1.InternshipsEnhancedService.exportInternships(internship_ids, format);
    }
    /**
     * Get document completion rate for internships
     */
    async getDocumentCompletionRate(internship_ids) {
        return internshipsEnhancedService_1.InternshipsEnhancedService.getDocumentCompletionRate(internship_ids);
    }
    /**
     * Get company capacity analytics
     */
    async getCompanyCapacityAnalytics() {
        return internshipsEnhancedService_1.InternshipsEnhancedService.getCompanyCapacityAnalytics();
    }
    /**
     * Validate if company can accept more students
     */
    async validateCompanyCapacity(company_id) {
        return internshipsEnhancedService_1.InternshipsEnhancedService.validateCompanyCapacity(company_id);
    }
}
exports.InternshipServiceFacade = InternshipServiceFacade;
// Export singleton instance
exports.internshipService = new InternshipServiceFacade();
//# sourceMappingURL=internship.service.js.map