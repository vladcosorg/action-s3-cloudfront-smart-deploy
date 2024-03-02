import * as process from 'node:process'

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

  if (core.isDebug()) {
    core.debug(`Envs: ${JSON.stringify(process.env)}`)
    core.debug(`Input parsing results: ${JSON.stringify(parseInput())}`)
  }
  core.setCommandEcho(true)
  const commands = ['s3', 'sync', source, target, '--no-progress', ...s3args]

  core.debug(`Commands to be sent to aws s3: ${JSON.stringify(commands)}`)

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
