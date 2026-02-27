import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  dietGoal: string;
  restrictions: string[];
  age: number;
  weight: number;
  height: number;
  gender: string;
  activityLevel: string;
}

const defaultProfile: UserProfile = {
  dietGoal: "weight-loss",
  restrictions: [],
  age: 25,
  weight: 70,
  height: 170,
  gender: "male",
  activityLevel: "moderate",
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("biofit-profile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });
  const [loaded, setLoaded] = useState(false);

  // Load from DB when logged in
  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            dietGoal: data.diet_goal || "weight-loss",
            restrictions: data.restrictions || [],
            age: data.age || 25,
            weight: Number(data.weight) || 70,
            height: Number(data.height) || 170,
            gender: data.gender || "male",
            activityLevel: data.activity_level || "moderate",
          });
        }
        setLoaded(true);
      });
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem("biofit-profile", JSON.stringify(newProfile));

    if (user) {
      await supabase.from("profiles").update({
        diet_goal: newProfile.dietGoal,
        restrictions: newProfile.restrictions,
        age: newProfile.age,
        weight: newProfile.weight,
        height: newProfile.height,
        gender: newProfile.gender,
        activity_level: newProfile.activityLevel,
      }).eq("user_id", user.id);
    }
  }, [profile, user]);

  return { profile, updateProfile, loaded };
}
