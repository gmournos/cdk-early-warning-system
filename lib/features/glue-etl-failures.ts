import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { GLUE_JOB_FAILURE_FEATURE_FUNCTION, GLUE_JOB_FAILURE_FEATURE_RULE } from '../constants';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export interface GlueJobFailuresStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
}

const FUNCTION_NAME = GLUE_JOB_FAILURE_FEATURE_FUNCTION;

export class GlueJobFailuresStack extends NestedStack {
    failedEtlFunction: IFunction;
    logGroup: ILogGroup;
    
    constructor(scope: Construct, id: string, props: GlueJobFailuresStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);
        this.failedEtlFunction = this.createFailedEtlLambdaFunction(props.accountEnvironment, props.destinationTopic);
        this.createErrorRule();
    }

    createFailedEtlLambdaFunction(accountEnvironment: string, destinationTopic: ITopic) {

        const sendToTopicPolicy = new PolicyStatement({
            actions: [
                'sns:Publish',
            ],
            effect: Effect.ALLOW,
            resources: [
                destinationTopic.topicArn,
            ],
        });

        const sendCustomizedNotificationFromEtlFailedEvent = new NodejsFunction(this, GLUE_JOB_FAILURE_FEATURE_FUNCTION, {
            functionName: FUNCTION_NAME,
            logGroup: this.logGroup,
            runtime: Runtime.NODEJS_20_X,
            handler: 'sendCustomizedNotificationFromEtlFailedEvent',
            entry: path.join('lambda', 'glue', 'handlers.ts'),
            environment: {
                TOPIC_ARN : destinationTopic.topicArn,
                ACCOUNT_ENVIRONMENT: accountEnvironment.toUpperCase(),
            },
        });

        sendCustomizedNotificationFromEtlFailedEvent.addToRolePolicy(sendToTopicPolicy);
        return sendCustomizedNotificationFromEtlFailedEvent;
    }

    createErrorRule() {

        // Define the EventBridge rule
        const rule = new Rule(this, GLUE_JOB_FAILURE_FEATURE_RULE, {
            ruleName: GLUE_JOB_FAILURE_FEATURE_RULE,
            eventPattern: {
                source: ['aws.glue'],
                detailType: ['Glue Job State Change'],
                detail: {
                    state: ['FAILED'],
                },
            },
        });
        rule.addTarget(new LambdaFunction(this.failedEtlFunction)); // Replace yourLambdaFunction with your Lambda function
    }
}