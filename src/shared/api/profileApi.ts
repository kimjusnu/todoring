import { supabase } from "@/shared/config/supabase";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export const profileApi = {
  async getProfile(): Promise<Profile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Failed to load profile:", error);

      // 프로필이 없으면 자동으로 생성
      if (error.code === "PGRST116") {
        try {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "User",
              friend_code: Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase(),
            })
            .select()
            .single();

          if (createError) {
            console.error("Failed to create profile:", createError);
            return null;
          }

          console.log("Profile created automatically:", newProfile);
          return newProfile;
        } catch (createErr) {
          console.error("Error creating profile:", createErr);
          return null;
        }
      }

      return null;
    }
    return data;
  },
};
