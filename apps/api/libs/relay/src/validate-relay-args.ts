import { ConnectionArgsDto } from './connection-args.dto';

export const RELAY_MAX_FIRST = 100;

export function validateRelayArgs(
  args: ConnectionArgsDto,
  maxSize: number = RELAY_MAX_FIRST,
): void {
  if (args.first !== undefined && args.last !== undefined) {
    throw new Error('first와 last를 동시에 사용할 수 없습니다.');
  }

  if (args.after !== undefined && args.before !== undefined) {
    throw new Error('after와 before를 동시에 사용할 수 없습니다.');
  }

  if (args.first !== undefined && args.first < 0) {
    throw new Error('first는 0 이상이어야 합니다.');
  }

  if (args.last !== undefined && args.last < 0) {
    throw new Error('last는 0 이상이어야 합니다.');
  }

  if (args.first !== undefined && args.first > maxSize) {
    throw new Error(`first는 ${maxSize}를 초과할 수 없습니다.`);
  }

  if (args.last !== undefined && args.last > maxSize) {
    throw new Error(`last는 ${maxSize}를 초과할 수 없습니다.`);
  }

  if (
    args.first === undefined &&
    args.last === undefined
  ) {
    throw new Error('first 또는 last 중 하나는 반드시 지정해야 합니다.');
  }
}
