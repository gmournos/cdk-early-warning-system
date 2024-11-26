import { QuickSightClient, ListDataSetsCommand, Ingestion, ListIngestionsCommand, ListDataSetsCommandOutput, ListIngestionsCommandOutput, DataSetSummary } from "@aws-sdk/client-quicksight";
import { DateTime } from "luxon";
import { withThrottlingRety } from "../backoff/utils";

const client = new QuickSightClient();

export const getAllQsDatasets = async () => {
    let datasets: DataSetSummary[] = [];
    let nextToken: string | undefined;

    do {
        const response: ListDataSetsCommandOutput = await withThrottlingRety(() => client.send(new ListDataSetsCommand({
            AwsAccountId: process.env.ACCOUNT_ID,
            NextToken: nextToken,
        })));
        if (response.DataSetSummaries) {
            datasets = datasets.concat(response.DataSetSummaries);
        }
        nextToken = response.NextToken;
    } while (nextToken);

    return datasets;
};

const filterLastHours = (injestions: Ingestion[], hours: number) => {
    // Get the current timestamp and the timestamp hoursBack hours ago
    const now = DateTime.utc();
    const someHoursAgo = now.minus({ hours });

    return injestions.filter(ingestion => {
        const runTime = DateTime.fromJSDate(ingestion.CreatedTime!);
        return runTime > someHoursAgo;
    });
};

export const getLastHoursIngestions = async (datasetId: string, hours: number) => {
    let ingestions: Ingestion[] = [];
    let nextToken: string | undefined;

    do {
        const response: ListIngestionsCommandOutput = await withThrottlingRety(() => client.send(new ListIngestionsCommand({
            AwsAccountId: process.env.ACCOUNT_ID,
            DataSetId: datasetId,
            NextToken: nextToken,
        })));
        const latestInjestions = filterLastHours(response.Ingestions || [], hours);

        ingestions = ingestions.concat(latestInjestions);
        nextToken = response.NextToken;
    } while (nextToken);

    return ingestions;
};
