import { JwtService } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: { verify: jest.Mock };

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    gateway = new RealtimeGateway(jwtService as unknown as JwtService);
  });

  it('joins tenant room after a valid JWT', async () => {
    jwtService.verify.mockReturnValue({ tenant_id: 'tenant-1' });
    const client = {
      data: {},
      handshake: { auth: { token: 'valid-token' } },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as any);

    expect(client.join).toHaveBeenCalledWith('tenant:tenant-1');
  });

  it('disconnects clients without a valid tenant', async () => {
    jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
    const client = {
      data: {},
      handshake: { auth: { token: 'bad-token' } },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as any);

    expect(client.emit).toHaveBeenCalledWith('authenticated', { ok: false });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('joins a site room only for an authenticated tenant', () => {
    const client = { data: { tenantId: 'tenant-1' }, join: jest.fn() };
    gateway.subscribeSite(client as any, 'site-1');
    expect(client.join).toHaveBeenCalledWith('site:tenant-1:site-1');
  });
});
