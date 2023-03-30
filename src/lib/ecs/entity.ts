import Queue from "../collections/queue";
import { Archetype, ArchetypeRecord } from "./archetype";

const MINIMUM_FREE_SPACES = 1024;

export type EntityID = number;

export class Entity {
    // id: EntityID;
    index: number;
    version: number;
    record: ArchetypeRecord;

    constructor(index: number, version: number, record: ArchetypeRecord) {
        this.index = index;
        this.version = version;
        this.record = record;
    }
}

export class EntityManager {
    entities: Entity[];
    private entityVersions: number[];
    private freeSpaces: Queue;
    private defaultArchetype: Archetype;

    constructor(defaultArchetype: Archetype) {
        this.entities = [];
        this.entityVersions = [];
        this.freeSpaces = new Queue(MINIMUM_FREE_SPACES, Uint32Array);
        this.defaultArchetype = defaultArchetype;
    }

    create(): Entity {
        let index: number, version: number;

        if (this.freeSpaces.length() > MINIMUM_FREE_SPACES) {
            index = this.freeSpaces.pop()!;
            version = this.entityVersions[index];
        } else {
            index = this.entityVersions.length;
            version = 0;
            this.entityVersions.push(0);
        }

        const entity = new Entity(index, version, {
            archetype: this.defaultArchetype,
            row: 0,
        });

        this.entities[index] = entity;
        return entity;
    }

    alive(entity: Entity): boolean {
        return this.entityVersions[entity.index] === entity.version;
    }

    remove(entity: Entity) {
        this.entityVersions[entity.index]++;
        this.freeSpaces.push(entity.index);
    }
}
