import jetpack from 'fs-jetpack'
import { afterEach, beforeEach, expect, test, describe } from 'vitest'
import { ZodError } from 'zod'

import { getEnvName, parseInput } from '@/src/input-parser'
import { runS3Sync } from '@/src/s3'
import type { InputSchema } from '@/src/schema'
import { InvalidationStrategy } from '@/src/schema'
import { getOrThrow } from '@/src/util'
import { removeVariableStringsFromSnapshot } from '@/tests/util'

import type { FSJetpack } from 'fs-jetpack/types'

interface TemporaryDirectoryContext {
  directory: FSJetpack
}

beforeEach<TemporaryDirectoryContext>((context) => {
  context.directory = jetpack.tmpDir()
})

afterEach<TemporaryDirectoryContext>((context) => {
  context.directory.remove()
})

test<TemporaryDirectoryContext>('the command outputs expected structure', async ({
  directory,
}) => {
  const bucketId = getOrThrow(import.meta.env.VITE_BUCKET_ID)

  directory.file('snapshot/test.json')
  directory.file('snapshot/inner/test.json')

  const output = await runS3Sync({
    fromLocalPath: directory.path(),
    toS3Uri: `s3://${bucketId}/`,
    extraArguments: ['--dryrun'],
  })
  await expect(
    removeVariableStringsFromSnapshot(output.stdout),
  ).toMatchFileSnapshot('./snapshots/s3sync')
})

describe('input validation', () => {
  const defaults = {
    [getEnvName('fromLocalPath')]: '/tmp',
    [getEnvName('toS3Uri')]: 's3://dawd/',
    [getEnvName('extraArguments')]: '--one --two',
    [getEnvName('invalidationStrategy')]: 'balanced',
    [getEnvName('balancedLimit')]: '6',
    [getEnvName('distributionId')]: 'test',
  }

  beforeEach(() => {
    for (const value of Object.keys(defaults)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete import.meta.env[value]
    }
  })

  test('full valid input', () => {
    Object.assign(import.meta.env, defaults)
    expect(parseInput()).toEqual({
      balancedLimit: 6,
      distributionId: 'test',
      extraArguments: ['--one', '--two'],
      fromLocalPath: '/tmp',
      invalidationStrategy: 'balanced',
      toS3Uri: 's3://dawd/',
    })
  })

  test('empty invalid input', () => {
    expect(() => parseInput()).toThrow(ZodError)
  })

  describe.each<{ field: keyof InputSchema; checks: Array<[string, unknown]> }>(
    [
      {
        field: 'fromLocalPath',
        checks: [['empty', ' ']],
      },
      {
        field: 'toS3Uri',
        checks: [
          ['empty', ' '],
          ['invalid prefix', 's4://'],
          ['missing suffix', 's3://foobar'],
          ['too short', 's3:///'],
        ],
      },
      {
        field: 'invalidationStrategy',
        checks: [['invalid value', 'invalid']],
      },
      {
        field: 'balancedLimit',
        checks: [
          ['a string', 'foo'],
          ['a float', 2.5],
          ['negative integer', -1],
          ['zero', 0],
        ],
      },
    ],
  )('$field invalid input', ({ field, checks }) => {
    test.each(checks)('%s `%s` should throw an error', (_name, value) => {
      Object.assign(import.meta.env, defaults, {
        [getEnvName(field)]: value,
      })
      expect(() => parseInput()).toThrow(ZodError)
    })
  })

  describe.each<{
    field: keyof InputSchema
    checks: Array<[string, unknown, unknown]>
  }>([
    {
      field: 'fromLocalPath',
      checks: [['non-empty string', '/tmp', '/tmp']],
    },
    {
      field: 'toS3Uri',
      checks: [
        ['string with prefix and suffix', ' s3://foobar/ ', 's3://foobar/'],
      ],
    },
    {
      field: 'extraArguments',
      checks: [
        ['one element', 'one', ['one']],
        ['two elements', 'one two', ['one', 'two']],
        ['empty string', ' ', []],
        ['string with zero length', '', []],
      ],
    },
    {
      field: 'distributionId',
      checks: [['empty string', ' ', undefined]],
    },
    {
      field: 'invalidationStrategy',
      checks: [
        [
          'valid enum',
          InvalidationStrategy.FRUGAL,
          InvalidationStrategy.FRUGAL,
        ],
        ['valid enum', '  ', InvalidationStrategy.BALANCED],
      ],
    },
    {
      field: 'balancedLimit',
      checks: [
        ['positive', '4', 4],
        ['empty', ' ', 5],
      ],
    },
  ])('$field valid input', ({ field, checks }) => {
    test.each(checks)(
      '%s `%s` should validate successfuly',
      (_name, input, expected) => {
        Object.assign(import.meta.env, defaults, {
          [getEnvName(field)]: input,
        })
        expect(parseInput()[field]).toEqual(expected)
      },
    )
  })
})
