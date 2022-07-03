export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

export type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T // from lodash

// https://stackoverflow.com/questions/47632622/typescript-and-filter-boolean?answertab=trending#tab-top
export function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}
