import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { CLOUDFRONT_ERRORS_FEATURE_FUNCTION } from '../constants';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

export interface CloudfrontErrorsStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
    logCloudFrontBucketArn: string;
}

const FUNCTION_NAME = CLOUDFRONT_ERRORS_FEATURE_FUNCTION;

export class CloudfrontErrorsStack extends NestedStack {
    logGroup: ILogGroup;
    cfAccessLogProcessor: NodejsFunction;
    accessLogsBucket: IBucket;

    constructor(scope: Construct, id: string, props: CloudfrontErrorsStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);
        this.accessLogsBucket = Bucket.fromBucketArn(this, 'cf-access-log-bucket-ref', props.logCloudFrontBucketArn);
        this.cfAccessLogProcessor = this.createCfAccessLogProcessorFunction(props.accountEnvironment, props.destinationTopic);
        this.accessLogsBucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(this.cfAccessLogProcessor));
    }

    readObjectAccessToBuckets = function(bucketArns: string[]) {
        const bucketChildrenArns = bucketArns.map(bucketArn => `${bucketArn}/*`);

        return [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    's3:GetBucketLocation',
                    's3:ListBucket',
                ],
                resources: bucketArns,
            }), 
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    's3:GetObject',
                ],
                resources: bucketChildrenArns,
            }),
        ];
    };


    createCfAccessLogProcessorFunction(accountEnvironment: string, destinationTopic: ITopic) {
        const sendToTopicPolicy = new PolicyStatement({
            actions: [
                'sns:Publish',
            ],
            effect: Effect.ALLOW,
            resources: [
                destinationTopic.topicArn,
            ],
        });

        const cfAccessLogProcessorFunction = new NodejsFunction(this, 'cf-access-logs-function', {
            functionName: FUNCTION_NAME,
            logGroup : this.logGroup,
            runtime: Runtime.NODEJS_18_X,
            handler: 'retrieveErrorLines',
            entry: path.join('lambda', 'cloudfront', 'handlers.ts'),
            timeout: Duration.seconds(120), 
            environment: {
                TOPIC_ARN : destinationTopic.topicArn,
                ACCOUNT_ENVIRONMENT: accountEnvironment.toUpperCase(),
            },
        });
        const readObjectAccesses = this.readObjectAccessToBuckets([this.accessLogsBucket.bucketArn]);

        for (const p of readObjectAccesses) { 
            cfAccessLogProcessorFunction.addToRolePolicy(p);
        }
        cfAccessLogProcessorFunction.addToRolePolicy(sendToTopicPolicy);
        return cfAccessLogProcessorFunction;
    }
}