import { z } from 'zod'

export function fixEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((item) => (item === '' ? undefined : item), schema)
}

export function getOrThrow<T>(
  input: undefined extends T ? T : null extends T ? T : never,
) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (input === null || input === undefined) {
    throw new Error(`The value is undefined`)
  }

  return input
}

export function getLogMatcher(logs: string) {
  const matches = logs.matchAll(
    /upload: (?<from>.*)\/.* to s3:\/\/(?<to>[^/]+)(?<path>\/.*)/g,
  )
  return [...matches]
    .map((match) => match.groups?.['path'])
    .filter(Boolean) as string[]
}
