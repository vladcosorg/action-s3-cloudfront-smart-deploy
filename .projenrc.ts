import { GithubAction, RunsUsing } from '@vladcos/projen-base'
import { TypeScriptModuleResolution } from 'projen/lib/javascript'

const project = class extends GithubAction {
  override preSynthesize() {
    super.preSynthesize()
    this.package.addField('type', 'module')

    this.tryFindObjectFile('.github/workflows/release.yml')?.addOverride(
      'jobs.release.permissions.id-token',
      'write',
    )
    this.compileTask.reset('packemon build --loadConfigs --no-addFiles')
  }
}

const pro = new project({
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

pro.synth()
