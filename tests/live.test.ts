import { $ } from 'execa'
import jetpack from 'fs-jetpack'
import { test, beforeEach, afterEach } from 'vitest'

import { getEnvName } from '@/src/input-parser'
import { run } from '@/src/runner'
import { getOrThrow } from '@/src/util'

import type { FSJetpack } from 'fs-jetpack/types'

const bucketId = `s3://${getOrThrow(import.meta.env.VITE_BUCKET_ID)}/`
const distribution = getOrThrow(import.meta.env.VITE_CLOUDFRONT_ID)
interface TemporaryDirectoryContext {
  directory: FSJetpack
}

beforeEach<TemporaryDirectoryContext>(async (context) => {
  context.directory = jetpack.tmpDir()
  await $`aws s3 rm ${bucketId} --recursive`
})

afterEach<TemporaryDirectoryContext>((context) => {
  context.directory.remove()
})

test<TemporaryDirectoryContext>('empty invalid input', async ({
  directory,
}) => {
  directory.file('test1')

  directory.file('test2')
  Object.assign(import.meta.env, {
    [getEnvName('source')]: directory.path(),
    [getEnvName('target')]: bucketId,
  })

  await run()
  directory.file('test3')
  Object.assign(import.meta.env, {
    [getEnvName('source')]: directory.path(),
    [getEnvName('target')]: bucketId,
    [getEnvName('s3args')]: '--dryrun',
    [getEnvName('distribution')]: distribution,
  })

  await run()
})
