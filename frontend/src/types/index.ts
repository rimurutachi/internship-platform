// Types
export interface UserProfileData {
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
    avatar_url?: string;
    preferences?: {
        notifications?: boolean;
        theme?: 'light' | 'dark';
        language?: string;
    };
}

export interface ContactInfo {
    phone?: string;
    email?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        country?: string;
    };
    social_media?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
    };
}

export interface User {
    id: string;
    email: string;
    role: 'student' | 'advisor' | 'supervisor' | 'admin';
    first_name?: string;
    last_name?: string;
    university_id?: string;
    company_id?: string;
    profile_data?: UserProfileData;
    created_at?: string;
    updated_at?: string;
}

export interface University {
    id: string;
    name: string;
    code?: string;
    address?: string;
    contact_info?: ContactInfo;
    created_at?: string;
}

export interface Company {
    id: string;
    name: string;
    industry?: string;
    address?: string;
    contact_info?: ContactInfo;
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