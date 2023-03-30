/** bit group size */
const BITS = 32;
/** base log 2 of `BITS` */
const BIT = 5;
/** shift by this to perform integer multiplication or division of id to get grouping index */
const SHIFT0 = BIT * 1;
const SHIFT1 = BIT * 2;

class BitSet {
    layer2: Uint32Array;
    layer1: Uint32Array;
    layer0: Uint32Array;

    constructor() {
        this.layer2 = new Uint32Array(BITS ** 0);
        this.layer1 = new Uint32Array(BITS ** 1);
        this.layer0 = new Uint32Array(BITS ** 2);
    }

    private mask(bitIndex: number): number {
        return 1 << bitIndex;
    }

    private bitIndex(id: number, groupIndex: number, layerShift: number): number {
        return id - (groupIndex << layerShift);
    }

    private groupIndex(id: number, layerShift: number): number {
        return id >> layerShift;
    }

    has(id: number): boolean {
        const groupIndex = id >> SHIFT0;
        const mask = 1 << (id - (groupIndex << SHIFT0));
        return (this.layer0[groupIndex] & mask) !== 0;
    }

    set(id: number) {
        const groupIndex = id >> SHIFT0;
        const mask = 1 << (id - (groupIndex << SHIFT0));

        const bubbleUp = this.layer0[groupIndex] === 0;
        this.layer0[groupIndex] |= mask;

        if (bubbleUp) {
            
        }
    }

    clear() {
        // drop and realloc, or fill?
        this.layer2.fill(0);
        this.layer1.fill(0);
        this.layer0.fill(0);
    }
}
