import * as fs from 'node:fs'
import path from 'node:path'

import { z } from 'zod'

import type { KebabCase } from 'type-fest'

export enum InvalidationStrategy {
  BALANCED = 'balanced',
  FRUGAL = 'frugal',
  PRECISE = 'precise',
}

export const inputSchemaValidator = z.object({
  fromLocalPath: z
    .string()
    .trim()
    .min(1)
    .describe('nooo')
    .refine(
      (value) => fs.existsSync(path.resolve(value)),
      (value) => ({ message: `The path '${value}' does not exist` }),
    ),
  toS3Uri: z.string().trim().min(7).startsWith('s3://').endsWith('/'),
  extraArguments: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value || value.length === 0) {
        return []
      }

      return value
        .split(' ')
        .map((item) => item.trim())
        .filter((item) => item.length)
    })
    .pipe(z.string().array()),
  distributionId: z.string().optional(),
  invalidationStrategy: z
    .nativeEnum(InvalidationStrategy)
    .default(InvalidationStrategy.BALANCED)
    .describe(
      ' The balanced strategy will attempt to use the maximize-precision approach unless there are [limit] or more targets. \n' +
        'In that case it will switch to the minimize-invalidations strategy.',
    ),
  balancedLimit: z.coerce.number().int().positive().default(5),
})

export type InputSchema = z.infer<typeof inputSchemaValidator>
export type InputSchemaToEnv<T extends keyof InputSchema> = `INPUT_${Uppercase<
  KebabCase<T>
>}`

// eslint-disable-next-line import/no-default-export
export default () => inputSchemaValidator
