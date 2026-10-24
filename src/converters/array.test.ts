import { describe, expect, it } from 'vitest';
import { normalizeArray } from './array';

describe('normalizeArray', () => {
  describe('toAttribute', () => {
    it.each([
      {
        input: '{"one","two","three"}',
        want: ['one', 'two', 'three'],
      },
      {
        input: '["one","two","three"]',
        want: ['one', 'two', 'three'],
      },
      {
        input: '"one","two","three"',
        want: ['one', 'two', 'three'],
      },
      {
        input:
          '[{ "key1": "value2", "key2": ["one", "two", 3] }, ["one", "two", "three"]]',
        want: [
          {
            key1: 'value2',
            key2: ['one', 'two', 3],
          },
          ['one', 'two', 'three'],
        ],
      },
    ])('should parse $input into $want', ({ input, want }) => {
      const { fromAttribute } = normalizeArray();
      const got = fromAttribute!(input);
      expect(got).toEqual(want);
    });
  });
});
