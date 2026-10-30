import argon2 from 'argon2';

/**
 * Hash a plaintext password securely using Argon2id.
 * Adheres to OWASP recommendations (64MB memory, 3 iterations, 4 lanes).
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against a stored Argon2id hash.
 * Constant-time comparison performed internally by Argon2.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
