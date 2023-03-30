import { TypedArray, TypedArrayConstructor } from "./types";

/**
 * Ring buffer queue\
 * Pushing when length exceeds capacity will overwrite data.\
 * Popping when length is 0 will return undefined.
 */
export default class Queue {
    capacity: number;
    private tail: number;
    private head: number;
    private buffer: TypedArray | Array<number>;
    private indexMask: number;

    constructor(capacity: number, type: TypedArrayConstructor | ArrayConstructor) {
        // enforcing power of 2 so we can make use of bitwise AND instead of modulo to wrap indices
        // although, i'm unsure of performance difference due to js type conversions for bitwise ops
        if (capacity <= 0 || (capacity & -capacity) !== capacity) {
            throw new Error("capacity should be a power of 2");
        }

        this.tail = 0;
        this.head = 0;
        this.capacity = capacity;
        this.indexMask = capacity - 1;
        this.buffer = new type(capacity);
    }

    push(v: number) {
        const i = this.tail & this.indexMask;
        this.buffer[i] = v;
        this.tail++;
    }

    pop(): number | undefined {
        if (this.length() === 0) return undefined;
        const i = this.head & this.indexMask;
        this.head++;
        return this.buffer[i];
    }

    length(): number {
        return this.tail - this.head;
    }

    clear() {
        this.head = 0;
        this.tail = 0;
    }
}
