import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config/env';

const secret = config.AUTH_SECRET;

const secretKey = new TextEncoder().encode(secret);

export const authCookieOptions = () => ({
  name: 'auth_token',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

export const clearAuthCookie = () => ({
  ...authCookieOptions(),
  value: '',
  maxAge: 0,
});

type TokenUser = {
  id: string;
  email: string;
  username: string;
};

export async function signAuthToken(user: TokenUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);

  return {
    id: (payload.sub as string) ?? '',
    email: (payload.email as string) ?? '',
    username: (payload.username as string) ?? '',
  };
}
