import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    // Prioritize tenant from authenticated user, fallback to header
    return request.user?.tenant_id || request.headers['x-tenant-id'];
  },
);
