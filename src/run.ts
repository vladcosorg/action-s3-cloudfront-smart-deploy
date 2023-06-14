import * as core from '@actions/core'
import { getExecOutput } from '@actions/exec'
import { z } from 'zod'

import { InvalidationStrategy } from '@/src/schema'
import { fixEmpty } from '@/src/util'

export function parseInput() {
  const naiveSchema = z.object({
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
      .default(InvalidationStrategy.BALANCED),

    balancedLimit: z.coerce.number().default(5),
  })
  const schema = naiveSchema.extend(
    Object.fromEntries(
      (
        Object.keys(naiveSchema.shape) as Array<
          keyof (typeof naiveSchema)['shape']
        >
      ).map((schemaKey) => [schemaKey, fixEmpty(naiveSchema.shape[schemaKey])]),
    ),
  )

  console.log(naiveSchema)

  const options = schema.parse({
    fromLocalPath: core.getInput('directory'),
    toS3Uri: core.getInput('s3-bucket'),
    distributionId: core.getInput('distribution-id'),
    invalidationStrategy: core.getInput('invalidation-strategy'),
    balancedLimit: core.getInput('balanced-limit'),
    extraArguments: core.getInput('args'),
  })

  console.log(options)
}

async function run(): Promise<void> {
  const schema = z.object({
    fromLocalPath: z.string(),
    toS3Uri: z.string(),
    extraArguments: z.string(),
  })

  const options = schema.parse({
    fromLocalPath: core.getInput('directory'),
    toS3Uri: core.getInput('s3-bucket'),
    extraArguments: core.getInput('args'),
  })

  const directory = core.getInput('directory')
  const s3Bucket = core.getInput('s3-bucket')
  const path = core.getInput('s3-path')
  const s3SyncArguments = core.getInput('args').split(' ')
  s3SyncArguments.push('--no-progress')
  // core.setCommandEcho(true)
  await getExecOutput('aws', [
    's3',
    'sync',
    directory,
    `s3://${s3Bucket}${path.startsWith('/') ? '' : '/'}${path}`,
    ...s3SyncArguments,
  ])
  // core.setOutput('11111', output)
  // core.setOutput('2222', output.stdout)
  // core.setOutput('3333', output.stderr)
  // console.log('4444', output)
}

// export function runS3Sync(options: { fromLocalPath: string }) {}

run()
