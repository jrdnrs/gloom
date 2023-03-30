import SparseSet from "../sparse_set";

test("return correct data", () => {
    const s = new SparseSet<number>();

    s.set(17, 1);
    s.set(23, 2);
    s.set(31, 3);

    expect(s.get(17)).toBe(1);
    expect(s.get(23)).toBe(2);
    expect(s.get(31)).toBe(3);

    expect(s.length()).toBe(3);
});

test("deletion", () => {
    const s = new SparseSet<number>();

    s.set(17, 1);
    s.set(23, 2);
    s.set(31, 3);

    expect(s.length()).toBe(3);

    s.delete(23);

    expect(s.length()).toBe(2);
    expect(s.get(23)).toBeUndefined();
});

test("set new value on existing key", () => {
    const s = new SparseSet<number>();

    s.set(17, 1);
    s.set(23, 2);
    s.set(31, 3);

    expect(s.get(23)).toBe(2);
    s.set(23, 4);
    expect(s.get(23)).toBe(4);

    expect(s.length()).toBe(3);
});

test("iter values/keys", () => {
    const s = new SparseSet<number>();

    s.set(17, 1);
    s.set(23, 2);
    s.set(31, 3);
    s.set(33, 4);

    const v = s.values();
    expect(v.length).toBe(4);
    expect(v[0]).toBe(1);
    expect(v[1]).toBe(2);
    expect(v[2]).toBe(3);
    expect(v[3]).toBe(4);

    const k = s.keys();
    expect(k.length).toBe(4);
    expect(k[0]).toBe(17);
    expect(k[1]).toBe(23);
    expect(k[2]).toBe(31);
    expect(k[3]).toBe(33);
});

test("speed test", () => {
    type data = {
        name: string;
        x: number;
        y: number;
    };

    const s = new SparseSet<data>();
    const m = new Map<number, data>();
    const n = 1000;
    let start: number;

    const keys = new Array(n);

    for (let i = 0; i < n; i++) {
        keys[i] = Math.trunc(Math.random() * n);
    }

    // insertion
    start = performance.now();
    for (let i = 0; i < n; i++) {
        s.set(keys[i], { name: "rand", x: i, y: i });
    }
    console.log("sparse set -", n, "insertions -", performance.now() - start, "ms");

    start = performance.now();
    for (let i = 0; i < n; i++) {
        m.set(keys[i], { name: "rand", x: i, y: i });
    }
    console.log("map -", n, "insertions -", performance.now() - start, "ms");

    // get
    start = performance.now();
    for (let i = 0; i < n; i++) {
        let a = s.get(keys[i]);
        a!.x *= 2;
    }
    console.log("sparse set -", n, "gets -", performance.now() - start, "ms");

    start = performance.now();
    for (let i = 0; i < n; i++) {
        let a = m.get(keys[i]);
        a!.x *= 2;
    }
    console.log("map -", n, "gets -", performance.now() - start, "ms");

    // iter
    start = performance.now();
    for (const k of s.keys()) {
        let a = k * 2;
    }
    console.log("sparse set -", n, "iter -", performance.now() - start, "ms");

    start = performance.now();
    for (const k of m.keys()) {
        let a = k * 2;
    }
    console.log("map -", n, "iter -", performance.now() - start, "ms");
});
