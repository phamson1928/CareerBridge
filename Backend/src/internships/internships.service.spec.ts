import { InternshipsService } from './internships.service';
import { ListInternshipsQueryDto } from './dto/list-internships-query.dto';
import { SemesterStatus } from '../generated/prisma/client';

describe('InternshipsService skill filters', () => {
  const service = new InternshipsService({} as never, {} as never);
  const buildWhere = (
    service as unknown as {
      buildWhere: (query: ListInternshipsQueryDto) => unknown;
    }
  ).buildWhere.bind(service);

  it('requires an internship to contain every selected skill', () => {
    const where = buildWhere({
      page: 1,
      limit: 20,
      skillIds: ['skill-a', 'skill-b'],
    });

    expect(where).toEqual({
      AND: [
        { skills: { some: { skillId: 'skill-a' } } },
        { skills: { some: { skillId: 'skill-b' } } },
      ],
    });
  });

  it('keeps the legacy single skill filter compatible', () => {
    const where = buildWhere({
      page: 1,
      limit: 20,
      skillId: 'skill-a',
    });

    expect(where).toEqual({
      AND: [{ skills: { some: { skillId: 'skill-a' } } }],
    });
  });

  it('limits public listings to approved companies when requested', () => {
    const where = (buildWhere as (query: ListInternshipsQueryDto, status?: unknown, companyId?: string, onlyApprovedCompany?: boolean) => unknown)(
      { page: 1, limit: 20 },
      undefined,
      undefined,
      true,
    );

    expect(where).toEqual({ company: { status: 'APPROVED' } });
  });
});

describe('InternshipsService academic date validation', () => {
  const service = new InternshipsService({} as never, {} as never);
  const validateDates = (
    service as unknown as {
      validateDates: (
        dates: {
          deadline?: Date | null;
          startDate?: Date | null;
          endDate?: Date | null;
        },
        semester: {
          id: string;
          status: SemesterStatus;
          startDate: Date;
          endDate: Date;
        },
      ) => void;
    }
  ).validateDates.bind(service);
  const semester = {
    id: 'semester-1',
    status: SemesterStatus.RECRUITING,
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T23:59:59.999Z'),
  };

  it('accepts either a complete proposed range or no proposed range', () => {
    expect(() => validateDates({}, semester)).not.toThrow();
    expect(() =>
      validateDates(
        {
          deadline: new Date('2026-09-09T23:59:59.999Z'),
          startDate: new Date('2026-09-10T00:00:00.000Z'),
          endDate: new Date('2026-12-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).not.toThrow();
  });

  it('rejects an incomplete or out-of-campaign range', () => {
    expect(() =>
      validateDates(
        { startDate: new Date('2026-09-10T00:00:00.000Z') },
        semester,
      ),
    ).toThrow('Provide both startDate and endDate');
    expect(() =>
      validateDates(
        {
          startDate: new Date('2026-08-31T00:00:00.000Z'),
          endDate: new Date('2026-10-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).toThrow('must stay within the campaign monitoring window');
  });

  it('requires the application deadline to be before the proposed start', () => {
    expect(() =>
      validateDates(
        {
          deadline: new Date('2026-09-10T00:00:00.000Z'),
          startDate: new Date('2026-09-10T00:00:00.000Z'),
          endDate: new Date('2026-10-01T23:59:59.999Z'),
        },
        semester,
      ),
    ).toThrow('Deadline must be before');
  });
});
