<h2 style="font-weight: normal" align="center">
    <img alt="linkertinker" src="./.github/logo.svg" width="150" /><br>
  S3/Cloudfront <b style="color: #A067FF">Smart Invalidation</b>
</h2>

**This action provides a smart invalidation algorythm which can be as precise and as economical as you want it to be.**

By default the action prioritizes issueing as many precise invalidations as possible (withing set limits). 
If this is not possible, it falls back to a hybrid mode which would issue a mix of targeted invalidations and wildcard invalidations.
And finally, if there are too many invalidations, it falls back to wildcard approach, **BUT** the wilcards are 
as specific as possible, so that the consumers of the app would redownload as little as possible.


<!-- toc -->

- [Usage](#usage)
    + [Task definition file](#task-definition-file)
    + [Task definition container image values](#task-definition-container-image-values)
- [Credentials and Region](#credentials-and-region)
- [Permissions](#permissions)
- [AWS CodeDeploy Support](#aws-codedeploy-support)
- [Troubleshooting](#troubleshooting)
- [License Summary](#license-summary)
- [Security Disclosures](#security-disclosures)

<!-- tocstop -->
## Usage
```yaml
- name: Upload changes to S3 and issue Cloudfront invalidations
  uses: vladcosorg/action-s3-cloudfront-smart-deploy@master
  with:
    from-local-path: arn:aws:iam::111111111111:role/my-github-actions-role-test
    aws-region: us-east-1
```


### Configuration

| Key                     | Description                                                                                                     | Required | Default   | Value Type |
|-------------------------|-----------------------------------------------------------------------------------------------------------------|---------|-----------|------------|
| `source`                | Path to sync the files **from**                                                                                 | Yes ❗   | N/A       |
| `target`                | Target s3 bucket to sync **to**                                                                                 | Yes ❗   | N/A       |
| `extra-arguments-s3`    | Additional arguments from https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html                         | No      | N/A       |
| `distribution-id`       | Cloudfront distribution ID                                                                                      | No      | N/A       |
| `extra-arguments-cf`    | Additional arguments from https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-invalidation.html  | No      | N/A       |
| `invalidation-strategy` | Available values: `BALANCED`, `PRECISE`, `FRUGAL`. [See description here](#invalidation-strategies)             | No      | `BALANCED` |
| `balanced-limit`        | Path to sync the files **from**                                                                                 | No      | `5`       |
### Invalidation strategies



## Full example


```yaml
jobs:
  deploy:
    name: Upload to Amazon S3
    runs-on: ubuntu-latest
    # These permissions are needed to interact with GitHub's OIDC Token endpoint.
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Configure AWS credentials from Test account
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::111111111111:role/my-github-actions-role-test
          aws-region: us-east-1
      - name: Copy files to the test website with the AWS CLI
        run: |
          aws s3 sync . s3://my-s3-test-website-bucket
      - name: Configure AWS credentials from Production account
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::222222222222:role/my-github-actions-role-prod
          aws-region: us-west-2
      - name: Copy files to the production website with the AWS CLI
        run: |
          aws s3 sync . s3://my-s3-prod-website-bucket
```


## Motivation

The available actions are using a simple yet inneficient approach that invalidates the changes using a precise
1 file -> 1 invalidation request approach, which potentiall can result in a quite large monthly bill, provided that 
your project is updated frequently and got a lot of files (exactly the case at my company).
Another approach is to issue general, root invalidations like `/*` which would cause the consumers of your app 
to redownload the assets which did not actually change.

This action features a `BALANCED` approach which is as precise and as economical as you want it to be.
## License
This project is distributed under the [MIT license](LICENSE.md).