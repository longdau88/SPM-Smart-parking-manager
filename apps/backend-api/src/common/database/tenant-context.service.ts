import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId?: string;
  userId?: string;
  userType?: string;
}

@Injectable()
export class TenantContextService {
  private static readonly storage = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, callback: () => Promise<any>): Promise<any> {
    return TenantContextService.storage.run(context, callback);
  }

  getTenantId(): string | undefined {
    return TenantContextService.storage.getStore()?.tenantId;
  }

  getUserId(): string | undefined {
    return TenantContextService.storage.getStore()?.userId;
  }

  getContext(): TenantContext | undefined {
    return TenantContextService.storage.getStore();
  }
}
