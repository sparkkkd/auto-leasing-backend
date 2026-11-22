import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Prisma, AuditAction, EntityType } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { AuthenticatedRequest } from 'src/common/types';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    if (!request.user) {
      return next.handle();
    }

    if (request.url.startsWith('/auth/')) {
      return next.handle();
    }

    const entityType = this.extractEntityType(request.url);
    if (!entityType) {
      return next.handle();
    }

    const action = this.extractAction(method);
    const user = request.user;
    const entityId = this.extractEntityId(request.url, method);
    const ipAddress = this.getIpAddress(request);

    const rawUserAgent = request.headers['user-agent'];
    const userAgent =
      typeof rawUserAgent === 'string' ? rawUserAgent : undefined;

    return next.handle().pipe(
      tap((responseData: unknown) => {
        const res = responseData as Record<string, unknown> | undefined;

        const changes = this.extractChanges(
          method,
          request.body as Record<string, unknown> | undefined,
          res,
        );

        const getSafeId = (
          obj: Record<string, unknown> | undefined,
        ): string => {
          if (typeof obj?.id === 'string') return obj.id;
          if (typeof obj?.id === 'number') return String(obj.id);
          return 'unknown';
        };
        const finalEntityId = entityId || getSafeId(res);

        this.auditLogService
          .create({
            userId: user.id,
            action,
            entityType,
            entityId: finalEntityId,
            changes,
            ipAddress,
            userAgent,
          })
          .catch((error: unknown) => {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error('Failed to write audit log:', errorMessage);
          });
      }),
    );
  }

  private extractEntityType(url: string): EntityType | null {
    const segments = url.split('/').filter(Boolean);
    const resource = segments[0];

    const mapping: Record<string, EntityType> = {
      users: 'USER',
      clients: 'CLIENT',
      investors: 'INVESTOR',
      cars: 'CAR',
      deals: 'DEAL',
      payments: 'PAYMENT',
      documents: 'DOCUMENT',
    };

    return mapping[resource] || null;
  }

  private extractAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PATCH':
      case 'PUT':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UPDATE';
    }
  }

  private extractEntityId(url: string, method: string): string | null {
    if (['PATCH', 'PUT', 'DELETE'].includes(method)) {
      const segments = url.split('/').filter(Boolean);
      return segments[segments.length - 1] || null;
    }
    return null;
  }

  private getIpAddress(request: AuthenticatedRequest): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }
    return request.ip;
  }

  private extractChanges(
    method: string,
    body: Record<string, unknown> | undefined,
    responseData: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue {
    const getSafeId = (obj: Record<string, unknown> | undefined): string => {
      if (typeof obj?.id === 'string') return obj.id;
      if (typeof obj?.id === 'number') return String(obj.id);
      return 'unknown';
    };

    switch (method) {
      case 'POST': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeBody } = body || {};
        return { created: safeBody } as Prisma.InputJsonValue;
      }
      case 'PATCH':
      case 'PUT': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password, ...safeUpdate } = body || {};
        return { updated: safeUpdate } as Prisma.InputJsonValue;
      }
      case 'DELETE': {
        return {
          deleted: { id: getSafeId(responseData) },
        };
      }
      default:
        return {};
    }
  }
}
