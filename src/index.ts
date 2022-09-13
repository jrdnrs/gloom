import Drawer from "./lib/main";
import { DrawerConfigDefault, DrawerConfig } from "./lib/main";
import { Key } from "./lib/input/keys";
import { clamp, lerp, toRadians, viewTrapezium } from "./lib/maths/util";
import Vec2 from "./lib/maths/vec2";
import Wall from "./wall";
import Segment from "./lib/maths/segment";
import Texture from "./texture";
import Quad from "./lib/maths/quad";

const round = Math.round;

export const WIDTH = 320;
export const HEIGHT = 200;

const NEAR = 50;
const FAR = 10_000;
let VIEW_SPACE = viewTrapezium(NEAR, FAR, toRadians(75));
let HFOV = 1 / Math.tan(toRadians(75 / WIDTH));
let VFOV = 1 / Math.tan(toRadians(75 / WIDTH));

const hFovSlider = document.querySelector("#hfov")!;
const vFovSlider = document.querySelector("#vfov")!;

hFovSlider.addEventListener("input", (ev) => {
    const deg = (ev.target as HTMLInputElement).valueAsNumber;
    HFOV = 1 / Math.tan(toRadians(deg / WIDTH));
    VIEW_SPACE = viewTrapezium(NEAR, FAR, toRadians(deg));
});

vFovSlider.addEventListener("input", (ev) => {
    const deg = (ev.target as HTMLInputElement).valueAsNumber;
    VFOV = 1 / Math.tan(toRadians(deg / WIDTH));
});

const config: DrawerConfig = {
    ...DrawerConfigDefault,
    width: WIDTH,
    height: HEIGHT,
    scale: 3,
    nearestScaling: true,
    clearStyle: "#f0f0f0",
    alpha: false,
};

const DRAW = new Drawer(document.querySelector("main")!, config);
const CTX = DRAW.context;

const BUFFER_CANVAS = document.createElement("canvas");
BUFFER_CANVAS.width = WIDTH;
BUFFER_CANVAS.height = HEIGHT;
const BUFFER_CTX = BUFFER_CANVAS.getContext("2d", {
    alpha: config.alpha,
})!;

const BUFFER = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
const IMAGE = new ImageData(BUFFER, WIDTH, HEIGHT);

const TEXTURES: Texture[] = [];

/**
 * @param rgb must be an integer between 0 and 255
 **/
export type Colour = {
    r: number;
    g: number;
    b: number;
};

const RED = {
    r: 192,
    g: 64,
    b: 64,
};

const GREEN = {
    r: 64,
    g: 192,
    b: 64,
};

const BLUE = {
    r: 64,
    g: 64,
    b: 192,
};

const YELLOW = {
    r: 192,
    g: 192,
    b: 64,
};

class Player {
    pos: Vec2;
    dir: Vec2;
    height: number;
    yaw: number;
    pitch: number;
    size: number;

    constructor(size: number) {
        this.pos = new Vec2(0, 0);
        this.dir = new Vec2(0, -1);
        this.height = 0;
        this.yaw = 0;
        this.pitch = 0;
        this.size = size;
    }

    update(dt: number) {
        this.handleMovement(dt);
    }

    drawStats() {
        CTX.font = "0.5em Arial";
        CTX.fillStyle = "#dea300";
        CTX.fillText(`X:      ${this.pos.x.toFixed(1)}`, 5, 10);
        CTX.fillText(`Y:      ${this.pos.y.toFixed(1)}`, 5, 20);
        CTX.fillText(`Z:      ${this.height.toFixed(1)}`, 5, 30);
        CTX.fillText(`yaw:  ${this.yaw.toFixed(1)}`, 5, 40);
        CTX.fillText(`pitch: ${this.pitch.toFixed(1)}`, 5, 50);
    }

    draw() {
        CTX.fillStyle = "#60ffff";

        // 2d overhead
        // CTX.fillRect(
        //     this.pos.x - this.size / 2,
        //     this.pos.z - this.size / 2,
        //     this.size,
        //     this.size
        // );

        // centre
        CTX.fillRect(
            (WIDTH - this.size) / 2,
            (HEIGHT - this.size) / 2,
            this.size,
            this.size
        );
        DRAW.drawLine(
            "#60ffff",
            new Vec2(WIDTH / 2, HEIGHT / 2),
            new Vec2(WIDTH / 2, HEIGHT / 2 - 10)
        );
    }

    handleMovement(dt: number) {
        const moveSpeed = dt * 0.33;
        const verticalMoveSpeed = dt * 0.1;
        const yawSpeed = dt * 0.1;
        const pitchSpeed = dt * 0.0005;

        // look up/down
        if (DRAW.input.isKeyHeld(Key.BracketLeft)) {
            this.pitch += pitchSpeed;
        } else if (DRAW.input.isKeyHeld(Key.Quote)) {
            this.pitch -= pitchSpeed;
        }

        // look left/right
        if (DRAW.input.isKeyHeld(Key.Semicolon)) {
            this.yaw -= yawSpeed;
        } else if (DRAW.input.isKeyHeld(Key.Backslash)) {
            this.yaw += yawSpeed;
        }

        // unnecessary unless we need to use this for something else?
        // this.yaw %= 360;

        // this is calculated differently, instead of just (cos(a), sin(a)), to make the player face toward
        // positive Y by rotating the result 90 degrees anticlockwise, and the angle is negated to turn
        // clockwise instead of anticlockwise
        this.dir.x = -Math.sin(-toRadians(PLAYER.yaw));
        this.dir.y = Math.cos(-toRadians(PLAYER.yaw));

        // move forward/backward
        if (DRAW.input.isKeyHeld(Key.W)) {
            this.pos.add(this.dir.copy().mulScalar(moveSpeed));
        } else if (DRAW.input.isKeyHeld(Key.S)) {
            this.pos.sub(this.dir.copy().mulScalar(moveSpeed));
        }

        // move left/right
        if (DRAW.input.isKeyHeld(Key.A)) {
            const right = new Vec2(this.dir.y, -this.dir.x).mulScalar(
                moveSpeed
            );
            this.pos.sub(right);
        } else if (DRAW.input.isKeyHeld(Key.D)) {
            const right = new Vec2(this.dir.y, -this.dir.x).mulScalar(
                moveSpeed
            );
            this.pos.add(right);
        }

        // look up/down
        if (DRAW.input.isKeyHeld(Key.Space)) {
            this.height += verticalMoveSpeed;
        } else if (DRAW.input.isKeyHeld(Key.ShiftLeft)) {
            this.height -= verticalMoveSpeed;
        }
    }
}

const PLAYER = new Player(10);

let WALLS: Wall[] = [
    new Wall(new Segment(new Vec2(-250, 300), new Vec2(250, 300)), 250, RED),
    new Wall(
        new Segment(new Vec2(-300, 700), new Vec2(-250, 300)),
        250,
        GREEN,
        0.5
    ),
    new Wall(new Segment(new Vec2(250, 300), new Vec2(-300, 700)), 250, BLUE),
    new Wall(new Segment(new Vec2(1000, 1000), new Vec2(0, 0)), 250, YELLOW),

    new Wall(
        new Segment(new Vec2(6000, 2000), new Vec2(2000, 2000)),
        500,
        BLUE
    ),
    new Wall(
        new Segment(new Vec2(6000, 3000), new Vec2(6000, 2000)),
        500,
        YELLOW
    ),
    new Wall(
        new Segment(new Vec2(2000, 3000), new Vec2(6000, 3000)),
        500,
        BLUE
    ),
    new Wall(
        new Segment(new Vec2(2000, 2000), new Vec2(2000, 3000)),
        500,
        YELLOW
    ),
];

function perspectiveProjection(segment: Segment, yOffset: number): Segment {
    for (let point of segment.iterPoints()) {
        const depth = point.y;

        if (depth <= 0)
            throw `perspective divide failed, '${depth}' depth is invalid`;

        // - `PLAYER.pitch * depth` is used to mimic real pitch using Y-shearing.
        // - Adding `PLAYER.height` here instead of negating it because otherwise up would be negative Z
        //   and that's weird
        point.x = (point.x * HFOV) / depth;
        point.y =
            ((yOffset + PLAYER.height + PLAYER.pitch * depth) * VFOV) / depth;

        // set centre of screen as new origin
        point.x += WIDTH / 2;
        point.y += HEIGHT / 2;
    }

    return segment;
}

// TEMP
let IN_VIEW = 0;

function sortWalls() {
    WALLS.sort((a, b) => b.distance - a.distance);
}

function drawWalls(walls: Wall[]) {
    // sort the walls from farthest to nearest,
    // based on the distance calculation from the previous frame
    sortWalls();

    for (const wall of walls) {
        const segment = new Segment(
            wall.seg.p1.copy().sub(PLAYER.pos).rotate(toRadians(PLAYER.yaw)),
            wall.seg.p2.copy().sub(PLAYER.pos).rotate(toRadians(PLAYER.yaw))
        );

        wall.distance = Math.sqrt(
            ((segment.p1.x + segment.p2.x) / 2) ** 2 +
                ((segment.p1.y + segment.p2.y) / 2) ** 2
        );

        // TODO: we might be able to optimise this with an early bounds test, not sure if worth it 
        if (
            !(
                segment.intersectsPoly(VIEW_SPACE) ||
                segment.p1.inPoly(VIEW_SPACE) ||
                segment.p2.inPoly(VIEW_SPACE)
            )
        ) {
            continue;
        } else {
            IN_VIEW++;
        }

        // important to do this as negative Y values can create artefacts during perspective division
        // TODO: this clipping is causing issues with texture mapping, we might need to store the texture 
        //       coords and clip those too
        if (segment.p1.y < NEAR || segment.p2.y < NEAR) {
            segment.clipNear(NEAR);
        }

        const bottom = perspectiveProjection(segment.copy(), wall.height / 2);
        const top = perspectiveProjection(segment.copy(), -wall.height / 2);

        // with a more sophisticated visibility check we could do this earlier,
        // but for now check if its out of screen space will do
        if (
            new Quad(bottom.p1, bottom.p2, top.p1, top.p2).outOfBounds(
                0,
                WIDTH,
                0,
                HEIGHT
            )
        ) {
            continue;
        }

        // clip the projected coordinates to screen space
        // bottom.clipRect(0, WIDTH - 0.5, 0, HEIGHT - 0.5);
        // top.clipRect(0, WIDTH - 0.5, 0, HEIGHT - 0.5);

        // bottom.round();
        // top.round();

        // TODO: sort out this clipping at some point - it shouldn't be needed now
        // drawSegment(
        //     bottom.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
        //     wall.colour,
        //     wall.alpha
        // );
        // drawSegment(
        //     top.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
        //     wall.colour,
        //     wall.alpha
        // );

        // fillColour(bottom, top, wall.colour, wall.alpha);
        fillTexture(bottom, top, segment.p1.y, segment.p2.y);
    }
}

function fillColour(s1: Segment, s2: Segment, colour: Colour, alpha?: number) {
    const m1 = (s1.p2.y - s1.p1.y) / (s1.p2.x - s1.p1.x);
    const m2 = (s2.p2.y - s2.p1.y) / (s2.p2.x - s2.p1.x);

    const x1 = Math.max(s1.p1.x, 0);
    const x2 = Math.min(s1.p2.x, WIDTH);

    let y1 = s1.p1.y - m1 * s1.p1.x;
    let y2 = s2.p1.y - m2 * s2.p1.x;

    // add starting part of Y from origin, up to first X coord
    y1 += m1 * (x1 - 1);
    y2 += m2 * (x1 - 1);

    for (let x = x1; x < x2; x++) {
        y1 += m1;
        y2 += m2;
        drawVerticalSegment(
            x,
            round(clamp(y1, 0, HEIGHT)),
            round(clamp(y2, 0, HEIGHT)),
            colour,
            alpha
        );
    }
}


const done = false;

// TODO: ...
// - consider alpha
// - currently we cannot modify the start U/V coords. do we want the ability to do this, or is
//   changing the end coords all we want for repeating/clipping in positive direction?
// - consider adding bilinear filtering
function fillTexture(s1: Segment, s2: Segment, d1: number, d2: number) {
    [s1, s2] = s1.p1.y < s2.p1.y ? [s1, s2] : [s2, s1];

    const uStart = 0 / d1;
    const uEnd = 2 / d2;
    const vStart = 0;
    const vEnd = 1;

    d1 = 1 / d1;
    d2 = 1 / d2;

    const uDelta = uEnd - uStart;
    const vDelta = vEnd - vStart;

    const xStart = s1.p1.x;
    const xEnd = s1.p2.x;

    const y1Start = s1.p1.y;
    const y1End = s1.p2.y;
    const y2Start = s2.p1.y;
    const y2End = s2.p2.y;

    // using s1 to get xDelta but they should share the same X coordinates
    const xDelta = xEnd - xStart;

    // gradients
    const y1M = (y1End - y1Start) / xDelta;
    const y2M = (y2End - y2Start) / xDelta;
    const dM = (d2 - d1) / xDelta;
    const uM = uDelta / xDelta;

    // clamp X to screen space, clamping Y will have to be done in the loop as it will vary by line
    // TODO: would prefer to round these rather than ceil, but need to first sort the potential of 
    //       negative U/V in the loops resulting from `(xStartClamp - xStart)` and `(yStartClamp - yStart)`
    const xStartClamp = Math.ceil(clamp(xStart, 0, WIDTH));
    const xEndClamp = Math.ceil(clamp(xEnd, 0, WIDTH));

    // adjust Y and depth to start at correct point if X was clamped
    let yStart = y1Start - y1M * (xStart - xStartClamp);
    let yEnd = y2Start - y2M * (xStart - xStartClamp);
    let d = d1 - dM * (xStart - xStartClamp);

    const w = TEXTURES[0].width;
    const h = TEXTURES[0].height;

    for (
        let x = xStartClamp, u = (xStartClamp - xStart) * uM;
        x < xEndClamp;
        x++, u += uM
    ) {
        const textureX = round((u / d) * w) % w;
        const vM = vDelta / (yEnd - yStart);

        const yStartClamp = Math.ceil(clamp(yStart, 0, HEIGHT));
        const yEndClamp = Math.ceil(clamp(yEnd, 0, HEIGHT));

        for (
            let y = yStartClamp, v = (yStartClamp - yStart) * vM;
            y < yEndClamp;
            y++, v += vM
        ) {
            const textureY = round(v * h) % h;

            // byte offset assumes the bytes are transposed (rotated 90 anticlockwise)
            const byteOffset = (textureX * h + textureY) * 4;

            const col = {
                r: TEXTURES[0].bytes[byteOffset],
                g: TEXTURES[0].bytes[byteOffset + 1],
                b: TEXTURES[0].bytes[byteOffset + 2],
            };

            setPixel(x, y, col);
        }

        yStart += y1M;
        yEnd += y2M;
        d += dM;
    }
}

function setPixel(x: number, y: number, colour: Colour) {
    const offset = (y * WIDTH + x) * 4;
    BUFFER[offset] = colour.r;
    BUFFER[offset + 1] = colour.g;
    BUFFER[offset + 2] = colour.b;
    // BUFFER[offset + 3] = 255;
}

function blendPixel(x: number, y: number, colour: Colour, alpha: number) {
    const offset = (y * WIDTH + x) * 4;
    BUFFER[offset] = alpha * colour.r + (1 - alpha) * BUFFER[offset];
    BUFFER[offset + 1] = alpha * colour.g + (1 - alpha) * BUFFER[offset + 1];
    BUFFER[offset + 2] = alpha * colour.b + (1 - alpha) * BUFFER[offset + 2];
}

function drawSegment(segment: Segment, colour: Colour, alpha?: number) {
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

function drawVerticalSegment(
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

function drawHorizontalSegment(
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

function drawFps() {
    CTX.font = "0.5em Arial";
    CTX.fillStyle = "#dea300";
    CTX.fillText(DRAW.fps.toFixed(), WIDTH - 20, 10);
}

function drawFrametimeGraph() {
    CTX.font = "0.3em Arial";
    CTX.fillStyle = "#dea300";
    CTX.fillText("0", WIDTH - 100, 12);
    CTX.fillText("10", WIDTH - 100, 22);
    CTX.fillText("20", WIDTH - 100, 32);
    CTX.fillText("30", WIDTH - 100, 42);
    CTX.fillText("40", WIDTH - 100, 52);

    let FTpoints = [];

    // show previous 60
    for (let i = 0; i < 60; i++) {
        FTpoints.push(
            new Vec2(
                WIDTH - 90 + i,
                Math.min(DRAW.frametimes[(DRAW.frames - i) % 128], 40) + 10
            )
        );
    }

    DRAW.drawPolyline("#dea300", FTpoints);
}

function draw(dt: number) {
    PLAYER.update(dt);

    // TODO: firefox seems to interpret the `getContext().options.alpha` property differently?
    //       even when it is disabled, it still applies the alpha channel when rendering, so filling with
    //       32 makes everything look dark and faded on firefox but is fine on chrome
    BUFFER.fill(32);
    drawWalls(WALLS);

    BUFFER_CTX.putImageData(IMAGE, 0, 0);
    CTX.drawImage(BUFFER_CANVAS, 0, 0);
    PLAYER.drawStats();

    CTX.fillText(IN_VIEW.toString(), 5, 100);
    IN_VIEW = 0;

    drawFps();

    // FIX: FPS limiting is clearly not perfect
    drawFrametimeGraph();
}

async function init() {
    await Texture.loadTexture("/res/test.png", true).then((t) => {
        TEXTURES.push(t);
    });
}

init().then(() => DRAW.run(draw));
