import { GithubAction, RunsUsing } from '@vladcos/projen-github-action'

import { createAwsStep } from '@/.projenrc/createAwsStep'
import { addTestJob } from '@/.projenrc/test-workflow'

import type { JobStep } from 'projen/lib/github/workflows-model'
import type { RenderWorkflowSetupOptions } from 'projen/lib/javascript'

const project = new (class extends GithubAction {
  override preSynthesize() {
    super.preSynthesize()
    const releaseWorkflowFile = project.tryFindObjectFile(
      '.github/workflows/release.yml',
    )
    addTestJob(this.release!, releaseWorkflowFile!)
  }

  override renderWorkflowSetup(
    options?: RenderWorkflowSetupOptions,
  ): JobStep[] {
    const setup = super.renderWorkflowSetup(options)

    setup.push(createAwsStep())

    return setup
  }
})({
  defaultReleaseBranch: 'main',
  devDeps: [
    '@vladcos/projen-github-action',
    'fs-jetpack',
    'lodash',
    '@types/lodash',
    'type-fest',
    'ts-extras',
    'execa@7',
  ],
  name: '@vladcos/action-s3-cloudfront-smart-deploy',
  majorVersion: 1,
  actionMetadata: {
    name: 'S3 & Cloudfront Smart Invalidation - save money and avoid unnecessary cache invalidation.',
    description:
      'Analyze the changed files to S3 and minimize the number of Cloudfront invalidations and maximize cache hits',
    branding: {
      color: 'blue',
      icon: 'refresh-cw',
    },
    inputs: '@/src/schema',
    runs: {
      using: RunsUsing.NODE_16,
      main: 'dist/index.mjs',
    },
  },
  releaseWorkflowSetupSteps: [
    {
      name: 'Configure AWS credentials',
      uses: 'aws-actions/configure-aws-credentials@v2',
      with: {
        'role-to-assume': '${{ vars.AWS_ROLE }}',
        'aws-region': '${{ vars.AWS_REGION }}',
      },
    },
  ],
})
project.synth()
