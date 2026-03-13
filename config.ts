// Use relative paths for API calls so it works automatically on Vercel, AI Studio, and local dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
