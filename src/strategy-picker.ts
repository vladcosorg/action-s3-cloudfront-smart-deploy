import { trimStart } from 'lodash'

import type { InputSchema } from '@/src/schema'
import { InvalidationStrategy } from '@/src/schema'
import { getLogMatcher } from '@/src/util'

function getFrugalStrategy(paths: string[]) {
  if (paths.length <= 1) {
    return paths
  }

  const sorted = paths.sort()
  const first = sorted.at(0)
  const last = sorted.at(-1)

  if (!first || !last) {
    return []
  }

  const minLength = Math.min(first.length, last.length)
  let accumulator = ''
  for (let index = 0; index < minLength; index++) {
    if (first.charAt(index) !== last.charAt(index)) {
      break
    }
    accumulator += first.charAt(index)
  }

  if (accumulator.at(-1) !== '/') {
    accumulator = accumulator.slice(0, accumulator.lastIndexOf('/') + 1)
  }

  return [`${accumulator}*`]
}

function groupPaths(pathCollection: string[]) {
  const groupedPaths = new Map<string, string[]>()
  for (const pathItem of pathCollection) {
    const segmentCollection = []
    for (const pathSegment of trimStart(pathItem, '/')
      .split('/')
      .slice(0, -1)) {
      segmentCollection.push(pathSegment)
      const newPathGroup = segmentCollection.join('/')
      groupedPaths.set(newPathGroup, [
        ...(groupedPaths.get(newPathGroup) ?? []),
        pathItem,
      ])
    }
  }

  return groupedPaths
}

function getBalancedStrategy(paths: string[], balancedLimit: number) {
  if (paths.length <= balancedLimit) {
    return paths
  }

  // eslint-disable-next-line unicorn/no-array-reduce
  const [sharedPath, entries] = [...groupPaths(paths).entries()].reduce(
    (
      [previousSharedPath, previousEntries],
      [currentSharedPath, curreEntries],
    ) => {
      if (curreEntries.length < 2) {
        return [previousSharedPath, previousEntries]
      }

      if (
        currentSharedPath.split('/').length >=
        previousSharedPath.split('/').length
      ) {
        return [`/${currentSharedPath}/*`, curreEntries]
      }

      return [previousSharedPath, previousEntries]
    },
    ['*', paths],
  )

  const newPaths = paths.filter((currentPath) => !entries.includes(currentPath))
  newPaths.push(`${sharedPath === '*' ? '/*' : sharedPath}`)

  return getBalancedStrategy(newPaths, balancedLimit)
}

export function pickStrategy(
  input: string,
  {
    balancedLimit,
    invalidationStrategy,
  }: Pick<InputSchema, 'balancedLimit' | 'invalidationStrategy'>,
) {
  const paths = getLogMatcher(input)
  let invalidationPaths: string[] = []

  switch (invalidationStrategy) {
    case InvalidationStrategy.FRUGAL: {
      invalidationPaths = getFrugalStrategy(paths)
      break
    }

    case InvalidationStrategy.PRECISE: {
      invalidationPaths = paths
      break
    }

    case InvalidationStrategy.BALANCED: {
      invalidationPaths = getBalancedStrategy(paths, balancedLimit)
      break
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown strategy ${invalidationStrategy}`)
    }
  }

  return invalidationPaths
}
