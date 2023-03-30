import { StructOfArrays_ } from "../collections/arrays_struct";
import { Archetype } from "./archetype";
import { ComponentDef, ComponentID, ComponentRecord } from "./component";
import { Entity } from "./entity";
import { intersection, hashInts } from "./util";

export type QueryRecord = {
    compIDs: number[];
    result: QueryResult;
};

export type QueryResult = {
    archetypes: Archetype[];
    chunks: QueryResultChunk[];
};

export type QueryResultChunk = {
    components: StructOfArrays_[];
    entities: Entity[];
};

export class QueryManager {
    queries: Map<number, QueryRecord>;

    constructor() {
        this.queries = new Map();
    }

    getResult(archSet: Set<Archetype>, compIDs: ComponentID[]): QueryResult {
        const chunks: QueryResultChunk[] = [];
        const archetypes: Archetype[] = [];

        for (const arch of archSet) {
            archetypes.push(arch);
            const components: StructOfArrays_[] = [];
            for (const id of compIDs) {
                components.push(arch.components.get(id)!);
            }
            chunks.push({
                components,
                entities: arch.entities,
            });
        }

        return { archetypes, chunks };
    }

    createRecord(compDefs: ComponentDef[], registry: ComponentRecord[]): QueryRecord {
        let archs: Set<Archetype> = new Set();
        const compIDs: ComponentID[] = [];
        for (const compDef of compDefs) {
            compIDs.push(compDef._id!);
            archs = intersection(archs, registry[compDef._id!].archetypes);
        }

        const queryID = hashInts(compIDs);
        const result = this.getResult(archs, compIDs);
        const record: QueryRecord = { compIDs, result };

        for (const compID of compIDs) {
            registry[compID].queries.push(record);
        }

        this.queries.set(queryID, record);

        return record;
    }

    updateRecord(record: QueryRecord, archetype: Archetype) {
        const components = [];

        for (const compID of record.compIDs) {
            const comp = archetype.components.get(compID);
            if (comp === undefined) return;
            components.push(comp);
        }

        record.result.archetypes.push(archetype);
        record.result.chunks.push({
            components,
            entities: archetype.entities,
        });
    }
}
