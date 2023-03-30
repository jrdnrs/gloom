import Queue from "../queue";

test("return data in correct order", () => {
    const q = new Queue(16);

    q.push(1);
    q.push(2);
    expect(q.pop()).toBe(1);
    expect(q.pop()).toBe(2);
})

test("return undefined when empty", () => {
    const q = new Queue(16);

    expect(q.length()).toBe(0);
    expect(q.pop()).toBeUndefined();
    expect(q.length()).toBe(0);
})


test("wrap index correctly", () => {
    const q = new Queue(16);

    for (let i = 0; i < 32; i++) {
        q.push(i);
        expect(q.pop()).toBe(i)
    }
})

test("overwite when exceeding capacity", () => {
    const q = new Queue(16);

    // push 17 values, exceeding capacity of 16
    for (let i = 0; i < 16; i++) {
        q.push(1);
    }
    q.push(2);

    // the last push overwrites the value at front of the queue
    expect(q.pop()).toBe(2)

    // rest should be unaffected
    for (let i = 0; i < 15; i++) {
        expect(q.pop()).toBe(1)
    }

    // wraps again to front
    expect(q.pop()).toBe(2)

    expect(q.length()).toBe(0);
})