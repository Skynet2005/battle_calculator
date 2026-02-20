import { z } from 'zod';

/**
 * Reusable Zod schemas for API validation
 */

/**
 * Password validation schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Authentication schemas
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * User profile update schema
 */
export const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: passwordSchema.optional(),
}).refine((data) => {
  // If changing password, both current and new must be provided
  if (data.newPassword !== undefined) {
    return data.currentPassword !== undefined;
  }
  return true;
}, {
  message: 'Current password is required when changing password',
  path: ['currentPassword'],
}).refine((data) => {
  // At least one field must be provided
  return data.username !== undefined || data.email !== undefined || data.newPassword !== undefined;
}, {
  message: 'At least one field (username, email, or password) must be provided',
});

/**
 * Profile schemas
 */
export const createProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  data: z.record(z.unknown()),
  setCurrent: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  data: z.record(z.unknown()).optional(),
  setCurrent: z.boolean().optional(),
});

/**
 * Profile state schema
 */
export const profileStateSchema = z.object({
  currentProfileId: z.string().uuid('Invalid profile ID').nullable(),
});

/**
 * Joiner search query schema
 */
export const joinerSearchQuerySchema = z.object({
  query: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  heroClass: z.enum(['infantry', 'lancer', 'marksman']).optional(),
});

/**
 * Battle result schemas
 */
export const saveBattleResultSchema = z.object({
  inputHash: z.string().min(1, 'Input hash is required').max(256),
  requestJson: z.record(z.unknown()),
  responseSummaryJson: z.record(z.unknown()).optional(),
  timelineJson: z.record(z.unknown()).optional(),
  metricsJson: z.record(z.unknown()).optional(),
  rationaleJson: z.record(z.unknown()).optional(),
  reportJson: z.record(z.unknown()).optional(),
});

// Re-export for backward compatibility (if used elsewhere)
export { joinerSearchQuerySchema as JoinerSearchQuerySchema };

