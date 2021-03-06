import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class RDSClustersCollector extends BaseCollector {
    public collect() {
        return this.getAllClusters();
    }

    private async getAllClusters() {

        const self = this;

        const serviceName = "RDS";
        const rdsRegions = self.getRegions(serviceName);
        const clusters = {};

        for (const region of rdsRegions) {
            try {
                const rds = self.getClient(serviceName, region) as AWS.RDS;
                clusters[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const clustersResponse: AWS.RDS.DBClusterMessage =
                        await rds.describeDBClusters({ Marker: marker }).promise();
                    clusters[region] = clusters[region].concat(clustersResponse.DBClusters);
                    marker = clustersResponse.Marker;
                    fetchPending = marker !== undefined;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { clusters };
    }
}
