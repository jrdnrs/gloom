// @ts-ignore
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    const hot = module.hot;
    if (hot) {
        hot.dispose(() => {
            window.location.reload();
            throw "hotReload";
        });
    }
}

import Drawer from "./lib/main";
import { DrawerConfigDefault, DrawerConfig } from "./lib/main";
import { Key } from "./lib/input/keys";
import { toRadians, viewTrapezium } from "./lib/maths/util";
import Vec2 from "./lib/maths/vec2";
import { Wall, Floor, YELLOW, BLUE, GREEN, MAGENTA, RED } from "./surface";
import Segment from "./lib/maths/segment";
import Texture from "./texture";
import { drawFloors, drawWalls, sortRenderables } from "./render";
import Player from "./player";
import { floorCollisionResolution, wallCollisionResolution } from "./collision";
import Quad from "./lib/maths/quad";

export const WIDTH = 480;
export const HEIGHT = 320;

export const SCREEN_SPACE = new Quad(
    new Vec2(0, 0),
    new Vec2(WIDTH - 1, 0),
    new Vec2(WIDTH - 1, HEIGHT - 1),
    new Vec2(0, HEIGHT - 1)
);

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
    scale: 2,
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

export const DEPTHBUFFER = new Array<number>(WIDTH * HEIGHT);
export const FRAMEBUFFER = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
const IMAGE = new ImageData(FRAMEBUFFER, WIDTH, HEIGHT);

export const PLAYER = new Player();

export const TEXTURES: Texture[] = [];

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
    const texturePaths = [
        "/res/test.png",
        "/res/wall.png",
        "/res/tiles.png",
        "/res/grass.png",
        "/res/grass_2.png",
        "/res/grass_3.png",
        "/res/blue.png",
    ];

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
            TEXTURES[2]
        ),
        new Wall(
            new Segment(new Vec2(-300, 700), new Vec2(-250, 300)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            0,
            GREEN,
            TEXTURES[2]
        ),
        new Wall(
            new Segment(new Vec2(250, 300), new Vec2(-300, 700)),
            DEFAULT_WALL_TEX_COORDS,
            250,
            0,
            BLUE,
            TEXTURES[2]
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
                new Vec2(-100_000, -100_000),
                new Vec2(-100_000, 100_000),
                new Vec2(100_000, 100_000),
                new Vec2(100_000, -100_000),
            ],
            [
                new Vec2(0, 0),
                new Vec2(200, 0),
                new Vec2(200, 200),
                new Vec2(0, 200),
            ],
            [0, 1, 2, 0, 2, 3],
            -125,
            BLUE,
            TEXTURES[4]
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
    // TODO: temp hack until better solution. this fixes tunneling from large movements that occur due to 
    //       being scaled with a very large dt. dt should be relatively small, though it can get very large
    //       if the user makes the tab inactive for a time
    if (dt < 1000) {
        tick(dt)
    }

    // TODO: firefox seems to interpret the `getContext().options.alpha` property differently?
    //       even when it is disabled, it still applies the alpha channel when rendering, so filling with
    //       32 makes everything look dark and faded on firefox but is fine on chrome
    FRAMEBUFFER.fill(32);
    DEPTHBUFFER.fill(0);

    // sort the walls/floors from nearest to farthest,
    // based on the distance calculation from the previous frame
    sortRenderables(walls);
    sortRenderables(floors);

    drawWalls(walls);
    drawFloors(floors);

    BUFFER_CTX.putImageData(IMAGE, 0, 0);
    CTX.drawImage(BUFFER_CANVAS, 0, 0);

    if (DRAW.input.isKeyPressed(Key.F1)) {
        WIREFRAME = !WIREFRAME;
    }
    if (DRAW.input.isKeyPressed(Key.F2)) {
        OVERLAY = !OVERLAY;
    }

    if (OVERLAY) {
        PLAYER.camera.drawStats();
        PLAYER.drawStats();

        // CTX.fillText("collision", 5, 70);
        // if (wallCollision) {
        //     CTX.fillText("wall:  true", 5, 80);
        // } else {
        //     CTX.fillText("wall:  false", 5, 80);
        // }
        // if (floorCollision) {
        //     CTX.fillText("floor: true", 5, 90);
        // } else {
        //     CTX.fillText("floor: false", 5, 90);
        // }

        drawFps();

        // TODO: FPS limiting is clearly not perfect
        drawFrametimeGraph();
    }
}

function tick(dt: number) {
    PLAYER.update(dt);

    wallCollisionResolution(walls);
    floorCollisionResolution(floors);
}

init().then(() => DRAW.run(draw));
