/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as path from 'path';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import {
  Aws,
  RemovalPolicy,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_s3_deployment as s3d,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Stack to provision Portal assets and CloudFront Distribution
 */
export class PortalStack extends Construct {
  readonly portalBucket: s3.Bucket;
  readonly portalUrl: string;
  readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Use cloudfrontToS3 solution contructs
    const portal = new CloudFrontToS3(this, 'UI', {
      bucketProps: {
        versioned: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
        accessControl: s3.BucketAccessControl.PRIVATE,
        enforceSSL: true,
        removalPolicy: RemovalPolicy.RETAIN,
        autoDeleteObjects: false,
      },
      cloudFrontDistributionProps: {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
        enableIpv6: false,
        enableLogging: false, //Enable access logging for the distribution.
        comment: `${Aws.STACK_NAME} - Web Console Distribution (${Aws.REGION})`,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
        // defaultBehavior: getDefaultBehavior(),
      },
      insertHttpSecurityHeaders: false,
    });
    
    this.portalBucket = portal.s3Bucket as s3.Bucket;
    const portalDist = portal.cloudFrontWebDistribution.node
      .defaultChild as cloudfront.CfnDistribution;

    portalDist.addPropertyOverride(
      'DistributionConfig.DefaultCacheBehavior.CachePolicyId',
      undefined
    );
    portalDist.addPropertyOverride(
      'DistributionConfig.DefaultCacheBehavior.ForwardedValues',
      {
        Cookies: {
          Forward: 'none',
        },
        QueryString: false,
      }
    );

    this.portalUrl = portal.cloudFrontWebDistribution.distributionDomainName;
    this.cloudFrontDistributionId =
      portal.cloudFrontWebDistribution.distributionId;

    // upload static web assets
    new s3d.BucketDeployment(this, 'DeployWebAssets', {
      sources: [
        s3d.Source.asset(path.join(__dirname, '../photo-magic-ui')),
      ],
      destinationBucket: this.portalBucket,
      prune: false,
    });

    // Output portal Url
    new CfnOutput(this, "MagicPhotoWebConsoleUrl", {
      description: "Magic Photo Web Console URL (front-end)",
      value: this.portalUrl,
    }).overrideLogicalId("MagicPhotoWebConsoleUrl");
  }
}
