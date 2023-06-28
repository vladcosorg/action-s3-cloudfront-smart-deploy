import { getExecOutput } from '@actions/exec'

import type { ExecOutput } from '@actions/exec'

export async function runS3Sync({
  source,
  target,
  // eslint-disable-next-line unicorn/prevent-abbreviations
  s3args = [],
}: {
  source: string
  target: string
  s3args?: string[]
}): Promise<ExecOutput> {
  return getExecOutput('aws', [
    's3',
    'sync',
    source,
    target,
    ...s3args,
    '--no-progress',
    '--size-only',
  ])
}
