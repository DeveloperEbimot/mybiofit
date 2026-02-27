import { useState, useEffect } from "react";

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
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("biofit-profile");
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem("biofit-profile", JSON.stringify(newProfile));
  };

  return { profile, updateProfile };
}
