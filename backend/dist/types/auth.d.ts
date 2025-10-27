export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest extends LoginRequest {
    role?: "student" | "advisor" | "supervisor" | "admin";
    first_name: string;
    last_name: string;
    university_id?: string;
    university_code?: string;
    company_id?: string;
    company_code?: string;
    profile_data?: Record<string, any>;
}
export interface AuthResponse {
    success: boolean;
    access_token: string;
    refresh_token: string;
    user: any;
    expires_at: number;
}
export interface ErrorResponse {
    error: string;
    message: string;
}
export interface SuccessResponse {
    success: boolean;
    message: string;
    user?: any;
    data?: any;
}
export interface ProfileUpdateRequest {
    first_name?: string;
    last_name?: string;
    profile_data?: Record<string, any>;
}
export interface RoleChangeRequest {
    role: "student" | "advisor" | "supervisor" | "admin";
}
export interface UserProfile {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    profile_data?: Record<string, any>;
    university_id?: string;
    company_id?: string;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=auth.d.ts.map