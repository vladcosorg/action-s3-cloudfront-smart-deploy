import { z } from 'zod'

import { fixEmpty } from '@/src/util'

export enum InvalidationStrategy {
  BALANCED = 'balanced',
  FRUGAL = 'frugal',
  PRECISE = 'precise',
}

// eslint-disable-next-line import/no-default-export
export default getSchema
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getSchema() {
  return z.object({
    fromLocalPath: z.string().trim().min(1).describe('nooo'),
    toS3Uri: z.string().trim().min(7).startsWith('s3://').endsWith('/'),
    extraArguments: z
      .string()
      .transform((value) => {
        if (value.length === 0) {
          return []
        }

        return value
          .split(' ')
          .map((item) => item.trim())
          .filter((item) => item.length)
      })
      .pipe(z.string().array()),
    distributionId: fixEmpty(z.string().optional()),
    invalidationStrategy: z
      .nativeEnum(InvalidationStrategy)
      .default(InvalidationStrategy.BALANCED)
      .describe(
        ' The balanced strategy will attempt to use the maximize-precision approach unless there are [limit] or more targets. \n' +
          'In that case it will switch to the minimize-invalidations strategy.',
      ),
    balancedLimit: z.coerce.number().default(5),
  })
}
