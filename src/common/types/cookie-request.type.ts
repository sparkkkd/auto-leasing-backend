import { Request } from 'express';

export interface CookieRequest extends Request {
  cookies: {
    refreshToken?: string;
    [key: string]: string | undefined;
  };
}
