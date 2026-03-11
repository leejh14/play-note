import { EntityManager, LockMode } from '@mikro-orm/core';
import { MikroSessionRepository } from './mikro-session.repository';
import { SessionOrmEntity } from './session.orm-entity';

describe('MikroSessionRepository', () => {
  it('locks the session row when reading for update', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as EntityManager;
    const repository = new MikroSessionRepository(em);

    await repository.findByIdForUpdate('session-1');

    expect(em.findOne).toHaveBeenCalledWith(
      SessionOrmEntity,
      { id: 'session-1' },
      {
        populate: ['attendances', 'teamPresetMembers'],
        lockMode: LockMode.PESSIMISTIC_WRITE,
      },
    );
  });
});
