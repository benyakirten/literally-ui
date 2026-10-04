import type { ComplexAttributeConverter } from 'lit';

/**
 * Parse a series of items into an array. It accepts arrays that
 * start with start and end with `[`, `]`; `{`, `}` or no wrapper.
 *
 * By default it passes these values to JSON.parse, but it can be customized.
 * Validation by default always returns true, but it can be customized (e.g. with Zod)
 */
export function normalizeArray<T>(
  options: {
    validator?: (items: T[]) => boolean;
    parser?: (data: string) => T[];
  } = {},
): ComplexAttributeConverter<T[]> {
  let { validator, parser } = options;
  validator ??= () => true;
  parser ??= JSON.parse;

  const toAttribute = (v: T[]) => v.join(',');
  const fromAttribute = (v: string) => {
    const normalized = v.replace(/^\[|\{/, '').replace(/\]|\}$/, '');
    try {
      const vals = parser(`[${normalized}]`);
      if (!validator(vals)) {
        throw new Error();
      }

      return vals;
    } catch {
      throw new Error(`Unable to parse ${v} into an array`);
    }
  };
  return { toAttribute, fromAttribute };
}
