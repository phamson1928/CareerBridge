const integerSettings = {
  PORT: 3000,
  JWT_EXPIRES_IN_SECONDS: 900,
  JWT_REFRESH_EXPIRES_IN_SECONDS: 604800,
  BCRYPT_ROUNDS: 12,
  THROTTLE_LIMIT: 60,
  SIGNED_URL_EXPIRES_IN_SECONDS: 300,
} as const;

const allowedNodeEnvironments = new Set(['development', 'test', 'production']);
const allowedSameSiteValues = new Set(['lax', 'strict', 'none']);

export function validateEnvironment(
  rawConfig: Record<string, unknown>,
): Record<string, unknown> {
  const config = { ...rawConfig };

  requireNonEmptyString(config, 'DATABASE_URL');
  requireNonEmptyString(config, 'JWT_SECRET');
  config.SMTP_HOST = requireNonEmptyString(config, 'SMTP_HOST');
  config.SMTP_USER = requireNonEmptyString(config, 'SMTP_USER');
  config.SMTP_PASS = requireNonEmptyString(config, 'SMTP_PASS');
  config.SMTP_FROM = requireNonEmptyString(config, 'SMTP_FROM');
  config.SMTP_PORT = parsePositiveInteger(config.SMTP_PORT, 'SMTP_PORT', 587);
  config.SMTP_SECURE = parseBoolean(config.SMTP_SECURE, 'SMTP_SECURE', false);

  for (const [key, defaultValue] of Object.entries(integerSettings)) {
    config[key] = parsePositiveInteger(config[key], key, defaultValue);
  }

  const nodeEnvironment = readOptionalString(config.NODE_ENV, 'development');
  if (!allowedNodeEnvironments.has(nodeEnvironment)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  config.NODE_ENV = nodeEnvironment;

  config.FRONTEND_URL = readOptionalString(
    config.FRONTEND_URL,
    'http://localhost:5173',
  ).replace(/\/+$/, '');

  config.FILES_BUCKET = readOptionalString(
    config.FILES_BUCKET,
    'internhub-files',
  );
  const supabaseUrl = readOptionalString(config.SUPABASE_URL, '');
  const supabaseServiceKey = readOptionalString(
    config.SUPABASE_SERVICE_KEY,
    '',
  );
  if (Boolean(supabaseUrl) !== Boolean(supabaseServiceKey)) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured together',
    );
  }
  config.SUPABASE_URL = supabaseUrl;
  config.SUPABASE_SERVICE_KEY = supabaseServiceKey;

  const sameSite = readOptionalString(
    config.COOKIE_SAME_SITE,
    'lax',
  ).toLowerCase();
  if (!allowedSameSiteValues.has(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
  }
  if (nodeEnvironment === 'production' && sameSite === 'none') {
    config.COOKIE_SAME_SITE = 'none';
  } else {
    config.COOKIE_SAME_SITE = sameSite;
  }

  const bcryptRounds = config.BCRYPT_ROUNDS as number;
  if (bcryptRounds < 10 || bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
  }

  return config;
}

function requireNonEmptyString(
  config: Record<string, unknown>,
  key: string,
): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} is required`);
  }
  config[key] = value.trim();
  return value.trim();
}

function parsePositiveInteger(
  value: unknown,
  key: string,
  defaultValue: number,
): number {
  const parsed = Number(value ?? defaultValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

function readOptionalString(value: unknown, defaultValue: string): string {
  return typeof value === 'string' ? value : defaultValue;
}

function parseBoolean(
  value: unknown,
  key: string,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === '') return defaultValue;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${key} must be true or false`);
}
