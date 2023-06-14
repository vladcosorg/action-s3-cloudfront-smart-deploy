import { GithubAction, RunsUsing } from '@vladcos/projen-base'

const project = new GithubAction({
  defaultReleaseBranch: 'main',
  devDeps: ['file:../projen-base/'],
  name: '@vladcos/action-s3-cloudfront-smart-deploy',
  projenrcTs: true,
  actionMetadata: {
    runs: {
      using: RunsUsing.NODE_16,
      main: 'dist/index.js',
    },
  },
})

project.synth()
