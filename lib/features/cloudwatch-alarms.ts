import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { CLOUDWATCH_ALARMS_FEATURE_FUNCTION } from '../constants';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export interface NotificationsOnAlarmsStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
}

const FUNCTION_NAME = CLOUDWATCH_ALARMS_FEATURE_FUNCTION;

export class NotificationsOnAlarmsStack extends NestedStack {
    customNotificationsOnAlarms: IFunction;
    logGroup: ILogGroup;

    constructor(scope: Construct, id: string, props: NotificationsOnAlarmsStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);
        this.customNotificationsOnAlarms = this.createLambdaFunction(props.accountEnvironment, props.destinationTopic);
    }

    createLambdaFunction(accountEnvironment: string, destinationTopic: ITopic) {

        const sendToTopicPolicy = new PolicyStatement({
            actions: [
                'sns:Publish',
            ],
            effect: Effect.ALLOW,
            resources: [
                destinationTopic.topicArn,
            ],
        });

        const sendCustomizedNotificationFromAlarm = new NodejsFunction(this, FUNCTION_NAME, {
            functionName: FUNCTION_NAME,
            logGroup: this.logGroup,
            runtime: Runtime.NODEJS_20_X,
            handler: 'sendCustomizedNotificationFromAlarm',
            entry: path.join('lambda', 'alarms', 'handlers.ts'),
            environment: {
                TOPIC_ARN : destinationTopic.topicArn,
                ACCOUNT_ENVIRONMENT: accountEnvironment.toUpperCase(),
            },
        });

        sendCustomizedNotificationFromAlarm.addToRolePolicy(sendToTopicPolicy);
        return sendCustomizedNotificationFromAlarm;
    }

}