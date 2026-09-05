import { Role } from '../generated/prisma/client';
import { PlacementsService } from '../placements/placements.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { ApplicationsService } from './applications.service';

type AcceptanceTestService = {
  accept: (
    id: string,
    user: AuthUser,
    feedback: string | null,
  ) => Promise<unknown>;
  acceptOnce: (
    id: string,
    user: AuthUser,
    feedback: string | null,
  ) => Promise<unknown>;
};

describe('ApplicationsService acceptance retry', () => {
  const companyUser: AuthUser = {
    id: 'company-user-id',
    email: 'company@example.com',
    role: Role.COMPANY,
  };

  it('retries serializable transaction conflicts before succeeding', async () => {
    const service = new ApplicationsService(
      {} as PrismaService,
      {} as PlacementsService,
      {} as NotificationsService,
    );
    const retryableService = service as unknown as AcceptanceTestService;
    const acceptOnce = jest
      .spyOn(retryableService, 'acceptOnce')
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValueOnce({ id: 'application-id', status: 'ACCEPTED' });

    const result = await retryableService.accept(
      'application-id',
      companyUser,
      null,
    );

    expect(acceptOnce).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ id: 'application-id', status: 'ACCEPTED' });
  });
});
