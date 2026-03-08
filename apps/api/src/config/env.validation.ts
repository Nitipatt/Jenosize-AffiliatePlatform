/**
 * Validates that all required environment variables are set.
 * Call this before NestFactory.create() to fail fast on misconfiguration.
 */
export function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nPlease check your .env file or environment configuration.`,
    );
  }
}
