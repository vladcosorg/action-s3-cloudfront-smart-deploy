import { getExecOutput } from '@actions/exec'

import type { ExecOutput } from '@actions/exec'

export async function runS3Sync({
  fromLocalPath,
  toS3Uri,
  extraArgumentsS3 = [],
}: {
  fromLocalPath: string
  toS3Uri: string
  extraArgumentsS3?: string[]
}): Promise<ExecOutput> {
  return getExecOutput('aws', [
    's3',
    'sync',
    fromLocalPath,
    toS3Uri,
    ...extraArgumentsS3,
    '--no-progress',
    '--size-only',
  ])
}
