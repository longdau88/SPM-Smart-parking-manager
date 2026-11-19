import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class RlsContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.user as any)?.tenant_id;
    const userId = (req.user as any)?.id;
    const userType = (req.user as any)?.user_type;

    this.tenantContextService.run({ tenantId, userId, userType }, async () => {
      next();
    });
  }
}
