// export function hashInts(values: number[]): number {
//     const a = 31;
//     const p = 2147483647; // 2**a - 1 (mersenne prime)
//     let h = 0;
//     for (const v of values) {
//         h = h * a + v;
//         h = (h & p) + (h >> a);
//         if (h >= p) h -= p;
//     }
//     return h;
// }

export function hashInts(values: number[]): number {
    let h = 5381;
    for (const v of values) {
        h = (h << 5) + h + v;
    }
    return h;
}

export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    const _intersection = new Set<T>();
    for (const item of b) {
        if (a.has(item)) {
            _intersection.add(item);
        }
    }
    return _intersection;
}
