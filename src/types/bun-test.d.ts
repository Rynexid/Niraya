declare module "bun:test" {
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function test(
    name: string,
    opts: { skip?: boolean; only?: boolean },
    fn: () => void | Promise<void>
  ): void;
  export function expect<T>(actual: T): {
    toBe(expected: T): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeNull(): void;
    toBeTrue(): void;
    toBeFalse(): void;
    toBeGreaterThanOrEqual(expected: number | bigint): void;
    toBeGreaterThan(expected: number | bigint): void;
    toBeLessThanOrEqual(expected: number | bigint): void;
    toBeLessThan(expected: number | bigint): void;
    toEqual(expected: unknown): void;
    toContain(item: unknown): void;
    toHaveLength(expected: number): void;
    toMatchObject(expected: object): void;
    not: {
      toBe(expected: T): void;
      toBeUndefined(): void;
      toBeDefined(): void;
      toBeGreaterThanOrEqual(expected: number | bigint): void;
    };
  };
  export const describe: (
    name: string,
    fn: () => void
  ) => void;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  export const beforeAll: (fn: () => void | Promise<void>) => void;
  export const afterAll: (fn: () => void | Promise<void>) => void;
}
