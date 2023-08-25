import * as fs from 'node:fs'
import path from 'node:path'

import { GithubAction, RunsUsing } from '@vladcos/projen-base'
import { TypeScriptModuleResolution } from 'projen/lib/javascript'
import replace from 'replace-in-file'

import { addTestJob } from '@/.projenrc/test-workflow'

const project = new (class extends GithubAction {
  override preSynthesize() {
    super.preSynthesize()
    this.package.addField('type', 'module')
    this.compileTask.reset('packemon build --loadConfigs --no-addFiles')

    const releaseWorkflowFile = this.tryFindObjectFile(
      '.github/workflows/release.yml',
    )

    addTestJob(this.release!, releaseWorkflowFile!)

    releaseWorkflowFile?.addOverride(
      'jobs.release.permissions.id-token',
      'write',
    )

    releaseWorkflowFile?.addOverride(
      'jobs.release_github.steps.12.if',
      `steps.commit.outputs.committed == 'true'`,
    )

    this.release?.publisher.publishToGitHubReleases({
      changelogFile: path.posix.join(
        this.artifactsDirectory,
        this.release.version.changelogFileName,
      ),
      versionFile: path.posix.join(
        this.artifactsDirectory,
        this.release.version.versionFileName,
      ),
      releaseTagFile: path.posix.join(
        this.artifactsDirectory,
        this.release.version.releaseTagFileName,
      ),
      prePublishSteps: [
        {
          name: 'Checkout',
          id: 'branch_exists',
          uses: 'actions/checkout@v3',
          continueOnError: true,
          with: {
            path: 'repo',
            'fetch-depth': 0,
            ref: 'latest',
          },
        },
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          if: "steps.branch_exists.outcome != 'success'",
          with: {
            path: 'repo',
            'fetch-depth': 0,
          },
        },
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          with: {
            path: 'main',
          },
        },
        {
          name: 'Create a branch if necessary',
          if: "steps.branch_exists.outcome != 'success'",
          run: 'git switch --orphan latest',
          workingDirectory: './repo',
        },
        {
          run: 'mv ./repo/.git ./.git',
        },
        { run: 'ls -la' },
        {
          run: 'cp ./main/action.yml action.yml',
        },
        {
          id: 'major',
          run: `echo "version=$(cut -d '.' -f 1 ${path.posix.join(
            this.artifactsDirectory,
            this.release.version.versionFileName,
          )})" >> $GITHUB_OUTPUT`,
        },
        {
          id: 'commit',
          uses: 'EndBug/add-and-commit@v9',
          with: {
            push: 'origin latest --set-upstream --force',
            add: 'dist action.yml README.md',
            tag: 'v${{ steps.major.outputs.version }} --force',
            tag_push: '--force',
          },
        },
      ],
    })
  }

  override postSynthesize() {
    super.postSynthesize()
    fs.chmodSync(path.resolve('.github/workflows/release.yml'), '666')
    replace.replaceInFileSync({
      files: '.github/workflows/release.yml',
      from: '--target $GITHUB_REF',
      to: '--target ${{ steps.commit.outputs.commit_long_sha }}',
    })
    fs.chmodSync(path.resolve('.github/workflows/release.yml'), '444')
  }
})({
  releaseToNpm: false,

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
    'replace-in-file',
  ],
  name: '@vladcos/action-s3-cloudfront-smart-deploy',
  vitest: true,
  majorVersion: 1,
  tsconfigDev: {
    compilerOptions: {
      module: 'ES2022',
      moduleResolution: TypeScriptModuleResolution.BUNDLER,
    },
  },
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
  entrypoint: './mjs/index.mjs',
})
project.synth()
