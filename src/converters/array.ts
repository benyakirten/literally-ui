import type { ComplexAttributeConverter } from 'lit';

export function arrayLike<T>(
  parser: (item: string) => T,
): ComplexAttributeConverter<T[]> {
  const toAttribute = (v: T[]) => v.join(',');
  const fromAttribute = (v: string) =>
    v
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((i) => parser(i.trim()));
  return { toAttribute, fromAttribute };
}
