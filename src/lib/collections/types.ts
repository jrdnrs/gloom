export type TypedArray =
    | Float64Array
    | Float32Array
    | Uint32Array
    | Uint16Array
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Int32Array
    | Int16Array;

export type TypedArrayConstructor =
    | Float64ArrayConstructor
    | Float32ArrayConstructor
    | Uint32ArrayConstructor
    | Uint16ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int8ArrayConstructor
    | Int32ArrayConstructor
    | Int16ArrayConstructor;

export enum Format {
    f64,
    f32,
    u32,
    u16,
    u8,
    i32,
    i16,
    i8,
}
