import { LoginRequest, RegisterRequest, AuthResponse, ErrorResponse, SuccessResponse, ProfileUpdateRequest } from "../types/auth";
export declare class AuthService {
    static login(credentials: LoginRequest): Promise<AuthResponse | ErrorResponse>;
    static register(userData: RegisterRequest): Promise<SuccessResponse | ErrorResponse>;
    /**
     * Get user profile by ID. If not found, auto-create using JWT info (from req.user).
     * @param userId - Supabase Auth user id
     * @param fallbackUser - Optional: user info from JWT (id, email, role, etc.)
     */
    static getUserProfile(userId: string, fallbackUser?: {
        id: string;
        email: string;
        role: string;
        first_name?: string;
        last_name?: string;
    }): Promise<SuccessResponse | ErrorResponse>;
    static updateUserProfile(userId: string, updates: ProfileUpdateRequest): Promise<SuccessResponse | ErrorResponse>;
    static getAllUsers(): Promise<SuccessResponse | ErrorResponse>;
    static changeUserRole(userId: string, role: string): Promise<SuccessResponse | ErrorResponse>;
    private static buildUserProfile;
}
//# sourceMappingURL=authService.d.ts.map