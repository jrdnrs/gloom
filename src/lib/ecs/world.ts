import { ComponentDef, ComponentManager } from "./component";
import { Archetype, ArchetypeManager } from "./archetype";
import { Entity, EntityManager } from "./entity";
import { Struct } from "../collections/arrays_struct";
import { System, SystemManager } from "./system";
import { QueryManager, QueryRecord } from "./query";

export default class World {
    private entityManager: EntityManager;
    private archManager: ArchetypeManager;
    private compManager: ComponentManager;
    private systemManager: SystemManager;
    private queryManager: QueryManager;

    constructor() {
        this.archManager = new ArchetypeManager();
        // empty root archetype
        const root = new Archetype(0, [], []);
        this.archManager.archetypes.set(0, root);

        this.entityManager = new EntityManager(root);
        this.compManager = new ComponentManager();
        this.systemManager = new SystemManager();
        this.queryManager = new QueryManager();
    }

    createEntity(): Entity {
        return this.entityManager.create();
    }

    removeEntity(entity: Entity) {
        if (this.entityManager.alive(entity)) {
            this.entityManager.remove(entity);
            entity.record.archetype.removeEntity(entity);
        }
    }

    entityAlive(entity: Entity): boolean {
        return this.entityManager.alive(entity);
    }

    registerComponent(compDef: ComponentDef) {
        this.compManager.register(compDef);
    }

    addComponent(entity: Entity, compDef: ComponentDef, component?: Struct) {
        if (!this.entityManager.alive(entity)) {
            return;
        }

        const newArch = this.archManager.extendArchetype(
            entity.record.archetype,
            compDef._id!,
            this.compManager,
            this.queryManager
        );
        if (newArch !== entity.record.archetype) {
            this.archManager.moveEntity(entity, newArch, component);
        }
    }

    removeComponent(entity: Entity, compDef: ComponentDef) {
        if (!this.entityManager.alive(entity)) {
            return;
        }

        const newArch = this.archManager.reduceArchetype(
            entity.record.archetype,
            compDef._id!,
            this.compManager,
            this.queryManager
        );
        if (newArch !== entity.record.archetype) {
            this.archManager.moveEntity(entity, newArch);
        }
    }

    hasComponent(entity: Entity, compDef: ComponentDef): boolean {
        if (!this.entityManager.alive(entity)) {
            return false;
        }

        return entity.record.archetype.components.has(compDef._id!);
    }

    addSystem(system: System, query: QueryRecord) {
        this.systemManager.addSystem(system, query);
    }

    runSystems() {
        this.systemManager.runAll();
    }

    createQuery(...comps: ComponentDef[]): QueryRecord {
        return this.queryManager.createRecord(comps, this.compManager.registry);
    }
}
