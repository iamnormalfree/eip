// ABOUTME: Resume token generation for re-entering chat conversations.
// ABOUTME: Issues signed JWT with conversation UUID and email hash for validation.

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

interface ResumeTokenPayload {
  conversationUuid: string;
  emailHash: string;
  exp: number;
}

/**
 * Generate a resume token for a conversation
 * @param conversationUuid - Secure UUID for the conversation
 * @param email - User email for validation
 * @param expiryHours - Token expiry in hours (default 24)
 * @returns Signed JWT token
 */
export async function generateResumeToken(
  conversationUuid: string,
  email: string,
  expiryHours: number = 24
): Promise<string> {
  if (!conversationUuid || !email) {
    throw new Error('conversationUuid and email are required');
  }
  
  // Hash email for privacy
  const crypto = require('crypto');
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  
  const token = await new SignJWT({
    conversationUuid,
    emailHash,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiryHours}h`)
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a resume token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyResumeToken(
  token: string
): Promise<ResumeTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload as unknown as ResumeTokenPayload; // Type assertion via unknown due to JWT type mismatch
  } catch (error) {
    console.error('❌ Invalid resume token:', error);
    return null;
  }
}
