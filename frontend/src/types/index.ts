// Types
export interface User {
    id: string;
    email: string;
    role: 'student' | 'advisor' | 'supervisor' | 'admin';
    first_name?: string;
    last_name?: string;
    university_id?: string;
    company_id?: string;
    profile_data?: any;
    created_at?: string;
    updated_at?: string;
}

export interface University {
    id: string;
    name: string;
    code?: string;
    address?: string;
    contact_info?: any;
    created_at?: string;
}

export interface Company {
    id: string;
    name: string;
    industry?: string;
    address?: string;
    contact_info?: any;
    is_verified?: boolean;
    created_at?: string;
}

// Component props
export interface LoginFormProps {
    redirectTo?: string;
    className?: string;
}

export interface DashboardProps {
    user: User;
}

//Supabase specific types
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit < User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial < Omit < User, 'id' | 'created_at'>>;
            };
            universities: {
                Row: University;
                Insert: Omit < University, 'id' | 'created_at'>;
                Update: Partial < Omit < University, 'id' | 'created_at'>>;
            };
            companies: {
                Row: Company;
                Insert: Omit < Company, 'id' | 'created_at'>;
                Update: Partial < Omit < Company, 'id' | 'created_at'>>;
            };
        };
    };
}