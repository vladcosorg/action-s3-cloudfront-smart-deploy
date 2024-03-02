import { JobStep } from 'projen/lib/github/workflows-model'

export function createAwsStep(): JobStep {
  return {
    name: 'Configure AWS credentials',
    uses: 'aws-actions/configure-aws-credentials@v4',
    with: {
      'role-to-assume': '${{ vars.AWS_ROLE }}',
      'aws-region': '${{ vars.AWS_REGION }}',
    },
  }
}
