import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PortalStack } from './portal-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DeployUiWithCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const portalStack = new PortalStack(this, "MagicPhotoWebUI");

    // example resource
    // const queue = new sqs.Queue(this, 'DeployUiWithCdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
