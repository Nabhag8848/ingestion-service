/// <reference types="multer" />

export interface AppCookies extends Record<string, string | undefined> {
  access_token: string | null;
}

declare global {
  namespace Express {
    interface Request {
      cookies: AppCookies;
    }
  }
}

export {};
