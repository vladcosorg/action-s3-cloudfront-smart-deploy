import { getExecOutput } from '@actions/exec'
import { afterEach, expect, test, vi } from 'vitest'

import { getEnvName } from '@/src/input-parser'
import { run } from '@/src/runner'

afterEach(() => {
  vi.clearAllMocks()
})

vi.mock('@actions/exec', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const module_ =
    await vi.importActual<typeof import('@actions/exec')>('@actions/exec')
  const { generateOutputFromPaths } = await import('@/tests/util')
  return {
    ...module_,
    getExecOutput: vi.fn().mockReturnValue({
      stdout: generateOutputFromPaths(
        'dir1/dir2/dir3/file2',
        'dir1/dir2/dir3/file1',
        'dir1/dir2/dir3/dir4/file1',
        'dir1/dir2/dir3/dir4/file1folder/file3',
      ),
    }),
  }
})

test('empty invalid input', async () => {
  Object.assign(import.meta.env, {
    [getEnvName('source')]: '/tmp',
    [getEnvName('target')]: 's3://dawd/',
    [getEnvName('distribution')]: 'foobar',
  })

  await run()
  expect(getExecOutput).toHaveBeenNthCalledWith(1, 'aws', [
    's3',
    'sync',
    '/tmp',
    's3://dawd/',
    '--no-progress',
    '--size-only',
  ])

  expect(getExecOutput).toHaveBeenNthCalledWith(2, 'aws', [
    'cloudfront',
    'create-invalidation',
    '--distribution-id',
    import.meta.env[getEnvName('distribution')],
    '--paths',
    '/dir1/dir2/dir3/file2',
    '/dir1/dir2/dir3/file1',
    '/dir1/dir2/dir3/dir4/file1',
    '/dir1/dir2/dir3/dir4/file1folder/file3',
  ])
})

test('s3args is actually passed', async () => {
  Object.assign(import.meta.env, {
    [getEnvName('source')]: '/tmp',
    [getEnvName('target')]: 's3://dawd/',
    [getEnvName('distribution')]: 'foobar',
    [getEnvName('s3args')]: '--delete --exact-timestamps',
  })

  await run()
  expect(getExecOutput).toHaveBeenNthCalledWith(1, 'aws', [
    's3',
    'sync',
    '/tmp',
    's3://dawd/',
    '--no-progress',
    '--delete',
    '--exact-timestamps',
  ])
})
