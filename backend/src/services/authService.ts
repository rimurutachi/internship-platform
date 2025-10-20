import { createClient } from "@supabase/supabase-js";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ErrorResponse,
  SuccessResponse,
  ProfileUpdateRequest,
  UserProfile,
} from "../types/auth";

/* Validate required environment variables (skip strict check in test environment) */
if (
  process.env.NODE_ENV !== "test" &&
  (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY"
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export class AuthService {
  //Authenticate user with email and password
  static async login(
    credentials: LoginRequest
  ): Promise<AuthResponse | ErrorResponse> {
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

      const mergedUser = userProfile
        ? {
            id: data.user.id,
            email: data.user.email,
            role: userProfile.role ?? data.user.user_metadata?.role,
            first_name:
              userProfile.first_name ?? data.user.user_metadata?.first_name,
            last_name:
              userProfile.last_name ?? data.user.user_metadata?.last_name,
            profile_data: userProfile.profile_data,
          }
        : data.user;

      return {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: mergedUser,
        expires_at: data.session.expires_at || 0,
      };
    } catch (error: any) {
      console.log("Login error:", error);
      return {
        error: "Login Failed",
        message: "Internal server error appeared.",
      };
    }
  }

  /* Register a new user */
  static async register(
    userData: RegisterRequest
  ): Promise<SuccessResponse | ErrorResponse> {
    try {
      const {
        email,
        password,
        role = "student",
        first_name,
        last_name,
        university_id,
        university_code,
        company_id,
        company_code,
        profile_data = {},
      } = userData;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            role,
          },
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
      const { error: profileError } = await supabase
        .from("users")
        .insert([userProfile]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return {
          error: "Profile creation failed",
          message:
            profileError.message ||
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
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        error: "Registration failed.",
        message: "Internal server error during registration. Contact support.",
      };
    }
  }

  /* Get user profile by ID */
  static async getUserProfile(
    userId: string
  ): Promise<SuccessResponse | ErrorResponse> {
    try {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !userProfile) {
        return {
          error: "Profile not found",
          message: "Unable to find user profile.",
        };
      }

      return {
        success: true,
        message: "Profile retrieved successfully.",
        data: userProfile,
      };
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      return {
        error: "Profile fetch error.",
        message: "Unable to retrieve user profile",
      };
    }
  }

  /* Update user profile */
  static async updateUserProfile(
    userId: string,
    updates: ProfileUpdateRequest
  ): Promise<SuccessResponse | ErrorResponse> {
    try {
      const allowedUpdates = ["first_name", "last_name", "profile_data"];
      const filteredUpdates: any = {};

      Object.keys(updates)
        .filter((key) => allowedUpdates.includes(key))
        .forEach((key) => {
          filteredUpdates[key] = updates[key as keyof ProfileUpdateRequest];
        });

      if (Object.keys(filteredUpdates).length === 0) {
        return {
          error: "No valid updates provided.",
          message: `Allowed fields: ${allowedUpdates.join(", ")}`,
        };
      }

      // Merge profile_data with existing data
      if (filteredUpdates.profile_data) {
        const { data: existingUser } = await supabase
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

      const { data, error } = await supabase
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
        const metadataUpdate: Record<string, any> = {};
        if (typeof filteredUpdates.first_name === "string") {
          metadataUpdate.first_name = filteredUpdates.first_name;
        }
        if (typeof filteredUpdates.last_name === "string") {
          metadataUpdate.last_name = filteredUpdates.last_name;
        }
        if (Object.keys(metadataUpdate).length > 0) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: metadataUpdate,
          });
        }
      } catch (syncError) {
        console.warn("Auth metadata sync skipped:", syncError);
      }

      return {
        success: true,
        message: "Profile updated successfully",
        data: data[0],
      };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return {
        error: "Profile update failed",
        message: "Internal server error during profile update",
      };
    }
  }

  /* Get all users (admin only) */
  static async getAllUsers(): Promise<SuccessResponse | ErrorResponse> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id, email, first_name, last_name, role, created_at, updated_at,
          universities(name, code),
          companies(name, code, industry)
        `
        )
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
    } catch (error: any) {
      console.error("Users fetch error:", error);
      return {
        error: "Fetch failed.",
        message: "Unable to retrieve users",
      };
    }
  }

  /* Build user profile object with role-specific fields */
  private static async buildUserProfile(params: {
    authData: any;
    role: string;
    first_name: string;
    last_name: string;
    university_id?: string;
    university_code?: string;
    company_id?: string;
    company_code?: string;
    profile_data?: Record<string, any>;
  }): Promise<UserProfile> {
    const {
      authData,
      role,
      first_name,
      last_name,
      university_id,
      university_code,
      company_id,
      company_code,
      profile_data = {},
    } = params;

    const userProfile: Partial<UserProfile> = {
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
      const resolvedUniversityId = await this.resolveUniversityId(
        university_id,
        university_code
      );
      if (resolvedUniversityId) {
        userProfile.university_id = resolvedUniversityId;
      }
    }

    // Add company_id for supervisors
    if (role === "supervisor") {
      const resolvedCompanyId = await this.resolveCompanyId(
        company_id,
        company_code
      );
      if (resolvedCompanyId) {
        userProfile.company_id = resolvedCompanyId;
      }
    }

    return userProfile as UserProfile;
  }

  /* Resolve university ID from code or return existing ID */
  private static async resolveUniversityId(
    university_id?: string,
    university_code?: string
  ): Promise<string | undefined> {
    if (university_id) {
      return university_id;
    }

    if (university_code) {
      const { data: uni } = await supabase
        .from("universities")
        .select("id")
        .eq("code", university_code)
        .single();
      return uni?.id;
    }

    return undefined;
  }

  /* Resolve company ID from code or return existing ID */
  private static async resolveCompanyId(
    company_id?: string,
    company_code?: string
  ): Promise<string | undefined> {
    if (company_id) {
      return company_id;
    }

    if (company_code) {
      const { data: comp } = await supabase
        .from("companies")
        .select("id")
        .eq("code", company_code)
        .single();
      return comp?.id;
    }

    return undefined;
  }
}
