import { z } from 'zod';

/**
 * Environment variable schema with validation
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(
      `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env.local file.`
    );
  }
  throw error;
}

export const config = {
  DB_URL: env.DATABASE_URL,
  AUTH_SECRET: env.AUTH_SECRET,
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
  NODE_ENV: env.NODE_ENV,
} as const;
