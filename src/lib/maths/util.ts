import Quad from "./quad";
import Vec2 from "./vec2";

export function roundDown(x: number, places: number): number {
    const p = Math.pow(10, places);
    return Math.floor(x * p) / p;
}

export function round(x: number, places: number): number {
    const p = Math.pow(10, places);
    return Math.round(x * p) / p;
}

export function roundUp(x: number, places: number): number {
    const p = Math.pow(10, places);
    return Math.ceil(x * p) / p;
}

export function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(min, x), max);
}

export function toRadians(degrees: number): number {
    return Math.PI * (degrees / 180);
}

export function toDegrees(radians: number): number {
    return 180 * (radians / Math.PI);
}

export function average(values: number[]): number {
    return (
        values.reduce((prev, curr) => {
            return (curr += prev);
        }) / values.length
    );
}

export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

export function fullLerp(
    y1: number,
    y2: number,
    x1: number,
    x2: number,
    xStart: number,
    xStop: number
): number[] {
    const yDelta = y2 - y1;
    const xDelta = x2 - x1;
    const m = yDelta / xDelta;
    let y = y1 + (xStart - x1) * m;
    let v = [y];
    for (let x = xStart; x < xStop; x++) {
        v.push((y += m));
    }
    return v;
}

export function* fullLerpLazy(
    y1: number,
    y2: number,
    x1: number,
    x2: number,
    xStart: number,
    xStop: number
): Generator<number> {
    const yDelta = y2 - y1;
    const xDelta = x2 - x1;
    const m = yDelta / xDelta;
    let y = y1 + (xStart - x1) * m;
    yield y;
    for (let x = xStart; x < xStop; x++) {
        yield (y += m);
    }
}

export function viewTrapezium(near: number, far: number, fovRad: number): Quad {
    const tan = Math.tan(fovRad / 2);
    const oF = far * tan;
    const oN = near * tan;

    return new Quad(
        new Vec2(-oN, near),
        new Vec2(-oF, far),
        new Vec2(oF, far),
        new Vec2(oN, near)
    );
}

// https://youtu.be/HYAgJN3x4GA
// export function pointInTriangle(triangle: Vec2[], point: Vec2): boolean {
//     const Ax = triangle[0].x;
//     const Ay = triangle[0].y;
//     const Bx = triangle[1].x;
//     const By = triangle[1].y;
//     const Cx = triangle[2].x;
//     const Cy = triangle[2].y;

//     const Px = point.x;
//     const Py = point.y;

//     const w1 =
//         (Ax * (Cy - Ay) + (Py - Ay) * (Cx - Ax) - Px * (Cy - Ay)) /
//         ((By - Ay) * (Cx - Ax) - (Bx - Ax) * (Cy - Ay));
//     const w2 = (Py - Ay - w1 * (By - Ay)) / (Cy - Ay);

//     return w1 >= 0 && w2 >= 0 && w1 + w2 <= 1;
// }

// export function viewTriangle(far: number, fovRad: number) {
//     const o = far * Math.tan(fovRad / 2);

//     return [new Vec2(0, 0), new Vec2(-o, far), new Vec2(o, far)];
// }
