/**
 * Centralized API Configuration for F1 Terminal.
 *
 * NEXT_PUBLIC_API_URL is baked into the JS bundle at build time.
 * In Docker, pass it as a build-arg:
 *   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.f1.yourdomain.com .
 *
 * For local dev, it falls back to http://localhost:8000.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
