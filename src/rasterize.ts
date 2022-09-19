import { Attributes, FAR, FRAMEBUFFER, HEIGHT, WIDTH } from "./index";
import { clamp, lerp } from "./lib/maths/util";
import { Colour } from "./surface";
import type Segment from "./lib/maths/segment";
import type Triangle from "./lib/maths/triangle";
import type Texture from "./texture";
const round = Math.round;

export function setPixel(x: number, y: number, colour: Colour) {
    const offset = (y * WIDTH + x) * 4;
    FRAMEBUFFER[offset] = colour.r;
    FRAMEBUFFER[offset + 1] = colour.g;
    FRAMEBUFFER[offset + 2] = colour.b;
    // FRAMEBUFFER[offset + 3] = 255;
}

export function blendPixel(
    x: number,
    y: number,
    colour: Colour,
    alpha: number
) {
    const offset = (y * WIDTH + x) * 4;
    FRAMEBUFFER[offset] = alpha * colour.r + (1 - alpha) * FRAMEBUFFER[offset];
    FRAMEBUFFER[offset + 1] =
        alpha * colour.g + (1 - alpha) * FRAMEBUFFER[offset + 1];
    FRAMEBUFFER[offset + 2] =
        alpha * colour.b + (1 - alpha) * FRAMEBUFFER[offset + 2];
}

export function drawSegment(segment: Segment, colour: Colour, alpha?: number) {
    const [start, end] =
        segment.p2.x > segment.p1.x
            ? [segment.p1, segment.p2]
            : [segment.p2, segment.p1];

    const xDelta = end.x - start.x;

    if (alpha === undefined) {
        for (let i = 0; i < xDelta; i++) {
            setPixel(
                i + start.x,
                round(lerp(start.y, end.y, i / xDelta)),
                colour
            );
        }
    } else {
        for (let i = 0; i < xDelta; i++) {
            blendPixel(
                i + start.x,
                round(lerp(start.y, end.y, i / xDelta)),
                colour,
                alpha
            );
        }
    }
}

export function drawVerticalSegment(
    x: number,
    y1: number,
    y2: number,
    colour: Colour,
    alpha?: number
) {
    [y1, y2] = y2 > y1 ? [y1, y2] : [y2, y1];

    if (alpha === undefined) {
        for (let y = y1; y <= y2; y++) {
            setPixel(x, y, colour);
        }
    } else {
        for (let y = y1; y <= y2; y++) {
            blendPixel(x, y, colour, alpha);
        }
    }
}

export function drawHorizontalSegment(
    y: number,
    x1: number,
    x2: number,
    colour: Colour,
    alpha?: number
) {
    [x1, x2] = x2 > x1 ? [x1, x2] : [x2, x1];

    if (alpha === undefined) {
        for (let x = x1; x <= x2; x++) {
            setPixel(x, y, colour);
        }
    } else {
        for (let x = x1; x <= x2; x++) {
            blendPixel(x, y, colour, alpha);
        }
    }
}

export function fillTriangle(
    triangle: Triangle,
    a1: Attributes,
    a2: Attributes,
    a3: Attributes,
    colour: Colour,
    alpha?: number
) {
    let [p1, p2, p3] = triangle.iterPoints();
    // line 1 = p1 to p2
    // line 2 = p2 to p3
    // line 3 = p1 to p3 (longest, from top to bottom in screen space, increasing in Y)
    [p1, p2, a1, a2] = p2.y < p1.y ? [p2, p1, a2, a1] : [p1, p2, a1, a2];
    [p1, p3, a1, a3] = p3.y < p1.y ? [p3, p1, a3, a1] : [p1, p3, a1, a3];
    [p2, p3, a2, a3] = p3.y < p2.y ? [p3, p2, a3, a2] : [p2, p3, a2, a3];

    const dInverseStart = 1 / a1.d;
    const dInverseEnd = 1 / a3.d;

    const l1xDelta = p2.x - p1.x;
    const l2xDelta = p3.x - p2.x;
    const l3xDelta = p3.x - p1.x;
    const l1yDelta = p2.y - p1.y;
    const l2yDelta = p3.y - p2.y;
    const l3yDelta = p3.y - p1.y;
    const dInverseDelta = dInverseEnd - dInverseStart;

    // gradients
    const l1xM = l1xDelta / l1yDelta;
    const l2xM = l2xDelta / l2yDelta;
    const l3xM = l3xDelta / l3yDelta;
    const dInverseM = dInverseDelta / l3yDelta;

    const y1Clamp = clamp(Math.ceil(p1.y), 0, HEIGHT);
    const y2Clamp = clamp(Math.ceil(p2.y), 0, HEIGHT);
    const y3Clamp = clamp(Math.ceil(p3.y), 0, HEIGHT);

    // start at the same first X point but diverge along the separate lines at respective gradients
    let xStart = p1.x + l1xM * (y1Clamp - p1.y);
    let xEnd = p1.x + l3xM * (y1Clamp - p1.y);
    let dInverse = dInverseStart + dInverseM * (y1Clamp - p1.y);

    for (let y = y1Clamp; y < y2Clamp; y++) {
        if (!((xStart >= WIDTH && xEnd >= WIDTH) || (xStart < 0 && xEnd < 0))) {
            // basic diminishing lighting
            const relativeDepth = 1 / (dInverse * FAR);
            const light = 1;

            drawHorizontalSegment(
                y,
                round(clamp(xStart, 0, WIDTH - 1)),
                round(clamp(xEnd, 0, WIDTH - 1)),
                {
                    r: colour.r * light,
                    g: colour.g * light,
                    b: colour.b * light,
                },
                alpha
            );
        }

        xStart += l1xM;
        xEnd += l3xM;
        dInverse += dInverseM;
    }

    // due to rounding, it's a good idea to explicitly set sX to the middle point
    xStart = p2.x + l2xM * (y2Clamp - p2.y);

    for (let y = y2Clamp; y < y3Clamp; y++) {
        if (!((xStart >= WIDTH && xEnd >= WIDTH) || (xStart < 0 && xEnd < 0))) {
            // basic diminishing lighting
            const relativeDepth = 1 / (dInverse * FAR);
            const light = 1;

            drawHorizontalSegment(
                y,
                round(clamp(xStart, 0, WIDTH - 1)),
                round(clamp(xEnd, 0, WIDTH - 1)),
                {
                    r: colour.r * light,
                    g: colour.g * light,
                    b: colour.b * light,
                },
                alpha
            );
        }

        xStart += l2xM;
        xEnd += l3xM;
        dInverse += dInverseM;
    }
}

// TODO: add diminishing lighting / update to use Attributes
export function fillWall(
    s1: Segment,
    s2: Segment,
    colour: Colour,
    alpha?: number
) {
    [s1, s2] = s1.p1.y < s2.p1.y ? [s1, s2] : [s2, s1];

    const xStart = s1.p1.x;
    const xEnd = s1.p2.x;
    const xDelta = xEnd - xStart;
    const m1 = (s1.p2.y - s1.p1.y) / xDelta;
    const m2 = (s2.p2.y - s2.p1.y) / xDelta;

    const xStartClamp = clamp(Math.ceil(xStart), 0, WIDTH);
    const xEndClamp = clamp(Math.ceil(xEnd), 0, WIDTH);

    let yStart = s1.p1.y + m1 * (xStartClamp - xStart);
    let yEnd = s2.p1.y + m2 * (xStartClamp - xStart);

    for (let x = xStartClamp; x < xEndClamp; x++) {
        if (
            !((yStart >= HEIGHT && yEnd >= HEIGHT) || (yStart < 0 && yEnd < 0))
        ) {
            drawVerticalSegment(
                x,
                round(clamp(yStart, 0, HEIGHT - 1)),
                round(clamp(yEnd, 0, HEIGHT - 1)),
                colour,
                alpha
            );
        }

        yStart += m1;
        yEnd += m2;
    }
}

export function textureTriangle(
    triangle: Triangle,
    a1: Attributes,
    a2: Attributes,
    a3: Attributes,
    texture: Texture,
    alpha?: number
) {
    let [p1, p2, p3] = triangle.iterPoints();
    // line 1 = p1 to p2
    // line 2 = p2 to p3
    // line 3 = p1 to p3 (from top to bottom in screen space, increasing in Y)
    [p1, p2, a1, a2] = p2.y < p1.y ? [p2, p1, a2, a1] : [p1, p2, a1, a2];
    [p1, p3, a1, a3] = p3.y < p1.y ? [p3, p1, a3, a1] : [p1, p3, a1, a3];
    [p2, p3, a2, a3] = p3.y < p2.y ? [p3, p2, a3, a2] : [p2, p3, a2, a3];

    const x1 = p1.x;
    const x2 = p2.x;
    const x3 = p3.x;
    const y1 = p1.y;
    const y2 = p2.y;
    const y3 = p3.y;
    const u1 = a1.u / a1.d;
    const u2 = a2.u / a2.d;
    const u3 = a3.u / a3.d;
    const v1 = a1.v / a1.d;
    const v2 = a2.v / a2.d;
    const v3 = a3.v / a3.d;
    const d1Inverse = 1 / a1.d;
    const d3Inverse = 1 / a3.d;

    // deltas
    const l1xDelta = x2 - x1;
    const l2xDelta = x3 - x2;
    const l3xDelta = x3 - x1;

    const l1yDelta = y2 - y1;
    const l2yDelta = y3 - y2;
    const l3yDelta = y3 - y1;

    const l1uDelta = u2 - u1;
    const l2uDelta = u3 - u2;
    const l3uDelta = u3 - u1;

    const l1vDelta = v2 - v1;
    const l2vDelta = v3 - v2;
    const l3vDelta = v3 - v1;

    const dInverseDelta = d3Inverse - d1Inverse;

    // gradients
    const l1xM = l1xDelta / l1yDelta;
    const l2xM = l2xDelta / l2yDelta;
    const l3xM = l3xDelta / l3yDelta;

    const l1uM = l1uDelta / l1yDelta;
    const l2uM = l2uDelta / l2yDelta;
    const l3uM = l3uDelta / l3yDelta;

    const l1vM = l1vDelta / l1yDelta;
    const l2vM = l2vDelta / l2yDelta;
    const l3vM = l3vDelta / l3yDelta;

    const dInverseM = dInverseDelta / l3yDelta;

    let leftxM: number;
    let leftuM: number;
    let leftvM: number;
    let rightxM: number;
    let rightuM: number;
    let rightvM: number;

    if (l3xM < l1xM) {
        // l3 (top to bottom) on the left
        leftxM = l3xM;
        leftuM = l3uM;
        leftvM = l3vM;
        rightxM = l1xM;
        rightuM = l1uM;
        rightvM = l1vM;
    } else {
        // l3 (top to bottom) on the right
        leftxM = l1xM;
        leftuM = l1uM;
        leftvM = l1vM;
        rightxM = l3xM;
        rightuM = l3uM;
        rightvM = l3vM;
    }

    // clamp Y to screen space
    const y1Clamp = clamp(Math.ceil(y1), 0, HEIGHT);
    const y2Clamp = clamp(Math.ceil(y2), 0, HEIGHT);
    const y3Clamp = clamp(Math.ceil(y3), 0, HEIGHT);

    //temp
    const w = texture.width;
    const h = texture.height;

    // start at the same first X point but diverge along the separate lines at respective gradients
    let xStart = x1 + leftxM * (y1Clamp - y1);
    let xEnd = x1 + rightxM * (y1Clamp - y1);
    let uStart = u1 + leftuM * (y1Clamp - y1);
    let uEnd = u1 + rightuM * (y1Clamp - y1);
    let vStart = v1 + leftvM * (y1Clamp - y1);
    let vEnd = v1 + rightvM * (y1Clamp - y1);
    let dInverse = d1Inverse + dInverseM * (y1Clamp - y1);

    if (alpha === undefined) {
        for (let y = y1Clamp; y < y2Clamp; y++) {
            const d = 1 / dInverse;
            const xStartClamp = clamp(Math.ceil(xStart), 0, WIDTH);
            const xEndClamp = clamp(Math.ceil(xEnd), 0, WIDTH);

            // basic diminishing lighting
            const relativeDepth = d / FAR;
            const light = 1;

            const uM = (uEnd - uStart) / (xEnd - xStart);
            const vM = (vEnd - vStart) / (xEnd - xStart);
            let u = uStart + uM * (xStartClamp - xStart);
            let v = vStart + vM * (xStartClamp - xStart);

            for (let x = xStartClamp; x < xEndClamp; x++) {
                const textureX = round(u * d * w) % w;
                const textureY = round(v * d * h) % h;

                // readOffset assumes the bytes are normal orientation (not transposed like walls)
                const readOffset = (textureY * w + textureX) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline setPixel
                FRAMEBUFFER[writeOffset] = texture.bytes[readOffset] * light;
                FRAMEBUFFER[writeOffset + 1] =
                    texture.bytes[readOffset + 1] * light;
                FRAMEBUFFER[writeOffset + 2] =
                    texture.bytes[readOffset + 2] * light;

                u += uM;
                v += vM;
            }

            xStart += leftxM;
            xEnd += rightxM;
            uStart += leftuM;
            uEnd += rightuM;
            vStart += leftvM;
            vEnd += rightvM;
            dInverse += dInverseM;
        }
    } else {
        const omAlpha = 1 - alpha;

        for (let y = y1Clamp; y < y2Clamp; y++) {
            const d = 1 / dInverse;
            const xStartClamp = clamp(Math.ceil(xStart), 0, WIDTH);
            const xEndClamp = clamp(Math.ceil(xEnd), 0, WIDTH);

            // basic diminishing lighting
            const relativeDepth = d / FAR;
            const light = 1;

            const uM = (uEnd - uStart) / (xEnd - xStart);
            const vM = (vEnd - vStart) / (xEnd - xStart);
            let u = uStart + uM * (xStartClamp - xStart);
            let v = vStart + vM * (xStartClamp - xStart);

            for (let x = xStartClamp; x < xEndClamp; x++) {
                const textureX = round(u * d * w) % w;
                const textureY = round(v * d * h) % h;

                // readOffset assumes the bytes are normal orientation (not transposed like walls)
                const readOffset = (textureY * w + textureX) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline blendPixel
                FRAMEBUFFER[writeOffset] =
                    alpha * texture.bytes[readOffset] * light +
                    omAlpha * FRAMEBUFFER[writeOffset];
                FRAMEBUFFER[writeOffset + 1] =
                    alpha * texture.bytes[readOffset + 1] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 1];
                FRAMEBUFFER[writeOffset + 2] =
                    alpha * texture.bytes[readOffset + 2] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 2];

                u += uM;
                v += vM;
            }

            xStart += leftxM;
            xEnd += rightxM;
            uStart += leftuM;
            uEnd += rightuM;
            vStart += leftvM;
            vEnd += rightvM;
            dInverse += dInverseM;
        }
    }

    // due to rounding, it's a good idea to explicitly set starting points, at the middle point
    if (l3xM < l1xM) {
        // l3 (top to bottom) on the left
        rightxM = l2xM;
        rightuM = l2uM;
        rightvM = l2vM;

        xEnd = x2 + rightxM * (y2Clamp - y2);
        uEnd = u2 + rightuM * (y2Clamp - y2);
        vEnd = v2 + rightvM * (y2Clamp - y2);
    } else {
        // l3 (top to bottom) on the right
        leftxM = l2xM;
        leftuM = l2uM;
        leftvM = l2vM;

        xStart = x2 + leftxM * (y2Clamp - y2);
        uStart = u2 + leftuM * (y2Clamp - y2);
        vStart = v2 + leftvM * (y2Clamp - y2);
    }

    if (alpha === undefined) {
        for (let y = y2Clamp; y < y3Clamp; y++) {
            const d = 1 / dInverse;
            const xStartClamp = clamp(Math.ceil(xStart), 0, WIDTH);
            const xEndClamp = clamp(Math.ceil(xEnd), 0, WIDTH);

            // basic diminishing lighting
            const relativeDepth = d / FAR;
            const light = 1;

            const uM = (uEnd - uStart) / (xEnd - xStart);
            const vM = (vEnd - vStart) / (xEnd - xStart);
            let u = uStart + uM * (xStartClamp - xStart);
            let v = vStart + vM * (xStartClamp - xStart);

            for (let x = xStartClamp; x < xEndClamp; x++) {
                const textureX = round(u * d * w) % w;
                const textureY = round(v * d * h) % h;

                // readOffset assumes the bytes are normal orientation (not transposed like walls)
                const readOffset = (textureY * w + textureX) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline setPixel
                FRAMEBUFFER[writeOffset] = texture.bytes[readOffset] * light;
                FRAMEBUFFER[writeOffset + 1] =
                    texture.bytes[readOffset + 1] * light;
                FRAMEBUFFER[writeOffset + 2] =
                    texture.bytes[readOffset + 2] * light;

                u += uM;
                v += vM;
            }

            xStart += leftxM;
            xEnd += rightxM;
            uStart += leftuM;
            uEnd += rightuM;
            vStart += leftvM;
            vEnd += rightvM;
            dInverse += dInverseM;
        }
    } else {
        const omAlpha = 1 - alpha;

        for (let y = y2Clamp; y < y3Clamp; y++) {
            const d = 1 / dInverse;
            const xStartClamp = clamp(Math.ceil(xStart), 0, WIDTH);
            const xEndClamp = clamp(Math.ceil(xEnd), 0, WIDTH);

            // basic diminishing lighting
            const relativeDepth = d / FAR;
            const light = 1;

            const uM = (uEnd - uStart) / (xEnd - xStart);
            const vM = (vEnd - vStart) / (xEnd - xStart);
            let u = uStart + uM * (xStartClamp - xStart);
            let v = vStart + vM * (xStartClamp - xStart);

            for (let x = xStartClamp; x < xEndClamp; x++) {
                const textureX = round(u * d * w) % w;
                const textureY = round(v * d * h) % h;

                // readOffset assumes the bytes are normal orientation (not transposed like walls)
                const readOffset = (textureY * w + textureX) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline blendPixel
                FRAMEBUFFER[writeOffset] =
                    alpha * texture.bytes[readOffset] * light +
                    omAlpha * FRAMEBUFFER[writeOffset];
                FRAMEBUFFER[writeOffset + 1] =
                    alpha * texture.bytes[readOffset + 1] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 1];
                FRAMEBUFFER[writeOffset + 2] =
                    alpha * texture.bytes[readOffset + 2] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 2];

                u += uM;
                v += vM;
            }

            xStart += leftxM;
            xEnd += rightxM;
            uStart += leftuM;
            uEnd += rightuM;
            vStart += leftvM;
            vEnd += rightvM;
            dInverse += dInverseM;
        }
    }
}

// TODO: consider adding bilinear filtering
export function textureWall(
    s1: Segment,
    s2: Segment,
    a1: Attributes,
    a2: Attributes,
    texture: Texture,
    alpha?: number
) {
    [s1, s2] = s1.p1.y < s2.p1.y ? [s1, s2] : [s2, s1];

    const x1 = s1.p1.x;
    const x2 = s1.p2.x;
    const y1 = s1.p1.y;
    const y2 = s1.p2.y;
    const y3 = s2.p1.y;
    const y4 = s2.p2.y;
    const u1 = a1.u / a1.d;
    const u2 = a2.u / a2.d;
    const v1 = a1.v;
    const v2 = a2.v;
    const dInverse1 = 1 / a1.d;
    const dInverse2 = 1 / a2.d;

    // using s1 to get xDelta but they should share the same X coordinates
    const xDelta = x2 - x1;
    const l1yDelta = y2 - y1;
    const l2yDelta = y4 - y3;
    const uDelta = u2 - u1;
    const vDelta = v2 - v1;
    const dInverseDelta = dInverse2 - dInverse1;

    // gradients
    const l1yM = l1yDelta / xDelta;
    const l2yM = l2yDelta / xDelta;
    const uM = uDelta / xDelta;
    const dInverseM = dInverseDelta / xDelta;

    // clamp X to screen space, clamping Y will have to be done in the loop as it will vary by line
    // TODO: would prefer to round these rather than ceil, but need to first sort the potential of
    //       negative U/V in the loops resulting from `(xStartClamp - xStart)` and `(yStartClamp - yStart)`
    const xStartClamp = clamp(Math.ceil(x1), 0, WIDTH);
    const xEndClamp = clamp(Math.ceil(x2), 0, WIDTH);

    // adjust these to start at correct point in case X was clamped
    let yStart = y1 + l1yM * (xStartClamp - x1);
    let yEnd = y3 + l2yM * (xStartClamp - x1);
    let u = u1 + uM * (xStartClamp - x1);
    let dInverse = dInverse1 + dInverseM * (xStartClamp - x1);

    const w = texture.width;
    const h = texture.height;

    if (alpha === undefined) {
        for (let x = xStartClamp; x < xEndClamp; x++) {
            const textureX = round((u / dInverse) * h) % h;
            const yStartClamp = clamp(Math.ceil(yStart), 0, HEIGHT);
            const yEndClamp = clamp(Math.ceil(yEnd), 0, HEIGHT);
            const vM = vDelta / (yEnd - yStart);
            let v = v1 + vM * (yStartClamp - yStart);

            // basic diminishing lighting
            const relativeDepth = 1 / (dInverse * FAR);
            const light = 1;

            for (let y = yStartClamp; y < yEndClamp; y++) {
                const textureY = round(v * w) % w;

                // readOffset offset assumes the bytes are transposed (rotated 90 anticlockwise)
                const readOffset = (textureX * w + textureY) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline setPixel
                FRAMEBUFFER[writeOffset] = texture.bytes[readOffset] * light;
                FRAMEBUFFER[writeOffset + 1] =
                    texture.bytes[readOffset + 1] * light;
                FRAMEBUFFER[writeOffset + 2] =
                    texture.bytes[readOffset + 2] * light;

                v += vM;
            }

            yStart += l1yM;
            yEnd += l2yM;
            u += uM;
            dInverse += dInverseM;
        }
    } else {
        const omAlpha = 1 - alpha;

        for (let x = xStartClamp; x < xEndClamp; x++) {
            const textureX = round((u / dInverse) * h) % h;
            const yStartClamp = clamp(Math.ceil(yStart), 0, HEIGHT);
            const yEndClamp = clamp(Math.ceil(yEnd), 0, HEIGHT);
            const vM = vDelta / (yEnd - yStart);
            let v = v1 + vM * (yStartClamp - yStart);

            // basic diminishing lighting
            const relativeDepth = 1 / (dInverse * FAR);
            const light = 1;

            for (let y = yStartClamp; y < yEndClamp; y++) {
                const textureY = round(v * w) % w;

                // readOffset assumes the bytes are transposed (rotated 90 anticlockwise)
                const readOffset = (textureX * w + textureY) * 4;
                const writeOffset = (y * WIDTH + x) * 4;

                // inline blendPixel
                FRAMEBUFFER[writeOffset] =
                    alpha * texture.bytes[readOffset] * light +
                    omAlpha * FRAMEBUFFER[writeOffset];
                FRAMEBUFFER[writeOffset + 1] =
                    alpha * texture.bytes[readOffset + 1] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 1];
                FRAMEBUFFER[writeOffset + 2] =
                    alpha * texture.bytes[readOffset + 2] * light +
                    omAlpha * FRAMEBUFFER[writeOffset + 2];

                v += vM;
            }

            yStart += l1yM;
            yEnd += l2yM;
            u += uM;
            dInverse += dInverseM;
        }
    }
}
