import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { DEFAULT_RETENTION_FEATURE_FUNCTION, DEFAULT_RETENTION_FEATURE_RULE, DEFAULT_RETENTION_PARAM_KEY } from '../constants';
import * as path from 'path';
import { buildLogGroupForLambda } from '../utils/cloudwatch';
import { ILogGroup } from 'aws-cdk-lib/aws-logs';

const FUNCTION_NAME = DEFAULT_RETENTION_FEATURE_FUNCTION;

export class LogGroupRetentionStack extends NestedStack {
    logGroup: ILogGroup;

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);
        const defaultRetentionParam = StringParameter.valueForStringParameter(this, DEFAULT_RETENTION_PARAM_KEY);
        parseInt(defaultRetentionParam); // validation to make sure it is an integer

        this.logGroup = buildLogGroupForLambda(this, FUNCTION_NAME);

        const setLogPolicy = new PolicyStatement({
            actions: [
                'logs:PutRetentionPolicy',  
            ],
            effect: Effect.ALLOW,
            resources: [
                '*',
            ],
        });

        const setDefaultRetentionLambda = new NodejsFunction(this, DEFAULT_RETENTION_FEATURE_FUNCTION, {
            functionName: FUNCTION_NAME,
            runtime: Runtime.NODEJS_20_X,
            handler: 'setDefaultRetentionFromRule',
            entry: path.join('lambda', 'log-groups', 'handlers.ts'),
            environment: {
                RETENTION_IN_DAYS : defaultRetentionParam,
            },
            logGroup: this.logGroup,
        });

        setDefaultRetentionLambda.addToRolePolicy(setLogPolicy);

        new Rule(this, DEFAULT_RETENTION_FEATURE_RULE, {
            ruleName: DEFAULT_RETENTION_FEATURE_RULE,
            description: 'Assign default retention to cloudwatch log groups',
            eventPattern: {
                detailType: ['AWS API Call via CloudTrail'],
                source: ['aws.logs'],
                detail: {
                    eventSource: [ 'logs.amazonaws.com' ],
                    eventName: [ 'CreateLogGroup'],
                },
            },
            targets: [ new LambdaFunction(setDefaultRetentionLambda) ],

        });
    }
}