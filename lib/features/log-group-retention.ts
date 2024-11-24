import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { DEFAULT_RETENTION_PARAM_KEY } from '../constants';

export class LogGroupRetentionStack extends NestedStack {

    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);
        const defaultRetentionParam = StringParameter.valueForStringParameter(this, DEFAULT_RETENTION_PARAM_KEY);
        const defaultRetention = parseInt(defaultRetentionParam);
    }
}