import { NestedStack, NestedStackProps, RemovalPolicy } from 'aws-cdk-lib';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { buildLogGroupWithAlertForLambda, createLogSubscriptionAlertFunction, DEFAULT_FILTER_PATTERN, stripLogGroupName } from '../utils/cloudwatch';
import { CLOUDWATCH_ERRORS_FEATURE_FUNCTION, CLOUDWATCH_ERRORS_FEATURE_POLICY, LIBRARY_NAMESPACE } from '../constants';
import { CfnAccountPolicy, ILogGroup, LogGroup, SubscriptionFilter } from 'aws-cdk-lib/aws-logs';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-logs-destinations';

export type ErrorLogPattern = {
    errorType: string,
    logPatternString : string;
};

export type ErrorLogPatterns = [] | [ErrorLogPattern] | [ErrorLogPattern, ErrorLogPattern]; 
// can be zero if we want no logging, is 2 at maximum, as Cloudwatch does not allow more than 2 subscription filters per log group

export interface LogGroupErrorAlertsStackProps extends NestedStackProps {
    destinationTopic: ITopic;
    accountEnvironment: string;
    customLogFilterPatternsPerLogGroup: Record<string, ErrorLogPatterns>; // keeps the correspondence of logGroupName to custom log patterns
}

const FUNCTION_NAME = CLOUDWATCH_ERRORS_FEATURE_FUNCTION;

export class LogGroupErrorAlertsStack extends NestedStack {
    logErrorSubcriptionFunction: IFunction;
    logGroup: ILogGroup;

    constructor(scope: Construct, private id: string, props: LogGroupErrorAlertsStackProps) {
        super(scope, id, props);
        this.logGroup = buildLogGroupWithAlertForLambda(this, FUNCTION_NAME, props.destinationTopic);

        this.logErrorSubcriptionFunction = this.createLogErrorSubcriptionFunction(props.accountEnvironment, props.destinationTopic);
        this.createGeneralSubscriptionFilter(props.customLogFilterPatternsPerLogGroup);

        for (const [logGroupName, errorLogPatterns] of Object.entries(props.customLogFilterPatternsPerLogGroup)) {

            // Lookup the CloudWatch log group
            const strippedLogGroupName = stripLogGroupName(logGroupName);
            const logGroup = LogGroup.fromLogGroupName(scope, `error-detect-${strippedLogGroupName}-ref`, logGroupName);

            const createdFilters : SubscriptionFilter[] = [];

            for (let i = 0; i < errorLogPatterns.length; i++) {
                const { errorType, logPatternString } = errorLogPatterns[i];
                const prefix = `${LIBRARY_NAMESPACE}-${errorType}-${strippedLogGroupName}`;

                createdFilters.push(logGroup.addSubscriptionFilter(`${prefix}-subscription`, {
                    filterName: `${prefix}-filter`,
                    destination: new LambdaDestination(this.logErrorSubcriptionFunction, {
                        addPermissions: false, 
                        // wer are giving permissions already inside createLogSubscriptionAlertFunction so we do not need this.
                        // Additionally it will create one allow Function invoke policy for each filter and might make us exceed limits for created policies per stack
                    }),
                    filterPattern: { logPatternString }, 
                }));
                const batchSize = 1;

                // add a dependency to serialize filter creation and avoid Rate Exceeded errors
                if ( i >= batchSize) { // batches of 1 !!!!
                    createdFilters[i].node.addDependency(createdFilters[i-batchSize]); 
                }
            }
        }

    }

    createGeneralSubscriptionFilter(customLogFilterPatternsPerLogGroup: Record<string, ErrorLogPatterns>) {
        const allCustomFiltersLogGroups = Object.keys(customLogFilterPatternsPerLogGroup);
        const exceptionalLogGroups = [...allCustomFiltersLogGroups, `/aws/lambda/${FUNCTION_NAME}`]; 
        // cannot use this.logGroup.logGroupName here. The name is a Token and we cannot apply JSON.stringify to it

        const logsPolicy = new CfnAccountPolicy(this, CLOUDWATCH_ERRORS_FEATURE_POLICY, {
            policyDocument: JSON.stringify({
                DestinationArn: this.logErrorSubcriptionFunction.functionArn,
                FilterPattern: DEFAULT_FILTER_PATTERN,
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