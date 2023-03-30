import { StructOfArrays_, clearRow, copyRow, newStructOfArrays, setRow, Struct } from "../collections/arrays_struct";
import { ComponentDef, ComponentID, ComponentManager, ComponentRecord } from "./component";
import { Entity } from "./entity";
import { QueryManager } from "./query";
import { hashInts } from "./util";

const MAX_ARCHETYPE_ENTITIES = 4096;

export type ArchetypeID = number;

export type ArchetypeRecord = {
    archetype: Archetype;
    row: number;
};

export class Archetype {
    id: ArchetypeID;
    entities: Entity[];
    components: Map<ComponentID, StructOfArrays_>;
    edges: Map<ComponentID, Archetype>;

    constructor(id: ArchetypeID, compIDs: ComponentID[], compDefs: ComponentDef[]) {
        this.id = id;
        this.entities = [];
        this.components = new Map();
        this.edges = new Map();

        for (let i = 0; i < compIDs.length; i++) {
            this.components.set(compIDs[i], newStructOfArrays(compDefs[i], MAX_ARCHETYPE_ENTITIES) as StructOfArrays_);
        }
    }

    addEntity(entity: Entity) {
        entity.record.archetype = this;
        entity.record.row = this.entities.length;
        this.entities.push(entity);
    }

    removeEntity(entity: Entity) {
        const lastRow = this.entities.length - 1;
        if (lastRow < 0) return;
        for (const compList of this.components.values()) {
            copyRow(compList, compList, lastRow, entity.record.row)
        }
        this.entities[entity.record.row] = this.entities[lastRow];
        this.entities[entity.record.row].record.row = entity.record.row;
        this.entities.pop();
    }
}

export class ArchetypeManager {
    archetypes: Map<ArchetypeID, Archetype>;

    constructor() {
        this.archetypes = new Map();
    }

    moveEntity(entity: Entity, newArchetype: Archetype, newComp?: Struct) {
        // move components over to new archetype
        for (const [compID, newCompArray] of newArchetype.components.entries()) {
            let oldCompArray = entity.record.archetype.components.get(compID);
            if (oldCompArray !== undefined) {
                copyRow(oldCompArray, newCompArray, entity.record.row);
            } else if (newComp !== undefined) {
                setRow(newComp, newCompArray, entity.record.row);
            } else {
                clearRow(newCompArray, entity.record.row)
            }
        }

        entity.record.archetype.removeEntity(entity);
        newArchetype.addEntity(entity);
    }

    extendArchetype(archetype: Archetype, compID: ComponentID, compManager: ComponentManager, queryManager: QueryManager): Archetype {
        // check if the archetype already has the component
        if (archetype.components.has(compID)) {
            return archetype;
        }

        // check if there is an existing edge for the desired archetype
        let nextArch = archetype.edges.get(compID);
        if (nextArch !== undefined) {
            return nextArch;
        }

        // check if archetype already exists but there just was no edge
        const compIDs = [...archetype.components.keys(), compID].sort();
        const archetypeID = hashInts(compIDs);
        nextArch = this.archetypes.get(archetypeID);
        if (nextArch !== undefined) {
            archetype.edges.set(compID, nextArch);
            nextArch.edges.set(compID, archetype);

            return nextArch;
        }

        // need to create the desired archetype
        const compDefs: ComponentDef[] = [];
        for (const id of compIDs) {
            compDefs.push(compManager.registry[id].definition);
        }
        nextArch = new Archetype(archetypeID, compIDs, compDefs);
        this.archetypes.set(archetypeID, nextArch);
        archetype.edges.set(compID, nextArch);
        nextArch.edges.set(compID, archetype);

        // add the new archetype to the registry
        for (const id of compIDs) {
            const compRecord = compManager.registry[id];
            compRecord.archetypes.add(nextArch);
            for (const query of compRecord.queries) {
                queryManager.updateRecord(query, nextArch)
            }
        }

        return nextArch;
    }

    reduceArchetype(archetype: Archetype, compID: ComponentID, compManager: ComponentManager, queryManager: QueryManager): Archetype {
        // check if the archetype already lacks the component
        if (!archetype.components.has(compID)) {
            return archetype;
        }

        // check if there is an existing edge for the desired archetype
        let nextArch = archetype.edges.get(compID);
        if (nextArch !== undefined) {
            return nextArch;
        }

        // check if archetype already exists but there just was no edge
        const compIDs = [...archetype.components.keys()].filter((id) => id !== id).sort();
        const archetypeID = hashInts(compIDs);
        nextArch = this.archetypes.get(archetypeID);
        if (nextArch !== undefined) {
            archetype.edges.set(compID, nextArch);
            nextArch.edges.set(compID, archetype);

            return nextArch;
        }

        // need to create the desired archetype
        const compDefs: ComponentDef[] = [];
        for (const id of compIDs) {
            compDefs.push(compManager.registry[id].definition);
        }
        nextArch = new Archetype(archetypeID, compIDs, compDefs);
        this.archetypes.set(archetypeID, nextArch);
        archetype.edges.set(compID, nextArch);
        nextArch.edges.set(compID, archetype);

        // add the new archetype to the registry
        for (const id of compIDs) {
            const compRecord = compManager.registry[id];
            compRecord.archetypes.add(nextArch);
            for (const query of compRecord.queries) {
                queryManager.updateRecord(query, nextArch)
            }
        }

        return nextArch;
    }
}
