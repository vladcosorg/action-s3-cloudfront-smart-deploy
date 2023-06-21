import * as core from '@actions/core'
import { getExecOutput } from '@actions/exec'

import { parseInput } from '@/src/input-parser'
import { pickStrategy } from '@/src/strategy-picker'

export async function run(): Promise<void> {
  const {
    fromLocalPath,
    toS3Uri,
    extraArguments,
    balancedLimit,
    invalidationStrategy,
    distributionId,
  } = parseInput()
  core.setCommandEcho(true)
  const output = await getExecOutput('aws', [
    's3',
    'sync',
    fromLocalPath,
    toS3Uri,
    '--no-progress',
    '--size-only',
    ...extraArguments,
  ])

  if (!distributionId) {
    return
  }

  const invalidationCandidates = pickStrategy(output.stdout, {
    invalidationStrategy,
    balancedLimit,
  })

  if (invalidationCandidates.length === 0) {
    return
  }

  await getExecOutput('aws', [
    'cloudfront',
    'create-invalidation',
    '--distribution-id',
    distributionId,
    '--paths',
    ...invalidationCandidates.map((path) =>
      path.includes('*') ? `"${path}"` : path,
    ),
  ])
}
