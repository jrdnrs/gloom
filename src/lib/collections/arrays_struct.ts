import { Format, TypedArray } from "./types";

export type StructDef = {
    [k: string]: Format | StructDef;
};

export type Struct = {
    [k: string]: number | Struct;
};

export type StructOfArrays<T> = {
    [K in keyof T]: T[K] extends Format ? TypedArray : StructOfArrays<T[K]>;
};

export type StructOfArrays_ = { [k: string]: TypedArray | StructOfArrays_ };

export function newStructOfArrays<T extends StructDef>(def: T, capacity: number): StructOfArrays<T> {
    return recurseStructDef(def, capacity) as StructOfArrays<T>;
}

function recurseStructDef(def: StructDef, capacity: number, struct: any = {}): StructOfArrays_ {
    for (const [key, type] of Object.entries(def)) {
        switch (type) {
            case Format.f64:
                Object.defineProperty(struct, key, { value: new Float64Array(capacity), enumerable: true });
                break;

            case Format.f32:
                Object.defineProperty(struct, key, { value: new Float32Array(capacity), enumerable: true });
                break;

            case Format.u32:
                Object.defineProperty(struct, key, { value: new Uint32Array(capacity), enumerable: true });
                break;

            case Format.u16:
                Object.defineProperty(struct, key, { value: new Uint16Array(capacity), enumerable: true });
                break;

            case Format.u8:
                Object.defineProperty(struct, key, { value: new Uint8Array(capacity), enumerable: true });
                break;

            case Format.i32:
                Object.defineProperty(struct, key, { value: new Int32Array(capacity), enumerable: true });
                break;

            case Format.i16:
                Object.defineProperty(struct, key, { value: new Int16Array(capacity), enumerable: true });
                break;

            case Format.i8:
                Object.defineProperty(struct, key, { value: new Int8Array(capacity), enumerable: true });
                break;

            default:
                // type is another StructDef
                Object.defineProperty(struct, key, { value: {}, enumerable: true });
                recurseStructDef(def[key] as StructDef, capacity, struct[key]);
                break;
        }
    }
    return struct;
}

export function copyRow(from: StructOfArrays_, to: StructOfArrays_, srcRow: number, dstRow: number = srcRow) {
    for (const [key, type] of Object.entries(from)) {
        if (ArrayBuffer.isView(type)) {
            (to[key] as TypedArray)[dstRow] = (from[key] as TypedArray)[srcRow];
        } else {
            copyRow(from[key] as StructOfArrays_, to[key] as StructOfArrays_, srcRow);
        }
    }
}

export function setRow(from: Struct, to: StructOfArrays_, row: number) {
    for (const [key, type] of Object.entries(from)) {
        if (typeof type === "number") {
            (to[key] as TypedArray)[row] = from[key] as number;
        } else {
            setRow(from[key] as Struct, to[key] as StructOfArrays_, row);
        }
    }
}

export function clearRow(arrays: StructOfArrays_, row: number) {
    for (const [key, type] of Object.entries(arrays)) {
        if (ArrayBuffer.isView(type)) {
            (arrays[key] as TypedArray)[row] = 0;
        } else {
            clearRow(arrays as StructOfArrays_, row);
        }
    }
}
