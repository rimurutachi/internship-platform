export interface Internship {
    id: string;
    student_id: string;
    company_id: string;
    advisor_id: string;
    supervisor_id: string | null;
    position: string;
    department?: string;
    start_date: Date;
    end_date: Date;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    requirements?: any;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
}

export interface CreateInternshipDTO {
    student_id: string;
    company_id: string;
    advisor_id: string;
    supervisor_id?: string;
    position: string;
    department?: string;
    start_date: string;
    end_date: string;
    requirements?: any;
    metadata?: any;
}

export interface UpdateInternshipDTO {
    position?: string;
    department?: string;
    start_date?: string;
    end_date?: string;
    status?: 'pending' | 'active' | 'completed' | 'cancelled';
    supervisor_id?: string;
    requirements?: any;
    metadata?: any;
}