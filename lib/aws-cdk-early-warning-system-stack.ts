import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroupRetentionStack } from './features/log-group-retention';
import { DEFAULT_RETENTION_FEATURE_STACK } from './constants';

export class AwsCdkEarlyWarningSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new LogGroupRetentionStack(this, DEFAULT_RETENTION_FEATURE_STACK, props);
  }
}
