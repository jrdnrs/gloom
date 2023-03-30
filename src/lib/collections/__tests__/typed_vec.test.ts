import {Vec, growTypedArray} from "../typed_vec";

test("general", () => {
    const vec = new Vec(Float64Array, 16);

    expect(vec.length).toBe(0);

    for (let i = 0; i < 16; i++) {
        vec.push(i)
    }

    expect(vec.length).toBe(16);

    for (let i = 0; i < 16; i++) {
        expect(vec.get(i)).toBe(i);
    }

    vec.push(16)

    expect(vec.length).toBe(17);


    expect(vec.pop()).toBe(16);

    expect(vec.length).toBe(16);
});


test("grow TypedArray", () => {
    let array = new Float64Array(100);

    expect(array.length).toBe(100);
    array[0] = 42;
    expect(array[0]).toBe(42);

    array = growTypedArray(array);
    expect(array.length).toBe(200);
    expect(array[0]).toBe(42);
});
