import {
  AcademicMonitoringStatus,
  SemesterStatus,
} from '../generated/prisma/client';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';
import { ReportsService } from './reports.service';

describe('ReportsService academic weeks', () => {
  const lifecycle = new SemesterLifecycleService({} as never);
  const service = new ReportsService({} as never, {} as never, lifecycle);
  const assertReportWeekAvailable = (
    service as unknown as {
      assertReportWeekAvailable: (
        placement: {
          academicStatus: AcademicMonitoringStatus;
          startDate: Date | null;
          endDate: Date | null;
          semester: {
            id: string;
            status: SemesterStatus;
            startDate: Date;
            endDate: Date;
          };
        },
        week: number,
        now: Date,
      ) => void;
    }
  ).assertReportWeekAvailable.bind(service);
  const placement = {
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-30T23:59:59.999Z'),
    semester: {
      id: 'semester-1',
      status: SemesterStatus.MONITORING,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
    },
  };

  it('allows elapsed weeks including a missed earlier week', () => {
    const now = new Date('2026-09-10T12:00:00.000Z');
    expect(() => assertReportWeekAvailable(placement, 1, now)).not.toThrow();
    expect(() => assertReportWeekAvailable(placement, 2, now)).not.toThrow();
  });

  it('rejects a future week', () => {
    expect(() =>
      assertReportWeekAvailable(
        placement,
        3,
        new Date('2026-09-10T12:00:00.000Z'),
      ),
    ).toThrow('Week 3 has not started yet');
  });

  it('rejects submissions after the placement monitoring end', () => {
    expect(() =>
      assertReportWeekAvailable(
        placement,
        1,
        new Date('2026-10-01T00:00:00.000Z'),
      ),
    ).toThrow('only be submitted during this placement monitoring window');
  });
});
