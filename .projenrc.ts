import { GithubAction } from "@vladcos/projen-base";

const project = new GithubAction({
  defaultReleaseBranch: "main",
  devDeps: ["file:../projen-base/"],
  name: "action-s3-cloudfront-smart-deploy",
  projenrcTs: true,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();