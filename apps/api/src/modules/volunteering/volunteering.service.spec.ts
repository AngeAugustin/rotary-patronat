import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleCode } from '@rotary/shared-types';
import { VolunteeringService } from './volunteering.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('VolunteeringService', () => {
  const memberUser = {
    id: 'user-1',
    email: 'member@test.bj',
    firstName: 'Marie',
    lastName: 'Dossou',
    roles: [RoleCode.MEMBER],
    isActive: true,
  };

  const adminUser = {
    id: 'admin-1',
    email: 'admin@test.bj',
    firstName: 'Admin',
    lastName: 'User',
    roles: [RoleCode.ADMIN],
    isActive: true,
  };

  const prisma = {
    volunteeringDeclaration: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const logsService = { logActivity: jest.fn() } as unknown as LogsService;
  const notificationsService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  } as unknown as NotificationsService;
  const realtimeService = { notifyUser: jest.fn() } as unknown as RealtimeService;

  const service = new VolunteeringService(
    prisma,
    logsService,
    notificationsService,
    realtimeService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects review from non-admin users', async () => {
    await expect(
      service.review(memberUser, 'decl-1', { status: 'VALIDATED' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a rejection reason when status is REJECTED', async () => {
    prisma.volunteeringDeclaration.findUnique = jest.fn().mockResolvedValue({
      id: 'decl-1',
      userId: 'user-1',
      user: memberUser,
      validatedBy: null,
      visitedClub: 'Club Test',
      hours: 2,
    });

    await expect(
      service.review(adminUser, 'decl-1', { status: 'REJECTED' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates a declaration for admins', async () => {
    const declaration = {
      id: 'decl-1',
      userId: 'user-1',
      user: memberUser,
      validatedBy: adminUser,
      visitedClub: 'Club Test',
      city: 'Cotonou',
      country: 'Bénin',
      activity: 'Visite',
      description: 'Description',
      date: new Date('2025-01-01'),
      startTime: '09:00',
      durationMinutes: 120,
      hours: 2,
      proofUrl: null,
      status: 'VALIDATED',
      validatedAt: new Date(),
      rejectionReason: null,
      createdAt: new Date(),
    };

    prisma.volunteeringDeclaration.findUnique = jest.fn().mockResolvedValue(declaration);
    prisma.volunteeringDeclaration.update = jest.fn().mockResolvedValue(declaration);

    const result = await service.review(adminUser, 'decl-1', { status: 'VALIDATED' });

    expect(result.status).toBe('VALIDATED');
    expect(notificationsService.create).toHaveBeenCalled();
    expect(realtimeService.notifyUser).toHaveBeenCalledWith('user-1', { id: 'notif-1' });
  });

  it('throws when declaration is missing', async () => {
    prisma.volunteeringDeclaration.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.review(adminUser, 'missing', { status: 'VALIDATED' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
