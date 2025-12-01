/**
 * Internship Service - Core CRUD Operations
 *
 * Handles basic Create, Read, Update, Delete operations for internships.
 * Use InternshipServiceFacade (internship.service.ts) for a unified API that includes
 * validation and enhanced features.
 *
 * @deprecated Consider using InternshipServiceFacade for new code
 */
import { Internship, CreateInternshipDTO, UpdateInternshipDTO } from '../models/internship';
export declare class InternshipService {
    create(data: CreateInternshipDTO): Promise<Internship>;
    getById(id: string): Promise<Internship | null>;
    getAll(filters?: any): Promise<Internship[]>;
    update(id: string, updates: UpdateInternshipDTO): Promise<Internship>;
    delete(id: string): Promise<void>;
    getStudentInternships(studentId: string): Promise<Internship[]>;
    getAdvisorInternships(advisorId: string): Promise<Internship[]>;
}
//# sourceMappingURL=internshipService.d.ts.map