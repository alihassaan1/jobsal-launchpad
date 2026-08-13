import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DOCUMENT_SETTING_KEYS = [
  "documents_enabled",
  "documents_max_size_mb",
  "documents_max_per_user",
] as const;

export type DocumentSettings = {
  enabled: boolean;
  maxSizeMb: number;
  maxPerUser: number;
};

export const DOCUMENT_DEFAULTS: DocumentSettings = {
  enabled: true,
  maxSizeMb: 5,
  maxPerUser: 10,
};

export function useDocumentSettings() {
  return useQuery({
    queryKey: ["document-settings"],
    queryFn: async (): Promise<DocumentSettings> => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .like("key", "documents_%");
      if (error) throw error;

      const map: Record<string, string> = {};
      (data || []).forEach((row) => {
        if (row.value != null) map[row.key] = row.value;
      });

      return {
        enabled: (map.documents_enabled ?? "true") === "true",
        maxSizeMb: Number(map.documents_max_size_mb ?? DOCUMENT_DEFAULTS.maxSizeMb) || DOCUMENT_DEFAULTS.maxSizeMb,
        maxPerUser: Number(map.documents_max_per_user ?? DOCUMENT_DEFAULTS.maxPerUser) || DOCUMENT_DEFAULTS.maxPerUser,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
