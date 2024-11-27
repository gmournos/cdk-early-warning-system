import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { CLOUDWATCH_ALARMS_FEATURE_FUNCTION } from '../constants';

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
    }

}