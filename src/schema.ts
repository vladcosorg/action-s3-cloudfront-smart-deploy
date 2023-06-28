import * as fs from 'node:fs'
import path from 'node:path'

import { z } from 'zod'

import type { KebabCase } from 'type-fest'

export enum InvalidationStrategy {
  BALANCED = 'balanced',
  FRUGAL = 'frugal',
  PRECISE = 'precise',
}

function getArgumentValidation() {
  return z
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
    .pipe(z.string().array())
}

export const inputSchemaValidator = z.object({
  source: z.union([
    z
      .string()
      .trim()
      .min(1)
      .describe('Path to sync the files from')
      .refine(
        (value) => fs.existsSync(path.resolve(value)),
        (value) => ({ message: `The path '${value}' does not exist` }),
      ),
    z.string().trim().min(7).startsWith('s3://').endsWith('/'),
  ]),
  target: z
    .string()
    .trim()
    .min(7)
    .startsWith('s3://')
    .endsWith('/')
    .describe('Target s3 bucket to sync to'),
  s3args: getArgumentValidation().describe(
    'Additional arguments from https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html',
  ),
  cfargs: getArgumentValidation().describe(
    'Additional arguments from https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-invalidation.html',
  ),
  distribution: z.string().optional().describe('Cloudfront distribution ID'),
  invalidationStrategy: z
    .nativeEnum(InvalidationStrategy)
    .default(InvalidationStrategy.BALANCED)
    .describe(' Available values: `BALANCED`, `PRECISE`, `FRUGAL`'),
  balancedLimit: z.coerce
    .number()
    .int()
    .positive()
    .default(5)
    .describe(
      'Maximum amount of invalidation requests when using `BALANCED` strategy',
    ),
})

export type InputSchema = z.infer<typeof inputSchemaValidator>
export type InputSchemaToEnv<T extends keyof InputSchema> = `INPUT_${Uppercase<
  KebabCase<T>
>}`

// eslint-disable-next-line import/no-default-export
export default () => inputSchemaValidator
