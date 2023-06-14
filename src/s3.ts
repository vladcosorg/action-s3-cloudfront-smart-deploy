import { getExecOutput } from '@actions/exec'

import type { ExecOutput } from '@actions/exec'

export async function runS3Sync({
  fromLocalPath,
  toS3Uri,
  extraArguments = [],
}: {
  fromLocalPath: string
  toS3Uri: string
  extraArguments?: string[]
}): Promise<ExecOutput> {
  return getExecOutput('aws', [
    's3',
    'sync',
    fromLocalPath,
    toS3Uri,
    ...extraArguments,
    '--no-progress',
    '--size-only',
  ])
}
