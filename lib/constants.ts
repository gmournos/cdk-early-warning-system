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
