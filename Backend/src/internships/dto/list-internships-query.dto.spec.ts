import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListInternshipsQueryDto } from './list-internships-query.dto';

describe('ListInternshipsQueryDto', () => {
  it('normalizes comma-separated skill IDs and removes duplicates', async () => {
    const dto = plainToInstance(ListInternshipsQueryDto, {
      skillIds: 'skill-a, skill-b,skill-a',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.skillIds).toEqual(['skill-a', 'skill-b']);
  });

  it('accepts skill IDs supplied as repeated query values', async () => {
    const dto = plainToInstance(ListInternshipsQueryDto, {
      skillIds: ['skill-a', 'skill-b'],
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.skillIds).toEqual(['skill-a', 'skill-b']);
  });
});
