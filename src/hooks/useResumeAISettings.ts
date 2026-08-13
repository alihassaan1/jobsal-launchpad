import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RESUME_AI_KEYS = [
  "resume_ai_enabled",
  "resume_ai_summary_enabled",
  "resume_ai_skills_enabled",
  "resume_ai_experience_enabled",
  "resume_ai_cover_letter_enabled",
  "resume_ai_model",
  "resume_ai_daily_limit",
] as const;

export type ResumeAISettings = Record<string, string>;

export const RESUME_AI_DEFAULTS: ResumeAISettings = {
  resume_ai_enabled: "true",
  resume_ai_summary_enabled: "true",
  resume_ai_skills_enabled: "true",
  resume_ai_experience_enabled: "true",
  resume_ai_cover_letter_enabled: "true",
  resume_ai_model: "deepseek-chat",
  resume_ai_daily_limit: "20",
};

export function isOn(settings: ResumeAISettings | undefined, key: string) {
  const value = settings?.[key] ?? RESUME_AI_DEFAULTS[key];
  return value === "true";
}

export function useResumeAISettings() {
  return useQuery({
    queryKey: ["resume-ai-settings"],
    queryFn: async (): Promise<ResumeAISettings> => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .like("key", "resume_ai_%");

      if (error) throw error;

      const merged: ResumeAISettings = { ...RESUME_AI_DEFAULTS };
      (data || []).forEach((row) => {
        if (row.value !== null && row.value !== undefined) merged[row.key] = row.value;
      });
      return merged;
    },
    staleTime: 5 * 60 * 1000,
  });
}
