import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroupRetentionStack } from './features/log-group-retention';
import { ALERTS_TOPIC_ID, ALERTS_TOPIC_NAME, CLOUDWATCH_ERRORS_FEATURE_STACK, DEFAULT_RETENTION_FEATURE_STACK } from './constants';
import { LogGroupErrorAlertsStack } from './features/log-group-error-alerts';
import { Topic } from 'aws-cdk-lib/aws-sns';

export interface AwsCdkEarlyWarningSystemStackProps extends cdk.StackProps {
  environmentName: string, 
  // make it deployable with the uniform pipelines 
  // https://github.com/gmournos/uniform-pipeline-tutorial/commit/59f27d01e6ee88c75cbab41b6ed3d0befb179f6d#diff-c5d4b6d97b604fa62c1da2a285dc7e6110f74344e57fb99dadc4a0c0979531c0R21
}
export class AwsCdkEarlyWarningSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsCdkEarlyWarningSystemStackProps) {
    super(scope, id, props);
    new LogGroupRetentionStack(this, DEFAULT_RETENTION_FEATURE_STACK, props);

    const topic = new Topic(this, ALERTS_TOPIC_ID, {
      topicName : ALERTS_TOPIC_NAME,
    });
    
    const accountEnvironment = props.environmentName;
    
    new LogGroupErrorAlertsStack(this, CLOUDWATCH_ERRORS_FEATURE_STACK, {
      ...props,
      destinationTopic: topic,
      accountEnvironment,
      customLogFilterPatternsPerLogGroup: {
        '/aws/cloudtrail': [],
      },
    });

  }
}
