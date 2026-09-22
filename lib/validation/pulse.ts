import { z } from "zod";
import { MOOD_TAGS, RECOGNITION_CATEGORIES } from "@/db/schema/constants";

export const MOOD_TAG_VALUES = MOOD_TAGS as readonly string[];
export const RECOGNITION_CATEGORY_VALUES = RECOGNITION_CATEGORIES as readonly string[];

export const pulseSchema = z.object({
  sentimentScore: z.coerce
    .number()
    .int("Choose a rating between 1 and 5.")
    .min(1, "Choose a rating between 1 and 5.")
    .max(5, "Choose a rating between 1 and 5."),
  moodTags: z
    .array(z.string().trim())
    .max(3, "Choose up to three mood tags.")
    .default([]),
  bestMoment: z.string().trim().max(500, "Keep it under 500 characters.").optional(),
  improvementText: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters.")
    .optional(),
  recognitionRecipientId: z
    .string()
    .trim()
    .uuid("Choose a colleague to recognize.")
    .or(z.literal(""))
    .optional(),
  recognitionCategory: z.enum(RECOGNITION_CATEGORIES).optional(),
  recognitionMessage: z
    .string()
    .trim()
    .max(200, "Keep it under 200 characters.")
    .optional(),
});

export function sanitizeMoodTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const allowed = new Set(MOOD_TAG_VALUES);
  return [...new Set(tags.filter((t): t is string => typeof t === "string" && allowed.has(t)))].slice(0, 3);
}

export type PulseInput = z.infer<typeof pulseSchema>;

export const SENTIMENT_LABELS = ["Very low", "Low", "Okay", "Good", "Great"] as const;