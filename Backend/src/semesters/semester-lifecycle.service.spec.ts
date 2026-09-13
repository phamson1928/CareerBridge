import { SemesterStatus } from '../generated/prisma/client';
import { SemesterLifecycleService } from './semester-lifecycle.service';

describe('SemesterLifecycleService', () => {
  const lifecycle = new SemesterLifecycleService({} as never);
  const campaign = {
    id: 'campaign-1',
    status: SemesterStatus.UPCOMING,
    startDate: new Date('2026-03-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T00:00:00.000Z'),
  };

  it('opens recruitment exactly one calendar month before monitoring starts', () => {
    expect(lifecycle.recruitmentStart(campaign.startDate)).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    );
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-01-31T23:59:59.000Z')),
    ).toBe('UPCOMING');
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-02-01T00:00:00.000Z')),
    ).toBe('RECRUITING');
  });

  it('ends recruitment when academic monitoring starts', () => {
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-03-01T00:00:00.000Z')),
    ).toBe('MONITORING');
  });

  it('keeps the end date inside the monitoring period', () => {
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-06-30T23:59:59.000Z')),
    ).toBe('MONITORING');
    expect(
      lifecycle.phaseOf(campaign, new Date('2026-07-01T00:00:00.000Z')),
    ).toBe('COMPLETED');
  });

  it('treats a cancelled campaign as terminal regardless of its dates', () => {
    expect(
      lifecycle.phaseOf(
        { ...campaign, status: SemesterStatus.CANCELLED },
        new Date('2026-02-15T00:00:00.000Z'),
      ),
    ).toBe('CANCELLED');
  });
});
