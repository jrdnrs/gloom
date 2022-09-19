import { CTX, DRAW, MOUSE_PITCH_LOCK } from "./index";
import { Key } from "./lib/input/keys";
import { toRadians } from "./lib/maths/util";
import Vec2 from "./lib/maths/vec2";

export default class Camera {
    pos: Vec2;
    zOffset: number;
    dir: Vec2;
    yaw: number;
    yawSin: number;
    yawCos: number;
    pitch: number;

    constructor() {
        this.pos = new Vec2(0, 0);
        this.zOffset = 0;
        this.dir = new Vec2(0, -1);
        this.yaw = 0;
        this.yawSin = 0;
        this.yawCos = 0;
        this.pitch = 0;
    }

    update(dt: number) {
        this.handleMovement(dt);
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

    handleMovement(dt: number) {
        const moveSpeed = dt * 0.67;
        const verticalMoveSpeed = dt * 0.33;
        const yawSpeed = dt * 0.1;
        const pitchSpeed = dt * 0.0005;

        const mouseMovement = DRAW.input.getMouseMovement();

        this.yaw += mouseMovement.x * dt * 0.007;
        if (!MOUSE_PITCH_LOCK) this.pitch -= mouseMovement.y * dt * 0.0001;

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

        // caching these
        this.yawCos = Math.cos(toRadians(this.yaw));
        this.yawSin = Math.sin(toRadians(this.yaw));

        // this is calculated differently, instead of just (cos(a), sin(a)), to make the player face toward
        // positive Y by rotating the result 90 degrees anticlockwise, and the angle is negated to turn
        // clockwise instead of anticlockwise
        this.dir.x = -Math.sin(-toRadians(this.yaw));
        this.dir.y = Math.cos(-toRadians(this.yaw));

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
            this.zOffset += verticalMoveSpeed;
        } else if (DRAW.input.isKeyHeld(Key.ShiftLeft)) {
            this.zOffset -= verticalMoveSpeed;
        }
    }
}