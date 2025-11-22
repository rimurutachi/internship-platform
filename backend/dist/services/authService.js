"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/* Validate required environment variables (skip strict check in test environment) */
if (process.env.NODE_ENV !== "test" &&
    (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
    throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY");
}
// Admin client with service key
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// Regular client with Anon key only.
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
class AuthService {
    //Authenticate user with email and password
    static async login(credentials) {
        try {
            const { email, password } = credentials;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                return {
                    error: "Login Failed",
                    message: error.message,
                };
            }
            if (!data.session) {
                return {
                    error: "Login Failed",
                    message: "No session created, try again.",
                };
            }
            // Fetch the latest user profile from the users table to avoid stale metadata
            const { data: userProfile } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single();
            // Check if user is suspended or inactive
            if (userProfile) {
                if (userProfile.status === 'suspended') {
                    // Sign out the user immediately
                    await supabase.auth.signOut();
                    return {
                        error: "Account Suspended",
                        message: "Your account has been suspended. Please contact support.",
                    };
                }
                if (userProfile.status === 'inactive') {
                    // Sign out the user immediately
                    await supabase.auth.signOut();
                    return {
                        error: "Account Inactive",
                        message: "Your account is inactive. Please contact support to reactivate.",
                    };
                }
                // Update last_login timestamp using admin client
                const { error: updateError } = await supabaseAdmin
                    .from("users")
                    .update({ last_login: new Date().toISOString() })
                    .eq("id", data.user.id);
                if (updateError) {
                    console.error('Failed to update last_login:', updateError);
                }
                else {
                    console.log('Successfully updated last_login for user:', data.user.id);
                }
            }
            const mergedUser = userProfile
                ? {
                    id: data.user.id,
                    email: data.user.email,
                    role: userProfile.role ?? data.user.user_metadata?.role,
                    first_name: userProfile.first_name ?? data.user.user_metadata?.first_name,
                    last_name: userProfile.last_name ?? data.user.user_metadata?.last_name,
                    profile_data: userProfile.profile_data,
                    status: userProfile.status,
                    verified: userProfile.verified,
                }
                : data.user;
            return {
                success: true,
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                user: mergedUser,
                expires_at: data.session.expires_at || 0,
            };
        }
        catch (error) {
            console.log("Login error:", error);
            return {
                error: "Login Failed",
                message: "Internal server error appeared.",
            };
        }
    }
    /* Register a new user */
    static async register(userData) {
        try {
            const { email, password, role = "student", first_name, last_name, university_id, university_code, company_id, company_code, profile_data = {}, } = userData;
            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    first_name,
                    last_name,
                },
                app_metadata: {
                    role,
                },
            });
            if (authError) {
                return {
                    error: "Registration failed.",
                    message: authError.message,
                };
            }
            if (!authData.user) {
                return {
                    error: "Registration failed.",
                    message: "User creation failed, try again.",
                };
            }
            // Build user profile object
            const userProfile = await this.buildUserProfile({
                authData,
                role,
                first_name,
                last_name,
                university_id,
                university_code,
                company_id,
                company_code,
                profile_data,
            });
            // Create user profile in users table
            const { error: profileError } = await supabaseAdmin
                .from("users")
                .insert([userProfile]);
            if (profileError) {
                console.error("Profile creation error:", profileError);
                return {
                    error: "Profile creation failed",
                    message: profileError.message ||
                        "User account created but profile setup failed.",
                };
            }
            return {
                success: true,
                message: "User registered successfully",
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    first_name,
                    last_name,
                    role,
                },
            };
        }
        catch (error) {
            console.error("Registration error:", error);
            return {
                error: "Registration failed.",
                message: "Internal server error during registration. Contact support.",
            };
        }
    }
    /* Get user profile by ID */
    /**
     * Get user profile by ID. If not found, auto-create using JWT info (from req.user).
     * @param userId - Supabase Auth user id
     * @param fallbackUser - Optional: user info from JWT (id, email, role, etc.)
     */
    static async getUserProfile(userId, fallbackUser) {
        try {
            // Use admin client to bypass RLS policies
            const { data: userProfile, error } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();
            if (!error && userProfile) {
                return {
                    success: true,
                    message: "Profile retrieved successfully.",
                    data: userProfile,
                };
            }
            // If not found, try to auto-create using fallbackUser (from JWT)
            if (fallbackUser) {
                console.log("Auto-creating profile for user:", fallbackUser.id, fallbackUser.email);
                // Compose minimal profile matching the registration structure
                const newProfile = {
                    id: fallbackUser.id,
                    email: fallbackUser.email,
                    role: fallbackUser.role,
                    first_name: fallbackUser.first_name || "",
                    last_name: fallbackUser.last_name || "",
                };
                const { data: insertedProfile, error: insertError } = await supabaseAdmin
                    .from("users")
                    .insert([newProfile])
                    .select()
                    .single();
                if (insertError) {
                    console.error("Auto-create profile error:", insertError);
                    console.error("Failed profile data:", newProfile);
                    // If duplicate key error, try to fetch again (profile exists but wasn't found before)
                    if (insertError.code === "23505") {
                        console.log("Profile already exists, fetching again...");
                        const { data: existingProfile, error: refetchError } = await supabaseAdmin
                            .from("users")
                            .select("*")
                            .eq("id", userId)
                            .single();
                        if (!refetchError && existingProfile) {
                            console.log("Profile found on retry:", existingProfile.email);
                            return {
                                success: true,
                                message: "Profile retrieved successfully.",
                                data: existingProfile,
                            };
                        }
                    }
                    return {
                        error: "Profile auto-create failed",
                        message: insertError.message || "Could not create user profile.",
                    };
                }
                console.log("Profile auto-created successfully for:", fallbackUser.email);
                return {
                    success: true,
                    message: "Profile auto-created successfully.",
                    data: insertedProfile,
                };
            }
            return {
                error: "Profile not found",
                message: "Unable to find user profile.",
            };
        }
        catch (error) {
            console.error("Profile fetch error:", error);
            return {
                error: "Profile fetch error.",
                message: "Unable to retrieve user profile",
            };
        }
    }
    /* Update user profile */
    static async updateUserProfile(userId, updates) {
        try {
            const allowedUpdates = ["first_name", "last_name", "profile_data"];
            const filteredUpdates = {};
            Object.keys(updates)
                .filter((key) => allowedUpdates.includes(key))
                .forEach((key) => {
                filteredUpdates[key] = updates[key];
            });
            if (Object.keys(filteredUpdates).length === 0) {
                return {
                    error: "No valid updates provided.",
                    message: `Allowed fields: ${allowedUpdates.join(", ")}`,
                };
            }
            // Merge profile_data with existing data
            if (filteredUpdates.profile_data) {
                const { data: existingUser } = await supabaseAdmin
                    .from("users")
                    .select("profile_data")
                    .eq("id", userId)
                    .single();
                if (existingUser) {
                    filteredUpdates.profile_data = {
                        ...(existingUser.profile_data || {}),
                        ...filteredUpdates.profile_data,
                    };
                }
            }
            // Update custom users table
            const { data, error } = await supabaseAdmin
                .from("users")
                .update({
                ...filteredUpdates,
                updated_at: new Date().toISOString(),
            })
                .eq("id", userId)
                .select();
            if (error) {
                return {
                    error: "Update failed",
                    message: error.message,
                };
            }
            // Best-effort: keep Supabase Auth user_metadata in sync for common fields
            try {
                const metadataUpdate = {};
                if (typeof filteredUpdates.first_name === "string") {
                    metadataUpdate.first_name = filteredUpdates.first_name;
                }
                if (typeof filteredUpdates.last_name === "string") {
                    metadataUpdate.last_name = filteredUpdates.last_name;
                }
                if (Object.keys(metadataUpdate).length > 0) {
                    await supabaseAdmin.auth.admin.updateUserById(userId, {
                        user_metadata: metadataUpdate,
                    });
                }
            }
            catch (syncError) {
                console.warn("Auth metadata sync skipped:", syncError);
            }
            return {
                success: true,
                message: "Profile updated successfully",
                data: data[0],
            };
        }
        catch (error) {
            console.error("Profile update error:", error);
            return {
                error: "Profile update failed",
                message: "Internal server error during profile update",
            };
        }
    }
    /* Get all users (admin only) */
    static async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from("users")
                .select(`
          id, email, first_name, last_name, role, created_at, updated_at,
          universities(name, code),
          companies(name, code, industry)
        `)
                .order("created_at", { ascending: false });
            if (error) {
                return {
                    error: "Failed to fetch users",
                    message: error.message,
                };
            }
            return {
                success: true,
                message: "Users retrieved successfully!",
                data: data || [],
            };
        }
        catch (error) {
            console.error("Users fetch error:", error);
            return {
                error: "Fetch failed.",
                message: "Unable to retrieve users",
            };
        }
    }
    /* Change user role (admin only) */
    static async changeUserRole(userId, role) {
        try {
            // Validate role
            const validRoles = ["student", "advisor", "supervisor", "admin"];
            if (!validRoles.includes(role)) {
                return {
                    error: "Invalid role",
                    message: "Role must be one of: student, advisor, supervisor, admin",
                };
            }
            // Update custom users table
            const { error: dbError } = await supabaseAdmin
                .from("users")
                .update({ role, updated_at: new Date().toISOString() })
                .eq("id", userId);
            if (dbError) {
                return {
                    error: "Update failed",
                    message: dbError.message,
                };
            }
            // Update app_metadata in Auth
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                app_metadata: { role },
            });
            if (authError) {
                return {
                    error: "Auth update failed",
                    message: authError.message,
                };
            }
            return {
                success: true,
                message: "User role updated successfully",
                data: { userId, role },
            };
        }
        catch (error) {
            console.error("Role update error:", error);
            return {
                error: "Update failed",
                message: "Unable to update user role",
            };
        }
    }
    /* Build user profile object with role-specific fields */
    static async buildUserProfile(params) {
        const { authData, role, first_name, last_name, university_id, university_code, company_id, company_code, profile_data = {}, } = params;
        const userProfile = {
            id: authData.user.id,
            email: authData.user.email,
            role,
            first_name,
            last_name,
            profile_data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        // Add university_id for students and advisors
        if (role === "student" || role === "advisor") {
            let resolvedUniversityId = undefined;
            if (university_id) {
                resolvedUniversityId = university_id;
            }
            else if (university_code) {
                const { data: uni } = await supabaseAdmin
                    .from("universities")
                    .select("id")
                    .eq("code", university_code)
                    .single();
                if (uni && uni.id)
                    resolvedUniversityId = uni.id;
            }
            if (resolvedUniversityId)
                userProfile.university_id = resolvedUniversityId;
        }
        // Add company_id for supervisors
        if (role === "supervisor") {
            let resolvedCompanyId = undefined;
            if (company_id) {
                resolvedCompanyId = company_id;
            }
            else if (company_code) {
                const { data: comp } = await supabaseAdmin
                    .from("companies")
                    .select("id")
                    .eq("code", company_code)
                    .single();
                if (comp && comp.id)
                    userProfile.company_id = comp.id;
            }
            if (resolvedCompanyId)
                userProfile.company_id = resolvedCompanyId;
        }
        return userProfile;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map