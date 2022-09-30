import { CTX, DRAW, MOUSE_PITCH_LOCK } from "./index";
import { Key } from "./lib/input/keys";
import { clamp, toRadians } from "./lib/maths/util";
import Vec2 from "./lib/maths/vec2";

const MOUSE_SENS_X = 0.01;
const MOUSE_SENS_Y = 0.0075;
const KEYB_SENS_X = 0.2;
const KEYB_SENS_Y = 0.15;

export default class Camera {
    pos: Vec2;
    zOffset: number;
    dir: Vec2;
    yaw: number;
    yawSin: number;
    yawCos: number;
    pitch: number;
    pitchTan: number;

    constructor() {
        this.pos = new Vec2(0, 0);
        this.zOffset = 0;
        this.dir = new Vec2(0, -1);
        this.yaw = 0;
        this.yawSin = 0;
        this.yawCos = 0;
        this.pitch = 0;
        this.pitchTan = 0;
    }

    update(dt: number) {
        const mouseMovement = DRAW.input.getMouseMovement();

        this.yaw += mouseMovement.x * MOUSE_SENS_X * dt;
        if (!MOUSE_PITCH_LOCK)
            this.pitch -= mouseMovement.y * MOUSE_SENS_Y * dt;

        // look up/down
        if (DRAW.input.isKeyHeld(Key.BracketLeft)) {
            this.pitch += KEYB_SENS_Y * dt;
        } else if (DRAW.input.isKeyHeld(Key.Quote)) {
            this.pitch -= KEYB_SENS_Y * dt;
        }

        // look left/right
        if (DRAW.input.isKeyHeld(Key.Semicolon)) {
            this.yaw -= KEYB_SENS_X * dt;
        } else if (DRAW.input.isKeyHeld(Key.Backslash)) {
            this.yaw += KEYB_SENS_X * dt;
        }

        this.pitch = clamp(this.pitch, -45, 45);
        // unnecessary unless we need to use this for something else?
        // this.yaw %= 360;

        const yawRad = toRadians(this.yaw);
        this.yawCos = Math.cos(yawRad);
        this.yawSin = Math.sin(yawRad);
        this.pitchTan = Math.tan(toRadians(this.pitch));

        // this is calculated differently, instead of just (cos(a), sin(a)), to make the player face toward
        // positive Y by rotating the result 90 degrees anticlockwise, and the angle is negated to turn
        // clockwise instead of anticlockwise
        // this.dir.x = -Math.sin(-toRadians(this.yaw));
        // this.dir.y = Math.cos(-toRadians(this.yaw));
        this.dir.x = this.yawSin;
        this.dir.y = this.yawCos;
    }

    drawStats() {
        CTX.font = "0.5em Arial";
        CTX.fillStyle = "#dea300";
        CTX.fillText(`X:      ${this.pos.x.toFixed(1)}`, 5, 10);
        CTX.fillText(`Y:      ${this.pos.y.toFixed(1)}`, 5, 20);
        CTX.fillText(`Z:      ${this.zOffset.toFixed(1)}`, 5, 30);
        CTX.fillText(`yaw:  ${this.yaw.toFixed(1)}`, 5, 40);
        CTX.fillText(`pitch: ${this.pitch.toFixed(1)}`, 5, 50);
    }
}
