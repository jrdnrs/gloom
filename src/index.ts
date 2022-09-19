import Drawer from "./lib/main";
import { DrawerConfigDefault, DrawerConfig } from "./lib/main";
import { Key } from "./lib/input/keys";
import { toRadians, viewTrapezium } from "./lib/maths/util";
import Vec2 from "./lib/maths/vec2";
import { Wall, Floor, YELLOW, BLUE, GREEN, MAGENTA, RED } from "./surface";
import Segment from "./lib/maths/segment";
import Texture from "./texture";
import Camera from "./camera";
import { drawFloors, drawWalls } from "./render";

export const WIDTH = 320;
export const HEIGHT = 200;

export const NEAR = 10;
export const FAR = 10_000;
export let VIEW_SPACE = viewTrapezium(NEAR, FAR, toRadians(75));
export let HFOV = 1 / Math.tan(toRadians(75 / WIDTH));
export let VFOV = 1 / Math.tan(toRadians(75 / WIDTH));

// DEBUG
/////////////////////////////////////////////////////////////////
export let WIREFRAME = true;
export let OVERLAY = true;
export let MOUSE_PITCH_LOCK = false;

const hFovSlider = document.querySelector("#hfov")!;
const vFovSlider = document.querySelector("#vfov")!;
const lockPitch = document.querySelector("#lockMousePitch")!;

lockPitch.addEventListener("input", (ev) => {
    MOUSE_PITCH_LOCK = (ev.target as HTMLInputElement).checked;
});

hFovSlider.addEventListener("input", (ev) => {
    const deg = (ev.target as HTMLInputElement).valueAsNumber;
    HFOV = 1 / Math.tan(toRadians(deg / WIDTH));
    VIEW_SPACE = viewTrapezium(NEAR, FAR, toRadians(deg));
});

vFovSlider.addEventListener("input", (ev) => {
    const deg = (ev.target as HTMLInputElement).valueAsNumber;
    VFOV = 1 / Math.tan(toRadians(deg / WIDTH));
});

/////////////////////////////////////////////////////////////////

const config: DrawerConfig = {
    ...DrawerConfigDefault,
    width: WIDTH,
    height: HEIGHT,
    scale: 3,
    nearestScaling: true,
    clearStyle: "#f0f0f0",
    alpha: false,
};

export const DRAW = new Drawer(document.querySelector("main")!, config);
export const CTX = DRAW.context;

const BUFFER_CANVAS = document.createElement("canvas");
BUFFER_CANVAS.width = WIDTH;
BUFFER_CANVAS.height = HEIGHT;
const BUFFER_CTX = BUFFER_CANVAS.getContext("2d", {
    alpha: config.alpha,
})!;

export const FRAMEBUFFER = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
const IMAGE = new ImageData(FRAMEBUFFER, WIDTH, HEIGHT);

export const CAMERA = new Camera();

const TEXTURES: Texture[] = [];

export type Attributes = {
    u: number;
    v: number;
    d: number;
};

const DEFAULT_WALL_TEX_COORDS = [new Vec2(0, 0), new Vec2(1, 1)];

let walls: Wall[] = [];
let floors: Floor[] = [];

async function init() {
    await loadTextures();
    loadData();
}

async function loadTextures() {
    const texturePaths = ["/res/test.png", "/res/wall.png", "/res/tiles.png"];

    for (const path of texturePaths) {
        const t = await Texture.loadTexture(path, true);
        TEXTURES.push(t);
    }
}

function loadData() {
    walls = [
        new Wall(
            new Segment(new Vec2(-250, 300), new Vec2(250, 300)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            0,
            RED,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(-300, 700), new Vec2(-250, 300)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            0,
            GREEN,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(250, 300), new Vec2(-300, 700)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            0,
            BLUE,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(1000, 1000), new Vec2(0, 0)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            100,
            YELLOW,
            TEXTURES[1]
        ),

        new Wall(
            new Segment(new Vec2(6000, 2000), new Vec2(2000, 2000)),
            DEFAULT_WALL_TEX_COORDS,
            500,
            0,
            BLUE,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(6000, 3000), new Vec2(6000, 2000)),
            DEFAULT_WALL_TEX_COORDS,
            500,
            0,
            YELLOW,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(2000, 3000), new Vec2(6000, 3000)),
            DEFAULT_WALL_TEX_COORDS,
            500,
            0,
            BLUE,
            TEXTURES[1]
        ),
        new Wall(
            new Segment(new Vec2(2000, 2000), new Vec2(2000, 3000)),
            DEFAULT_WALL_TEX_COORDS,
            500,
            0,
            YELLOW,
            TEXTURES[1]
        ),
    ];

    floors = [
        new Floor(
            [
                new Vec2(3000, 1000),
                new Vec2(4000, 1000),
                new Vec2(4000, 0),
                new Vec2(3000, 0),
            ],
            [new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1)],
            [0, 1, 2, 0, 2, 3],
            -125,
            BLUE,
            TEXTURES[2]
        ),
    ];
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
    CAMERA.update(dt);

    // TODO: firefox seems to interpret the `getContext().options.alpha` property differently?
    //       even when it is disabled, it still applies the alpha channel when rendering, so filling with
    //       32 makes everything look dark and faded on firefox but is fine on chrome
    FRAMEBUFFER.fill(32);
    drawWalls(walls);

    BUFFER_CTX.putImageData(IMAGE, 0, 0);
    CTX.drawImage(BUFFER_CANVAS, 0, 0);

    if (DRAW.input.isKeyPressed(Key.F1)) {
        WIREFRAME = !WIREFRAME;
    }
    if (DRAW.input.isKeyPressed(Key.F2)) {
        OVERLAY = !OVERLAY;
    }

    if (OVERLAY) {
        CAMERA.drawStats();

        drawFps();

        // TODO: FPS limiting is clearly not perfect
        drawFrametimeGraph();
    }
}

init().then(() => DRAW.run(draw));
