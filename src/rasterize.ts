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
