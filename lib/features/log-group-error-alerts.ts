import { NestedStack, NestedStackProps, RemovalPolicy } from 'aws-cdk-lib';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { buildLogGroupForLambda, createLogSubscriptionAlertFunction } from '../utils/cloudwatch';
import { CLOUDWATCH_ERRORS_FEATURE_FUNCTION, CLOUDWATCH_ERRORS_FEATURE_POLICY } from '../constants';
import { CfnAccountPolicy, ILogGroup } from 'aws-cdk-lib/aws-logs';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export interface LogGroupErrorAlertsStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
}

const FUNCTION_NAME = CLOUDWATCH_ERRORS_FEATURE_FUNCTION;

export class LogGroupErrorAlertsStack extends NestedStack {
    logErrorSubcriptionFunction: IFunction;
    logGroup: ILogGroup;

    constructor(scope: Construct, private id: string, props: LogGroupErrorAlertsStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);

        this.logErrorSubcriptionFunction = this.createLogErrorSubcriptionFunction(props.accountEnvironment, props.destinationTopic);
        this.createGeneralSubscriptionFilter();
    }

    createGeneralSubscriptionFilter() {
        const exceptionalLogGroups = [`/aws/lambda/${FUNCTION_NAME}`]; 
        // cannot use this.logGroup.logGroupName here. The name is a Token and we cannot apply JSON.stringify to it

        const logsPolicy = new CfnAccountPolicy(this, CLOUDWATCH_ERRORS_FEATURE_POLICY, {
            policyDocument: JSON.stringify({
                DestinationArn: this.logErrorSubcriptionFunction.functionArn,
                FilterPattern: '?Runtime.ExitError ?"Task timed out after" ?"ERROR" ?Exception', // system error, e.g. out of memory error, lambda timeout, or just error,
                Distribution: 'Random',
            }),
            selectionCriteria: `LogGroupName NOT IN ${JSON.stringify(exceptionalLogGroups)}`,
            policyName: CLOUDWATCH_ERRORS_FEATURE_POLICY,
            policyType: 'SUBSCRIPTION_FILTER_POLICY',
            scope: 'ALL',
        });
        logsPolicy.applyRemovalPolicy(RemovalPolicy.DESTROY);
        logsPolicy.node.addDependency(this.logGroup);
    }

    createLogErrorSubcriptionFunction(accountEnvironment: string, destinationTopic: ITopic) {
        return createLogSubscriptionAlertFunction({
            scope: this,
            functionName: FUNCTION_NAME,
            accountEnvironment,
            handler: 'sendCustomizedNotificationFromErrorLogSubscription',
            sourceFilePath: ['subscription-filters', 'handlers.ts'],
            destinationTopic,
            logGroup: this.logGroup,
        });
    }
}