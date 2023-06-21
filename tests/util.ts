export function removeVariableStringsFromSnapshot(snapshot: string): string {
  const matches = snapshot.match(
    /upload: (?<from>.*)\/snapshot.* to s3:\/\/(?<to>.*)\/snapshot.*\n/,
  )

  const fromGroup = matches?.groups?.['from']
  const toGroup = matches?.groups?.['to']

  if (!fromGroup || !toGroup) {
    throw new Error('Matching group not found')
  }

  let output = ''
  output = snapshot.replaceAll(fromGroup, '[placeholder]')
  output = output.replaceAll(toGroup, '[placeholder]')

  return output
}

export function generateOutputFromPaths(...paths: string[]) {
  return paths
    .map((path) => `upload: /local/path/${path} to s3://server/${path}`)
    .join('\n')
}
