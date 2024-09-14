import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroupRetentionStack } from './features/log-group-retention';
import { ALERTS_TOPIC_ID, ALERTS_TOPIC_NAME, CLOUDWATCH_ERRORS_FEATURE_STACK, DEFAULT_RETENTION_FEATURE_STACK } from './constants';
import { LogGroupErrorAlertsStack } from './features/log-group-error-alerts';
import { Topic } from 'aws-cdk-lib/aws-sns';

export class AwsCdkEarlyWarningSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new LogGroupRetentionStack(this, DEFAULT_RETENTION_FEATURE_STACK, props);

    const topic = new Topic(this, ALERTS_TOPIC_ID, {
      topicName : ALERTS_TOPIC_NAME,
    });
    new LogGroupErrorAlertsStack(this, CLOUDWATCH_ERRORS_FEATURE_STACK, {
      ...props,
      destinationTopic: topic
    });

  }
}
