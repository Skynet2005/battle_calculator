import { z } from 'zod';

/**
 * Environment variable schema with validation
 * Validates all required environment variables at startup.
 * When NODE_ENV is 'test', DATABASE_URL and AUTH_SECRET are optional and default to 'test'
 * so Vitest can run without a real .env. Integration tests that need the DB still require a real .env.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  GAME_AUTH_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let env: {
  DB_URL: string;
  AUTH_SECRET: string;
  NEXTAUTH_SECRET: string | undefined;
  GAME_AUTH_SECRET: string | undefined;
  NODE_ENV: Env['NODE_ENV'];
};

try {
  const parsed = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GAME_AUTH_SECRET: process.env.GAME_AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  });

  const isTest = parsed.NODE_ENV === 'test';
  env = {
    DB_URL: parsed.DATABASE_URL ?? (isTest ? 'test' : ''),
    AUTH_SECRET: parsed.AUTH_SECRET ?? (isTest ? 'test'.padEnd(32, '0') : ''),
    NEXTAUTH_SECRET: parsed.NEXTAUTH_SECRET,
    GAME_AUTH_SECRET: parsed.GAME_AUTH_SECRET,
    NODE_ENV: parsed.NODE_ENV,
  };

  if (!isTest && (!parsed.DATABASE_URL || !parsed.AUTH_SECRET)) {
    throw new Error(
      'DATABASE_URL and AUTH_SECRET are required when NODE_ENV is not "test". AUTH_SECRET must be at least 32 characters.'
    );
  }
  if (!isTest && parsed.DATABASE_URL && !z.string().url().safeParse(parsed.DATABASE_URL).success) {
    throw new Error('DATABASE_URL must be a valid URL');
  }
  if (!isTest && parsed.AUTH_SECRET && parsed.AUTH_SECRET.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters');
  }
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
  DB_URL: env.DB_URL,
  AUTH_SECRET: env.AUTH_SECRET,
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
  GAME_AUTH_SECRET: env.GAME_AUTH_SECRET,
  NODE_ENV: env.NODE_ENV,
} as const;
