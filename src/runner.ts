import * as core from '@actions/core'
import { getExecOutput } from '@actions/exec'

import { parseInput } from '@/src/input-parser'
import { pickStrategy } from '@/src/strategy-picker'

export async function run(): Promise<void> {
  const {
    balancedLimit,
    cfargs,
    distribution,
    invalidationStrategy,
    s3args,
    source,
    target,
  } = parseInput()
  core.setCommandEcho(true)
  const output = await getExecOutput('aws', [
    's3',
    'sync',
    source,
    target,
    '--no-progress',
    ...s3args,
  ])

  if (!distribution) {
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
    distribution,
    '--paths',
    ...invalidationCandidates.map((path) =>
      path.includes('*') ? `"${path}"` : path,
    ),
    ...cfargs,
  ])
}
