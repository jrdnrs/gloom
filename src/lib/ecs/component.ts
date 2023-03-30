import { StructOfArrays, StructDef } from "../collections/arrays_struct";
import { Archetype } from "./archetype";
import { QueryRecord } from "./query";

export type ComponentID = number;

export type ComponentDef = StructDef & {
    _id?: number;
};

export type ComponentArrays<T> = StructOfArrays<T>;

export type ComponentRecord = {
    definition: ComponentDef;
    archetypes: Set<Archetype>;
    queries: QueryRecord[];
};

export class ComponentManager {
    /** Use the componentID to index into the array of archetypes that use that component */
    registry: ComponentRecord[];

    constructor() {
        this.registry = [];
    }

    register(compDef: ComponentDef) {
        if (compDef._id !== undefined) {
            // already registered
            return;
        }

        Object.defineProperty(compDef, "_id", { value: this.registry.length, enumerable: false });

        this.registry.push({ definition: compDef, archetypes: new Set(), queries: [] });
    }
}

// function ands(...args: Archetype[][]): Archetype[] {
//     if (args.length === 1) {
//         return args[0];
//     }
//     if (args.length === 2) {
//         return and(args[0], args[1]);
//     }

//     let common: Archetype[] = and(args[0], args[1]);
//     for (let i = 2; i < args.length; i++) {
//         common = and(common, args[i]);
//     }

//     return common;
// }

// function and(a: Archetype[], b: Archetype[]): Archetype[] {
//     [a, b] = b.length > a.length ? [a, b] : [b, a];
//     const common: Archetype[] = [];

//     for (const archA of a) {
//         for (const archB of b) {
//             if (archA.id === archB.id) {
//                 common.push(archA);
//                 break;
//             }
//         }
//     }

//     return common;
// }
