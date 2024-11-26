export const LIBRARY_NAMESPACE = 'ews';
export const ALERTS_TOPIC_ID = `${LIBRARY_NAMESPACE}-alerts-topic`;
export const ALERTS_TOPIC_NAME = `EarlyWarningSystemAlerts`;

export const DEFAULT_RETENTION_FEATURE = `${LIBRARY_NAMESPACE}-cloudwatch-default-retention`;
export const DEFAULT_RETENTION_FEATURE_STACK = `${DEFAULT_RETENTION_FEATURE}-stack`;
export const DEFAULT_RETENTION_PARAM_KEY = `/${LIBRARY_NAMESPACE}/cloudwatch/logs/retetion`;
export const DEFAULT_RETENTION_FEATURE_FUNCTION = `${DEFAULT_RETENTION_FEATURE}-function`;
export const DEFAULT_RETENTION_FEATURE_RULE = `${DEFAULT_RETENTION_FEATURE}-rule`;

export const CLOUDWATCH_ERRORS_FEATURE = `${LIBRARY_NAMESPACE}-cloudwatch-error-detection`;
export const CLOUDWATCH_ERRORS_FEATURE_STACK = `${CLOUDWATCH_ERRORS_FEATURE}-stack`;
export const CLOUDWATCH_ERRORS_FEATURE_FUNCTION = `${CLOUDWATCH_ERRORS_FEATURE}-function`;
export const CLOUDWATCH_ERRORS_FEATURE_POLICY = `${CLOUDWATCH_ERRORS_FEATURE}-policy`;

export const GLUE_JOB_FAILURE_FEATURE = `${LIBRARY_NAMESPACE}-glue-etl-failure`;
export const GLUE_JOB_FAILURE_FEATURE_STACK = `${GLUE_JOB_FAILURE_FEATURE}-stack`;
export const GLUE_JOB_FAILURE_FEATURE_FUNCTION = `${GLUE_JOB_FAILURE_FEATURE}-function`;
export const GLUE_JOB_FAILURE_FEATURE_RULE = `${GLUE_JOB_FAILURE_FEATURE}-rule`;

export const GLUE_FAILURE_SUMMARY_FEATURE = `${LIBRARY_NAMESPACE}-glue-failure-summary`;
export const GLUE_FAILURE_SUMMARY_FEATURE_STACK = `${GLUE_FAILURE_SUMMARY_FEATURE}-stack`;



export const PRODUCTION_ENVIRONMENT_NAMES = ['PRODUCTION'];
