import { TypedArray, TypedArrayConstructor } from "./types";

export class Vec {
    private bufferConstructor: TypedArrayConstructor;
    private buffer: TypedArray;
    private capacity: number;
    length: number;

    constructor(type: TypedArrayConstructor, withCapacity = 32) {
        this.buffer = new type(32);
        this.bufferConstructor = type;
        this.capacity = withCapacity;
        this.length = 0;
    }

    private grow() {
        this.capacity *= 2;
        let newBuffer = new this.bufferConstructor(this.capacity);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
    }

    set(v: number, i: number) {
        this.buffer[i] = v;
    }

    get(i: number): number | undefined {
        return this.buffer[i];
    }

    push(v: number) {
        if (this.length === this.capacity) {
            this.grow();
        }
        this.buffer[this.length] = v;
        this.length += 1;
    }

    pop(): number | undefined {
        this.length -= 1;
        return this.buffer[this.length];
    }

    swap_pop(i: number): number | undefined {
        this.buffer[i] = this.buffer[this.length - 1];
        return this.pop();
    }
}

export function growTypedArray<T extends TypedArray>(array: T): T {
    let newArray = new (Object.getPrototypeOf(array).constructor)(array.length * 2) as T;
    newArray.set(array);
    return newArray;
}
