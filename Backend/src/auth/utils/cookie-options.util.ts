import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function getRefreshCookieOptions(config: ConfigService): CookieOptions {
  const maxAge = config.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN_SECONDS');
  const sameSite = config.get<'lax' | 'strict' | 'none'>(
    'COOKIE_SAME_SITE',
    'lax',
  );

  return {
    httpOnly: true,
    secure: config.get<string>('NODE_ENV') === 'production',
    sameSite,
    path: '/api/v1/auth',
    maxAge: maxAge * 1000,
  };
}

export function getClearRefreshCookieOptions(
  config: ConfigService,
): CookieOptions {
  const options = getRefreshCookieOptions(config);
  return {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  };
}

export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();
    if (key !== name) {
      continue;
    }

    const value = part.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}
