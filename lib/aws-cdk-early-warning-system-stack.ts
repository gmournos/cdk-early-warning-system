import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroupRetentionStack } from './features/log-group-retention';
import { CLOUDWATCH_ERRORS_FEATURE_STACK, DEFAULT_RETENTION_FEATURE_STACK } from './constants';
import { LogGroupErrorAlertsStack } from './features/log-group-error-alerts';

export class AwsCdkEarlyWarningSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new LogGroupRetentionStack(this, DEFAULT_RETENTION_FEATURE_STACK, props);
    new LogGroupErrorAlertsStack(this, CLOUDWATCH_ERRORS_FEATURE_STACK, props);
  }
}
