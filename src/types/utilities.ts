/**
 * Utility types library for common patterns
 */

/**
 * Make specific keys optional
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys required
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make all keys readonly recursively
 */
export type DeepReadonly<T> = T extends primitive
  ? T
  : T extends Array<infer U>
  ? DeepReadonlyArray<U>
  : T extends Map<infer K, infer V>
  ? DeepReadonlyMap<K, V>
  : T extends Set<infer M>
  ? DeepReadonlySet<M>
  : DeepReadonlyObject<T>;

type primitive = string | number | boolean | bigint | symbol | undefined | null;
type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;
type DeepReadonlyMap<K, V> = ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>;
type DeepReadonlySet<T> = ReadonlySet<DeepReadonly<T>>;
type DeepReadonlyObject<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Mutable version of readonly type
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Union to intersection
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Get union type of all values in object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Exact type - prevents extra properties
 */
export type Exact<T, U extends T> = T & {
  [K in keyof U]: K extends keyof T ? U[K] : never;
};

/**
 * XOR type - exactly one of the properties must be present
 */
export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

/**
 * Pretty print type - flattens intersections for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Function types
 */
export type AnyFunction = (...args: any[]) => any;
export type VoidFunction = () => void;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * Promise type helpers
 */
export type Awaitable<T> = T | Promise<T>;
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

/**
 * Array type helpers
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Tuple type helpers
 */
export type Head<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never;
export type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];
export type Length<T extends readonly any[]> = T['length'];

/**
 * String literal helpers
 */
export type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends ''
  ? []
  : S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

export type Join<T extends readonly string[], D extends string = ''> = T extends readonly []
  ? ''
  : T extends readonly [string]
  ? T[0]
  : T extends readonly [string, ...infer R]
  ? R extends readonly string[]
    ? `${T[0]}${D}${Join<R, D>}`
    : never
  : string;

/**
 * Type assertion functions
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is AnyFunction {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) && 'then' in value && isFunction(value.then))
  );
}