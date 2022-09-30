import { CTX, DRAW } from "./index";
import Camera from "./camera";
import { Key } from "./lib/input/keys";
import Quad from "./lib/maths/quad";
import Vec2 from "./lib/maths/vec2";

export default class Player {
    camera: Camera;
    boundingBox: Quad;
    velocity: Vec2;
    accel: Vec2;

    width: number;
    halfWidth: number;
    height: number;
    halfHeight: number;

    eyeHeight: number;
    kneeHeight: number;

    bottomZoffset: number;
    topZoffset: number;

    constructor() {
        this.velocity = new Vec2(0, 0);
        this.accel = new Vec2(0, 0);
        this.height = 300;
        this.halfHeight = this.height / 2;
        this.eyeHeight = this.height * 0.9;
        this.kneeHeight = this.height * 0.2;
        this.width = 100;
        this.halfWidth = this.width / 2;
        this.bottomZoffset = 0;
        this.topZoffset = this.bottomZoffset + this.height;

        this.camera = new Camera();
        this.camera.zOffset = this.eyeHeight;

        this.boundingBox = new Quad(
            new Vec2(
                this.camera.pos.x - this.halfWidth,
                this.camera.pos.y - this.halfWidth
            ),
            new Vec2(
                this.camera.pos.x - this.halfWidth,
                this.camera.pos.y + this.halfWidth
            ),
            new Vec2(
                this.camera.pos.x + this.halfWidth,
                this.camera.pos.y + this.halfWidth
            ),
            new Vec2(
                this.camera.pos.x + this.halfWidth,
                this.camera.pos.y - this.halfWidth
            )
        );
    }

    update(dt: number) {
        this.camera.update(dt);
        this.handleMovement(dt);
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        // update bounding box posiiton
        this.boundingBox.p1.x = this.camera.pos.x - this.halfWidth;
        this.boundingBox.p2.x = this.camera.pos.x - this.halfWidth;
        this.boundingBox.p3.x = this.camera.pos.x + this.halfWidth;
        this.boundingBox.p4.x = this.camera.pos.x + this.halfWidth;
        this.boundingBox.p1.y = this.camera.pos.y - this.halfWidth;
        this.boundingBox.p2.y = this.camera.pos.y + this.halfWidth;
        this.boundingBox.p3.y = this.camera.pos.y + this.halfWidth;
        this.boundingBox.p4.y = this.camera.pos.y - this.halfWidth;

        this.bottomZoffset = this.camera.zOffset - this.eyeHeight;
        this.topZoffset = this.bottomZoffset + this.height;
    }

    handleMovement(dt: number) {
        this.accel.x = 0;
        this.accel.y = 0;

        const acceleration = dt * 0.1;
        const verticalAcceleration = dt * 0.33;
        const friction = dt * -0.05;
        const maxSpeed = 15;

        // move forward/backward
        if (DRAW.input.isKeyHeld(Key.W)) {
            this.accel.add(this.camera.dir.copy().mulScalar(acceleration));
        } else if (DRAW.input.isKeyHeld(Key.S)) {
            this.accel.sub(this.camera.dir.copy().mulScalar(acceleration));
        }

        // move left/right
        if (DRAW.input.isKeyHeld(Key.A)) {
            const left = Vec2.normal(this.camera.dir).mulScalar(acceleration);
            this.accel.add(left);
        } else if (DRAW.input.isKeyHeld(Key.D)) {
            const left = Vec2.normal(this.camera.dir).mulScalar(acceleration);
            this.accel.sub(left);
        }

        // move up/down
        if (DRAW.input.isKeyHeld(Key.Space)) {
            this.camera.zOffset += verticalAcceleration;
        } else if (DRAW.input.isKeyHeld(Key.ShiftLeft)) {
            this.camera.zOffset -= verticalAcceleration;
        }

        // scale diagonal movement
        const am = this.accel.magnitude();
        if (am > acceleration) {
            this.accel.divScalar(am).mulScalar(acceleration);
        }

        // apply friction
        const frict = this.velocity.copy();
        const fm = frict.magnitude();
        if (fm > 1) frict.divScalar(fm);
        frict.mulScalar(friction);
        this.velocity.add(frict);
        // this.velocity.mulScalar(0.95)

        // apply acceleration
        this.velocity.add(this.accel);

        // clamp max speed
        const vm = this.velocity.magnitude();
        if (vm > maxSpeed) {
            this.velocity.divScalar(vm).mulScalar(maxSpeed);
        }

        this.camera.pos.add(this.velocity);

        this.camera.zOffset -= dt*0.1

        // bobbing (should actually be a screenspace effect and not actually change our direction!)
        const bobY = Math.sin(DRAW.timeElapsed * 0.008) * 0.006;
        const bobP = Math.sin(DRAW.timeElapsed * 0.016) * 0.003;

        this.camera.yaw += bobY * this.velocity.magnitude();
        this.camera.pitch += bobP * this.velocity.magnitude();
    }

    drawStats() {
        CTX.font = "0.5em Arial";
        CTX.fillStyle = "#dea300";
        CTX.fillText(
            `vel:       ${this.velocity.x.toFixed(
                1
            )}, ${this.velocity.y.toFixed(1)}`,
            5,
            110
        );
        CTX.fillText(`speed:  ${this.velocity.magnitude().toFixed(1)}`, 5, 120);
    }
}
