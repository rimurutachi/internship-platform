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