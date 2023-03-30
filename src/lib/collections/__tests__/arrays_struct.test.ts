import { clearRow, copyRow, newStructOfArrays, setRow } from "../arrays_struct";
import { Format } from "../types";

test("correct types with flat definition", () => {
    const def = {
        x: Format.f32,
        y: Format.f32,
    };

    const a = newStructOfArrays(def, 10);

    expect(a.x instanceof Float32Array).toBe(true);
    expect(a.y instanceof Float32Array).toBe(true);
});

test("correct types with nested definition", () => {
    const def = {
        x: Format.f32,
        y: Format.f32,
        dir: {
            x: Format.f64,
            y: Format.f64,
        },
    };

    const a = newStructOfArrays(def, 10);

    expect(a.x instanceof Float32Array).toBe(true);
    expect(a.y instanceof Float32Array).toBe(true);
    expect(a.dir instanceof Object).toBe(true);
    expect(a.dir.x instanceof Float64Array).toBe(true);
    expect(a.dir.y instanceof Float64Array).toBe(true);
});

test("copy row", () => {
    const def = {
        x: Format.f32,
        y: Format.f32,
    };

    const a = newStructOfArrays(def, 10);
    const b = newStructOfArrays(def, 10);

    a.x[5] = 17;
    a.y[5] = 22;

    expect(b.x[5]).toBe(0);
    expect(b.y[5]).toBe(0);

    copyRow(a, b, 5);

    expect(b.x[5]).toBe(17);
    expect(b.y[5]).toBe(22);
});

test("set row", () => {
    const def = {
        x: Format.f32,
        y: Format.f32,
    };

    const s = {
        x: 24,
        y: 7,
    };

    const a = newStructOfArrays(def, 10);

    expect(a.x[5]).toBe(0);
    expect(a.y[5]).toBe(0);

    setRow(s, a, 5);

    expect(a.x[5]).toBe(24);
    expect(a.y[5]).toBe(7);
});

test("clear row", () => {
    const def = {
        x: Format.f32,
        y: Format.f32,
    };

    const a = newStructOfArrays(def, 10);

    a.x[5] = 17;
    a.y[5] = 22;

    clearRow(a, 5);

    expect(a.x[5]).toBe(0);
    expect(a.y[5]).toBe(0);
});
