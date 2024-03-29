import { ObjectFile } from 'projen'
import { JobPermission } from 'projen/lib/github/workflows-model'
import { Release } from 'projen/lib/release'

export function addTestJob(release: Release, releaseFile: ObjectFile) {
  const testJob = 'test_list'
  // releaseFile?.addOverride('jobs.release.needs')
  releaseFile?.addOverride('jobs.release_github.needs', testJob)
  release.addJobs({
    [testJob]: {
      needs: ['release'],
      permissions: {
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      runsOn: ['ubuntu-latest'],
      env: {
        CI: 'true',
      },
      steps: [
        { uses: 'actions/checkout@v4', with: { ref: 'latest' } },
        {
          name: 'Configure AWS credentials',
          uses: 'aws-actions/configure-aws-credentials@v4',
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
            s3args: '--exact-timestamps',
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
