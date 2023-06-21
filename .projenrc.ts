import { GithubAction, RunsUsing } from '@vladcos/projen-base'
import { TypeScriptModuleResolution } from 'projen/lib/javascript'

const project = new GithubAction({
  defaultReleaseBranch: 'main',
  devDeps: [
    '@vladcos/projen-base',
    'tsconfig-paths',
    'fs-jetpack',
    'lodash',
    '@types/lodash',
    'type-fest',
    'ts-extras',
    'execa@7',
  ],
  name: '@vladcos/action-s3-cloudfront-smart-deploy',
  projenrcTs: true,
  tsconfigDev: {
    compilerOptions: {
      module: 'ES2022',
      moduleResolution: TypeScriptModuleResolution.BUNDLER,
    },
  },
  actionMetadata: {
    inputs: '@/src/schema',
    runs: {
      using: RunsUsing.NODE_16,
      main: 'dist/index.mjs',
    },
  },
})
project.package.addField('type', 'module')

project.synth()
