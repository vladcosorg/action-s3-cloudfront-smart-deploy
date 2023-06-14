import { z } from 'zod'

export function fixEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((item) => (item === '' ? undefined : item), schema)
}
