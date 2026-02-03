"use strict";
/**
 * Internship Service - Core CRUD Operations
 *
 * Handles basic Create, Read, Update, Delete operations for internships.
 * Use InternshipServiceFacade (internship.service.ts) for a unified API that includes
 * validation and enhanced features.
 *
 * @deprecated Consider using InternshipServiceFacade for new code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternshipService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
class InternshipService {
    async create(data) {
        const { data: internship, error } = await supabase
            .from('internships')
            .insert({
            ...data,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return internship;
    }
    async getById(id) {
        const { data, error } = await supabase
            .from('internships')
            .select(`
            *,
            student:users!student_id(id, email, first_name, last_name),
            company:companies(id, name, industry),
            advisor:users!advisor_id(id, email, first_name, last_name),
            supervisor:users!supervisor_id(id, email, first_name, last_name)
            `)
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getAll(filters) {
        let query = supabase
            .from('internships')
            .select(`
                *,
                student:users!student_id(id, email, first_name, last_name),
                company:companies(id, name, industry)
                `);
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.student_id) {
            query = query.eq('student_id', filters.student_id);
        }
        if (filters?.advisor_id) {
            query = query.eq('advisor_id', filters.advisor_id);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return data || [];
    }
    async update(id, updates) {
        const { data, error } = await supabase
            .from('internships')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async delete(id) {
        const { error } = await supabase
            .from('internships')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
    async getStudentInternships(studentId) {
        const { data, error } = await supabase
            .from('internships')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data || [];
    }
    async getAdvisorInternships(advisorId) {
        const { data, error } = await supabase
            .from('internships')
            .select(`
                *,
                student:users!student_id(id, email, first_name, last_name),
                company:companies(id, name)
                `)
            .eq('advisor_id', advisorId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data || [];
    }
    async getSupervisorInternships(supervisorId) {
        const { data, error } = await supabase
            .from('internships')
            .select(`
                *,
                student:users!student_id(id, email, first_name, last_name),
                company:companies(id, name, industry)
                `)
            .eq('supervisor_id', supervisorId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data || [];
    }
}
exports.InternshipService = InternshipService;
//# sourceMappingURL=internshipService.js.map