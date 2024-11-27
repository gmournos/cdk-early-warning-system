import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { APIGW_ERRORS_FEATURE_FUNCTION } from '../constants';

const FUNCTION_NAME = APIGW_ERRORS_FEATURE_FUNCTION;

interface ApiGatewayNotificationsStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
    accessLogsArnRefs: string[];
}

export class ApiGatewayNotificationsStack extends NestedStack {
    private sendCustomizedNotificationFunction: IFunction;
    private logGroup: ILogGroup;

    constructor(scope: Construct, id: string, props: ApiGatewayNotificationsStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);
    }
}