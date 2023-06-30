import path from 'node:path'

import { GithubAction, RunsUsing } from '@vladcos/projen-base'
import { GitHub, GithubWorkflow } from 'projen/lib/github'
import { JobPermission } from 'projen/lib/github/workflows-model'
import { TypeScriptModuleResolution } from 'projen/lib/javascript'

const project = new (class extends GithubAction {
  override preSynthesize() {
    super.preSynthesize()
    this.addGitIgnore('!/dist/')
    this.package.addField('type', 'module')
    const testJob = 'test_list'

    this.release?.addJobs({
      [testJob]: {
        permissions: {
          contents: JobPermission.READ,
          idToken: JobPermission.WRITE,
        },
        runsOn: ['ubuntu-latest'],
        env: {
          CI: 'true',
        },
        steps: [
          { uses: 'actions/checkout@v3' },
          {
            name: 'Configure AWS credentials',
            uses: 'aws-actions/configure-aws-credentials@v2',
            with: {
              'role-to-assume': '${{ vars.AWS_ROLE }}',
              'aws-region': '${{ vars.AWS_REGION }}',
            },
          },
          {
            run: [
              'mkdir ${{ runner.temp }}/test/',
              'touch ${{ runner.temp }}/test/foo.bar',
            ].join('\n'),
          },
          {
            uses: './',
            with: {
              source: '${{ runner.temp }}/test',
              target: 's3://${{ vars.AWS_BUCKET }}/',
              distribution: '${{ vars.AWS_DISTRIBUTION }}',
            },
          },
          {
            run: ['aws s3 rm s3://${{ vars.AWS_BUCKET }}/ --recursive'].join(
              '\n',
            ),
          },
        ],
      },
    })

    const releaseWorkflowFile = this.tryFindObjectFile(
      '.github/workflows/release.yml',
    )
    releaseWorkflowFile?.addOverride(
      'jobs.release.permissions.id-token',
      'write',
    )
    releaseWorkflowFile?.addOverride('jobs.release.needs', testJob)
    releaseWorkflowFile?.addOverride(
      'jobs.release_github.steps.10.env.GITHUB_REF',
      '${{ steps.commit.outputs.commit_sha }}',
    )
    this.compileTask.reset('packemon build --loadConfigs --no-addFiles')
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
            ref: 'releases',
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
          run: 'git switch --orphan releases',
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
            push: 'origin releases --set-upstream --force',
            add: 'dist action.yml',
            tag: 'v${{ steps.major.outputs.version }} --force',
            tag_push: '--force',
          },
        },
      ],
    })
    // releaseWorkflowFile?.addOverride('jobs.release_github.steps', [
    //   { uses: 'actions/checkout@v3' },
    // ])

    // releaseWorkflowFile?.addOverride('jobs.release_github.steps', [
    //   { uses: 'technote-space/release-github-actions@latest' },
    // ])

    const workflow = new GithubWorkflow(GitHub.of(project)!, 'marketplace-test')
    workflow.on({
      workflowDispatch: {},
    })
    workflow.addJobs({
      marketplaceTest: {
        permissions: {
          contents: JobPermission.READ,
          idToken: JobPermission.WRITE,
        },
        runsOn: ['ubuntu-latest'],
        env: {
          CI: 'true',
        },
        steps: [
          { uses: 'actions/checkout@v3' },
          {
            name: 'Configure AWS credentials',
            uses: 'aws-actions/configure-aws-credentials@v2',
            with: {
              'role-to-assume': '${{ vars.AWS_ROLE }}',
              'aws-region': '${{ vars.AWS_REGION }}',
            },
          },
          {
            run: [
              'mkdir ${{ runner.temp }}/test/',
              'touch ${{ runner.temp }}/test/foo.bar',
            ].join('\n'),
          },
          {
            uses: 'vladcosorg/action-s3-cloudfront-smart-deploy@v1',
            with: {
              source: '${{ runner.temp }}/test',
              target: 's3://${{ vars.AWS_BUCKET }}/',
              distribution: '${{ vars.AWS_DISTRIBUTION }}',
            },
          },
          {
            run: ['aws s3 rm s3://${{ vars.AWS_BUCKET }}/ --recursive'].join(
              '\n',
            ),
          },
        ],
      },
    })
  }
})({
  releaseToNpm: false,
  // release: false,
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
  vitest: false,
  tsconfigDev: {
    compilerOptions: {
      module: 'ES2022',
      moduleResolution: TypeScriptModuleResolution.BUNDLER,
    },
  },
  // githubRelease: false,
  actionMetadata: {
    name: 'S3 & Cloudfront Smart Invalidation - save money on invalidations and maximize cache hits',
    description:
      'It will analyze your changed files to S3 and minimize the number of Cloudfront invalidations while maximizing cache hits',
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
  // githubRelease: false,
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
