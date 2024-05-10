import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { lambda, lambdaUrl } = this.#createLambda();
    const bucket = this.#createS3Bucket();
    this.#deployS3Assets(bucket);
    const distribution = this.#createCfnDistribution(lambdaUrl, bucket);
    this.#applyCfnOAC(distribution, lambda, bucket);
  }

  #createLambda() {
    const lambda = new cdk.aws_lambda.Function(this, "lcx-function", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      code: cdk.aws_lambda.Code.fromAsset(
        path.join(__dirname, "../../apps/lambda-app/build/lambda.zip"),
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(900),
    });

    const lambdaUrl = new cdk.aws_lambda.FunctionUrl(this, "lcx-function-url", {
      function: lambda,
      authType: cdk.aws_lambda.FunctionUrlAuthType.AWS_IAM,
      invokeMode: cdk.aws_lambda.InvokeMode.RESPONSE_STREAM,
    });

    return { lambda, lambdaUrl };
  }

  #createS3Bucket() {
    const s3 = new cdk.aws_s3.Bucket(this, "lcx-bucket", {
      bucketName: "lcx-remix-assets",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    return s3;
  }

  #deployS3Assets(bucket: cdk.aws_s3.Bucket) {
    new cdk.aws_s3_deployment.BucketDeployment(this, "lcx-bucket-deployment", {
      destinationBucket: bucket,
      sources: [
        cdk.aws_s3_deployment.Source.asset(
          path.join(__dirname, "../../apps/lambda-app/build/remix/client"),
        ),
      ],
    });
  }

  #createCfnDistribution(lambdaUrl: cdk.aws_lambda.IFunctionUrl, bucket: cdk.aws_s3.Bucket) {
    const assetsOrigin = new cdk.aws_cloudfront_origins.S3Origin(bucket);
    const lambdaUrlOrigin = new cdk.aws_cloudfront_origins.FunctionUrlOrigin(lambdaUrl);
    const distribution = new cdk.aws_cloudfront.Distribution(this, "lcx-distribution", {
      defaultBehavior: {
        origin: lambdaUrlOrigin,
        cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cdk.aws_cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        originRequestPolicy: cdk.aws_cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        "/assets/*": {
          origin: assetsOrigin,
        },
        "/favicon.ico": {
          origin: assetsOrigin,
        },
      },
    });

    return distribution;
  }

  #applyCfnOAC(
    distribution: cdk.aws_cloudfront.Distribution,
    lambda: cdk.aws_lambda.Function,
    bucket: cdk.aws_s3.Bucket,
  ) {
    const cfnDistribution = distribution.node.defaultChild as cdk.aws_cloudfront.CfnDistribution;
    const fnOac = new cdk.aws_cloudfront.CfnOriginAccessControl(this, "lcx-lambda-oac", {
      originAccessControlConfig: {
        name: "lcx-lambda-oac",
        originAccessControlOriginType: "lambda",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const s3Oac = new cdk.aws_cloudfront.CfnOriginAccessControl(this, "lcx-s3-oac", {
      originAccessControlConfig: {
        name: "lcx-s3-oac",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.0.OriginAccessControlId",
      fnOac.attrId,
    );
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.1.S3OriginConfig.OriginAccessIdentity",
      "",
    );
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.1.OriginAccessControlId",
      s3Oac.attrId,
    );

    lambda.addPermission("lcx-allow-cfn-principal", {
      principal: new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunctionUrl",
      sourceArn: `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${
        distribution.distributionId
      }`,
    });

    bucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${
              distribution.distributionId
            }`,
          },
        },
      }),
    );
  }
}
