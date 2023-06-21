import { expect, test } from 'vitest'

import { removeVariableStringsFromSnapshot } from '@/tests/util'

test('removeVariableStringsFromSnapshot return expected output', () => {
  const output = `(dryrun) upload: ../../../../../../var/folders/fv/8ll76mxj42s978gf5xdg6q240000gn/T/ec160b1bffc1777762a17592e6bc6940/snapshot/inner/test.json to s3://action-server-htmlbucket51514f71-8obiz5jmw9jq/snapshot/inner/test.json
(dryrun) upload: ../../../../../../var/folders/fv/8ll76mxj42s978gf5xdg6q240000gn/T/ec160b1bffc1777762a17592e6bc6940/snapshot/test.json to s3://action-server-htmlbucket51514f71-8obiz5jmw9jq/snapshot/test.json`

  expect(removeVariableStringsFromSnapshot(output)).toMatchInlineSnapshot(`
    "(dryrun) upload: [placeholder]/snapshot/inner/test.json to s3://[placeholder]/snapshot/inner/test.json
    (dryrun) upload: [placeholder]/snapshot/test.json to s3://[placeholder]/snapshot/test.json"
  `)
})
