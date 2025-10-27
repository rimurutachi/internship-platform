import { LoginRequest, RegisterRequest, AuthResponse, ErrorResponse, SuccessResponse, ProfileUpdateRequest } from "../types/auth";
export declare class AuthService {
    static login(credentials: LoginRequest): Promise<AuthResponse | ErrorResponse>;
    static register(userData: RegisterRequest): Promise<SuccessResponse | ErrorResponse>;
    static getUserProfile(userId: string): Promise<SuccessResponse | ErrorResponse>;
    static updateUserProfile(userId: string, updates: ProfileUpdateRequest): Promise<SuccessResponse | ErrorResponse>;
    static getAllUsers(): Promise<SuccessResponse | ErrorResponse>;
    static changeUserRole(userId: string, role: string): Promise<SuccessResponse | ErrorResponse>;
    private static buildUserProfile;
}
//# sourceMappingURL=authService.d.ts.map