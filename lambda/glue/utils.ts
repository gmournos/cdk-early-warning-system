import { GlueClient, GetJobsCommand, GetJobRunsCommand, JobRun, GetJobRunsCommandInput } from "@aws-sdk/client-glue";
import { DateTime } from "luxon";
import { withThrottlingRety } from "../backoff/utils";

const glueClient = new GlueClient();

export const getAllEtlJobs = async () => {
// Get the list of Glue jobs
    const getJobsCommand = new GetJobsCommand({});
    const { Jobs } = await withThrottlingRety(async () => glueClient.send(getJobsCommand));
    return Jobs || [];
};
const filterLastHours = (jobRuns: JobRun[], hours: number) => {
    // Get the current timestamp and the timestamp hoursBack hours ago
    const now = DateTime.utc();
    const someHoursAgo = now.minus({ hours });

    return jobRuns.filter(jobRun => {
        const runTime = DateTime.fromJSDate(jobRun.StartedOn!);
        return runTime > someHoursAgo;
    });
};

export const getLastHoursJobRuns = async (jobName: string, hours: number) => {
    const jobRuns: JobRun[] = [];
    let nextToken: string | undefined;

    do {
        const getJobRunsParams : GetJobRunsCommandInput = {
            JobName: jobName,
            MaxResults: 25,
            NextToken: nextToken,
        };

        const getJobRunsCommand: GetJobRunsCommand = new GetJobRunsCommand(getJobRunsParams);
        const { JobRuns, NextToken } = await withThrottlingRety(async () => glueClient.send(getJobRunsCommand));
        const latestJobRuns = filterLastHours(JobRuns || [], hours);

        jobRuns.push(...latestJobRuns);
        nextToken = NextToken;
    } while (nextToken);

    return jobRuns;
};

