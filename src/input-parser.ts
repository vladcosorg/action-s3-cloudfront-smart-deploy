import * as core from '@actions/core'
import { kebabCase } from 'lodash'
import { objectFromEntries, objectKeys } from 'ts-extras'

import { inputSchemaValidator } from '@/src/schema'
import type { InputSchema, InputSchemaToEnv } from '@/src/schema'
import { fixEmpty } from '@/src/util'

// eslint-disable-next-line unicorn/prevent-abbreviations
export function getEnvName<T extends keyof InputSchema>(
  schemaName: T,
  full = true,
) {
  const internal = kebabCase(schemaName).replace(
    's-3-args',
    's3args',
  ) as InputSchemaToEnv<T>
  if (!full) {
    return internal
  }

  return `INPUT_${internal.toUpperCase()}`
}

export function parseInput() {
  const naiveSchema = inputSchemaValidator
  const schema = naiveSchema.extend(
    Object.fromEntries(
      objectKeys(naiveSchema.shape).map((schemaKey) => [
        schemaKey,
        fixEmpty(naiveSchema.shape[schemaKey]),
      ]),
    ),
  ) as unknown as typeof inputSchemaValidator
  return schema.parse(
    objectFromEntries(
      objectKeys(naiveSchema.shape).map((key) => [
        key,
        core.getInput(getEnvName(key, false)),
      ]),
    ),
  )
}
