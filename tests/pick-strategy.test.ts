import { expect, test } from 'vitest'

import { InvalidationStrategy } from '@/src/schema'
import { pickStrategy } from '@/src/strategy-picker'
import { generateOutputFromPaths } from '@/tests/util'

test('precise', async () => {
  const paths = pickStrategy(
    generateOutputFromPaths('file1', 'dir1/dir2/file1', 'dir1/file2'),
    { balancedLimit: 5, invalidationStrategy: InvalidationStrategy.PRECISE },
  )
  expect(paths.sort()).toEqual(
    ['/dir1/file2', '/file1', '/dir1/dir2/file1'].sort(),
  )
})

test.each([
  [
    'simple scenario',
    [
      'dir1/dir2/dir3/file2',
      'dir1/dir2/dir3/file1',
      'dir1/dir2/dir3/dir4/file1',
      'dir1/dir2/dir3/dir4/file1folder/file3',
    ],
    ['/dir1/dir2/dir3/*'],
  ],
  [
    'a filename starts with a prefix equal to a shared root',
    ['dir1/dir2/dir3/file2', 'dir1/dir2file'],
    ['/dir1/*'],
  ],
  ['no shared root', ['dir1/dir2/dir3/file2', 'dir3/dir2file'], ['/*']],
  ['no changed items', [], []],
])('%s', async (_desc, line, expected) => {
  const paths = pickStrategy(generateOutputFromPaths(...line), {
    balancedLimit: 5,
    invalidationStrategy: InvalidationStrategy.FRUGAL,
  })
  expect(paths.sort()).toEqual(expected.sort())
})

const input = [
  'dir1/file1',
  'dir1/dir2/dir3/file2',
  'dir1/dir2/dir3/dir4/file1',
  'dir1/dir2/dir3/dir4/file0',
  'dir0/dir3/die1',
  'dir3/dir3/dir0/dir/dir2/dir3',
  'dir1/dir3/dir0/dir/dir2/dir3',
  'dir1/dir2/dir3/dir4/filedir/file1/file2/file3',
  'dir1/dir2/dir3/dir4/filedir/file1/file3/file3',
  'dir1/dir2/dir3/dir4/file1',
  'dir1/dir2/dir3/dir4/file1folder/file3',
]

test.each<{
  description: string
  strategy: InvalidationStrategy
  limit?: number
  input: string[]
  output: string[]
}>([
  {
    description: 'general case',
    strategy: InvalidationStrategy.BALANCED,
    input,
    output: [
      '/dir0/dir3/die1',
      '/dir1/dir3/dir0/dir/dir2/dir3',
      '/dir1/file1',
      '/dir3/dir3/dir0/dir/dir2/dir3',
      '/dir1/dir2/dir3/*',
    ],
  },
  {
    description: 'test case',
    strategy: InvalidationStrategy.BALANCED,
    limit: 3,
    input,
    output: ['/dir0/dir3/die1', '/dir1/*', '/dir3/dir3/dir0/dir/dir2/dir3'],
  },
  {
    description: 'should return the most general wildcard',
    strategy: InvalidationStrategy.BALANCED,
    limit: 1,
    input,
    output: ['/*'],
  },
  {
    description: 'general scenario',
    input: [
      'dir1/dir2/dir3/file2',
      'dir1/dir2/dir3/file1',
      'dir1/dir2/dir3/dir4/file1',
      'dir1/dir2/dir3/dir4/file1folder/file3',
    ],
    output: ['/dir1/dir2/dir3/*'],
    strategy: InvalidationStrategy.FRUGAL,
  },

  {
    description:
      'when precis and wildcard number of paths is equal, choose the precise approach',
    input: ['dir1/dir2/dir3/file2'],
    output: ['/dir1/dir2/dir3/file2'],
    strategy: InvalidationStrategy.FRUGAL,
  },
  {
    description: 'general scenario',
    input: [
      'dir1/dir2/dir3/file2',
      'dir1/dir2/dir3/file1',
      'dir1/dir2/dir3/dir4/file1',
      'dir1/dir2/dir3/dir4/file1folder/file3',
    ],
    output: [
      '/dir1/dir2/dir3/file2',
      '/dir1/dir2/dir3/file1',
      '/dir1/dir2/dir3/dir4/file1',
      '/dir1/dir2/dir3/dir4/file1folder/file3',
    ],
    strategy: InvalidationStrategy.PRECISE,
  },
])('$strategy: $description', async ({ strategy, limit, input, output }) => {
  const paths = pickStrategy(generateOutputFromPaths(...input), {
    balancedLimit: limit ?? 5,
    invalidationStrategy: strategy,
  })
  expect(paths.sort()).toEqual(output.sort())
})
