import { roundDown } from "./maths/util";
import Input from "./input/input";
import type Vec2 from "./maths/vec2";

/**
 *  number of previous frametimes to cache
 **/
const FT_SIZE = 128;

export default class Drawer {
    private userFunc: ((dt: number) => void) | undefined;

    readonly config: DrawerConfig;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    input: Input;

    timeElapsed: number;
    frames: number;
    fps: number;
    frametimes: number[];
    targetFrametime: number;
    averageFrametime: number;

    constructor(container: HTMLElement, config?: DrawerConfig) {
        this.config = config ?? DrawerConfigDefault;
        this.canvas = container.appendChild(document.createElement("canvas"));

        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // set scaling
        this.canvas.style.transformOrigin = "top left";
        if (this.config.nearestScaling)
            this.canvas.style.imageRendering = "pixelated";
        this.canvas.style.scale = this.config.scale.toString();
        // this.context.imageSmoothingEnabled = false;

        this.context = this.canvas.getContext("2d", {
            alpha: this.config.alpha,
        })!;
        this.input = new Input(this.canvas);

        this.timeElapsed = 0;
        this.frames = 0;
        this.fps = 0;
        this.frametimes = new Array(FT_SIZE).fill(0);
        this.targetFrametime = roundDown(1000 / this.config.targetFps, 1);
        this.averageFrametime = 0;
    }

    private main(dt: number) {
        // TODO: make this configurable, we don't need to clear if we are manually replacing the bitmap
        // this.clear(this.config.clearStyle);
        this.userFunc!(dt);

        this.input.update();
        this.frames += 1;
    }

    private loop(time: number) {
        const dt = this.updateTimings(time);
        this.timeElapsed = time;
        this.main(dt);
        requestAnimationFrame((time) => this.loop(time));
    }

    private loopFpsLimit(time: number) {
        const dt = this.updateTimings(time);

        if (
            this.averageFrametime >= this.targetFrametime ||
            dt >= this.targetFrametime
        ) {
            this.timeElapsed = time;
            this.main(dt);
        }

        requestAnimationFrame((time) => this.loopFpsLimit(time));
    }

    private updateTimings(time: number): number {
        const dt = time - this.timeElapsed;
        this.frametimes[this.frames % FT_SIZE] = dt;
        this.averageFrametime =
            this.frametimes.reduce((prev, curr) => (curr += prev)) / FT_SIZE;
        this.fps = 1000 / this.averageFrametime;

        return dt;
    }

    run(func: (dt: number) => void) {
        this.userFunc = func;

        requestAnimationFrame((time) => {
            if (this.config.limitFps && this.config.targetFps !== 0) {
                this.loopFpsLimit(time);
            } else {
                this.loop(time);
            }
        });
    }

    clear(style: string | CanvasGradient | CanvasPattern) {
        this.context.fillStyle = style;
        this.context.fillRect(0, 0, this.config.width, this.config.height);
    }

    drawLine(
        style: string | CanvasGradient | CanvasPattern,
        start: Vec2,
        end: Vec2
    ) {
        this.context.strokeStyle = style;
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();
        this.context.closePath();
    }

    drawPolyline(
        style: string | CanvasGradient | CanvasPattern,
        points: Vec2[]
    ) {
        this.context.strokeStyle = style;
        this.context.beginPath();
        this.context.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.context.lineTo(points[i].x, points[i].y);
        }

        this.context.stroke();
        this.context.closePath();
    }
}

export type DrawerConfig = {
    width: number;
    height: number;
    scale: number;
    nearestScaling: boolean;
    clearStyle: string | CanvasGradient | CanvasPattern;
    alpha: boolean;
    limitFps: boolean;
    targetFps: number;
};

export const DrawerConfigDefault: DrawerConfig = {
    width: 800,
    height: 600,
    scale: 1,
    nearestScaling: false,
    clearStyle: "#ffffff",
    alpha: false,
    limitFps: false,
    targetFps: 60
};
