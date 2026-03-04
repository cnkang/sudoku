/**
 * Zod validation schemas for API inputs
 *
 * Provides type-safe validation for all API endpoints.
 * Ensures input type and range validation to prevent security vulnerabilities.
 *
 * @see Requirements 10.1, 10.2, 13.7
 */

import { z } from 'zod';

/**
 * Grid size validation
 * Only 4, 6, and 9 are valid grid sizes
 */
export const GridSizeSchema = z.enum(['4', '6', '9'], {
  message: 'Grid size must be 4, 6, or 9',
});

/**
 * Difficulty validation
 * Range: 1-10 for 9x9, 1-7 for 6x6, 1-5 for 4x4
 */
export const DifficultySchema = z.number().int().min(1).max(10, {
  message: 'Difficulty must be between 1 and 10',
});

/**
 * Theme validation
 * Only predefined themes are allowed
 */
export const ThemeSchema = z.enum(['ocean', 'forest', 'space'], {
  message: 'Theme must be ocean, forest, or space',
});

/**
 * Puzzle request schema
 * Used for generating new puzzles
 */
export const PuzzleRequestSchema = z.object({
  difficulty: DifficultySchema,
  gridSize: GridSizeSchema,
  seed: z.string().max(100).optional(),
});

export type PuzzleRequest = z.infer<typeof PuzzleRequestSchema>;

/**
 * Grid input schema
 * Used for validating cell input during gameplay
 */
export const GridInputSchema = z.object({
  row: z.number().int().min(0).max(8, {
    message: 'Row must be between 0 and 8',
  }),
  col: z.number().int().min(0).max(8, {
    message: 'Column must be between 0 and 8',
  }),
  value: z.number().int().min(1).max(9, {
    message: 'Value must be between 1 and 9',
  }),
});

export type GridInput = z.infer<typeof GridInputSchema>;

/**
 * User preferences schema
 * Used for saving user settings
 */
export const PreferencesSchema = z.object({
  theme: ThemeSchema,
  soundEnabled: z.boolean(),
  hintsEnabled: z.boolean(),
  difficulty: DifficultySchema,
  gridSize: GridSizeSchema,
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
});

export type UserPreferences = z.infer<typeof PreferencesSchema>;

/**
 * Progress data schema
 * Used for tracking user progress
 */
export const ProgressDataSchema = z.object({
  gridSize: GridSizeSchema,
  difficulty: DifficultySchema,
  completed: z.boolean(),
  time: z.number().int().min(0).max(86400000, {
    message: 'Time must be between 0 and 24 hours in milliseconds',
  }),
  hintsUsed: z.number().int().min(0).max(100, {
    message: 'Hints used must be between 0 and 100',
  }),
  timestamp: z.number().int().positive(),
});

export type ProgressData = z.infer<typeof ProgressDataSchema>;

/**
 * Achievement data schema
 * Used for tracking achievements
 */
export const AchievementSchema = z.object({
  id: z.string().max(50),
  unlockedAt: z.number().int().positive(),
  gridSize: GridSizeSchema.optional(),
  difficulty: DifficultySchema.optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

/**
 * Notification data schema
 * Used for push notifications
 */
export const NotificationSchema = z.object({
  title: z.string().min(1).max(100, {
    message: 'Title must be between 1 and 100 characters',
  }),
  body: z.string().min(1).max(500, {
    message: 'Body must be between 1 and 500 characters',
  }),
  icon: z.string().max(200).optional(),
  badge: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
});

export type NotificationData = z.infer<typeof NotificationSchema>;

/**
 * LocalStorage data schema
 * Used for validating data read from localStorage
 */
export const LocalStorageDataSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in semver format (e.g., 1.0.0)',
  }),
  preferences: PreferencesSchema.optional(),
  progress: z.array(ProgressDataSchema).optional(),
  achievements: z.array(AchievementSchema).optional(),
  lastUpdated: z.number().int().positive(),
});

export type LocalStorageData = z.infer<typeof LocalStorageDataSchema>;

/**
 * Validate and parse input with Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate input with Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Success result with data or error result
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result as
    | { success: true; data: T }
    | { success: false; error: z.ZodError };
}
