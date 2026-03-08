import { execa, type Options } from 'execa';

export type RunExeca = (
  file: string,
  args?: readonly string[],
  options?: Options,
) => ReturnType<typeof execa>;

export const runExeca: RunExeca = (file, args, options) =>
  execa(file, args, options);
