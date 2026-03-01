/**
 * Centralized API Configuration for F1 Terminal.
 *
 * NEXT_PUBLIC_API_URL is baked at BUILD TIME by Next.js.
 * In development: defaults to http://localhost:8000
 * In production:  must be set via Docker build-arg or .env.production
 *                 e.g., https://f1-api.shuoguo.org
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export { API_BASE_URL };
