import { ComponentArrays } from "./component";
import { QueryRecord, QueryResult } from "./query";

export type System = (length: number, ...components: ComponentArrays<any>[]) => void;

export class SystemManager {
    systems: System[];
    queryRecords: QueryRecord[];
    queryResults: QueryResult[];

    constructor() {
        this.systems = [];
        this.queryRecords = [];
        this.queryResults = [];
    }

    addSystem(system: System, query: QueryRecord) {
        this.systems.push(system);
        this.queryRecords.push(query);
        this.queryResults.push(query.result);
    }

    runAll() {
        for (let i = 0; i < this.systems.length; i++) {
            const system = this.systems[i];
            const result = this.queryResults[i];
            for (const chunk of result.chunks) {
                system(chunk.entities.length, ...chunk.components);
            }
        }
    }
}
