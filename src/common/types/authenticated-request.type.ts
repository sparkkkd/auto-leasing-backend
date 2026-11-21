import { User } from '@prisma/client';
import { CookieRequest } from './cookie-request.type';

export interface AuthenticatedRequest extends CookieRequest {
  user: User;
}
