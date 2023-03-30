export default class SparseSet<T> {
    private items: T[];
    private packed: number[];
    private sparse: number[];

    constructor() {
        this.items = [];
        this.packed = [];
        this.sparse = [];
    }

    get(key: number): T | undefined {
        return this.items[this.sparse[key]];
    }

    set(key: number, value: T) {
        const index = this.sparse[key];
        if (index === undefined) {
            this.sparse[key] = this.items.length;
            this.packed.push(key);
            this.items.push(value);
        } else {
            this.items[index] = value;
        }
    }

    delete(key: number) {
        const index = this.sparse[key];

        // swap remove
        this.items[index] = this.items.pop()!;
        this.packed[index] = this.packed.pop()!;

        // update the index for the key that corresponded to the last index buffer item
        this.sparse[this.packed[this.items.length]] = index;

        this.sparse[key] = undefined!;
    }

    has(key: number): boolean {
        return this.sparse[key] !== undefined;
    }

    keys(): number[] {
        return this.packed;
    }

    values(): T[] {
        return this.items;
    }

    *entries(): Generator<[number, T]> {
        for (let i = 0; i < this.items.length; i++) {
            yield [this.packed[i], this.items[i]];
        }
    }

    length(): number {
        return this.items.length;
    }

    clear() {
        this.items.length = 0;
        this.packed.length = 0;
        this.sparse.length = 0;
    }
}
