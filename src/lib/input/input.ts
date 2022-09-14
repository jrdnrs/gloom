import { KeyboardCodes, Key, KeyState } from "./keys";

export default class Input {
    private keyboard: KeyState[];
    private mouse: KeyState[];
    private mouseDeltaX: number;
    private mouseDeltaY: number;
    private canvas: HTMLCanvasElement;
    pointerLocked: boolean;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.pointerLocked = false;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.keyboard = Array.from(new Array(KeyboardCodes.length), () => {
            return {
                held: false,
                pressed: false,
            };
        });
        this.mouse = Array.from(new Array(5), () => {
            return {
                held: false,
                pressed: false,
            };
        });

        document.addEventListener("keydown", (ev) => {
            ev.preventDefault();
            // multiple events will be fires if a key is held down, but we just want the first one
            if (ev.repeat) return;

            const i = KeyboardCodes.indexOf(ev.code);
            this.keyboard[i].held = true;
            this.keyboard[i].pressed = true;
        });

        document.addEventListener("keyup", (ev) => {
            ev.preventDefault();
            const i = KeyboardCodes.indexOf(ev.code);
            this.keyboard[i].held = false;
        });

        document.addEventListener("pointerlockchange", (ev) => {
            this.pointerLocked = document.pointerLockElement === this.canvas;
        });

        this.canvas.addEventListener("mousedown", (ev) => {
            if (!this.pointerLocked) {
                this.canvas.requestPointerLock();
                return;
            }
            this.mouse[ev.button].held = true;
            this.mouse[ev.button].pressed = true;
        });

        this.canvas.addEventListener("mouseup", (ev) => {
            if (!this.pointerLocked) return;

            this.mouse[ev.button].held = false;
        });

        this.canvas.addEventListener("mousemove", (ev) => {
            if (!this.pointerLocked) return;

            this.mouseDeltaX += ev.movementX;
            this.mouseDeltaY += ev.movementY;
        });
    }

    /**
     * Resets the `pressed` state, which denotes whether the key was first pressed this frame, for every key.
     * This should be called at the _end_ of every frame
     */
    update() {
        for (const keyState of this.keyboard) {
            keyState.pressed = false;
        }
        for (const keyState of this.mouse) {
            keyState.pressed = false;
        }
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
    }

    /**
     * Returns `true` if the specified key is currently held down, and `false` otherwise
     */
    isKeyHeld(key: Key): boolean {
        if (key < 900) {
            return this.keyboard[key].held;
        }
        return this.mouse[key-900].held;
    }

    /**
     * Returns `true` if the specified key was pressed this frame, and `false` otherwise
     */
    isKeyPressed(key: Key): boolean {
        if (key < 900) {
            return this.keyboard[key].pressed;
        }
        return this.mouse[key-900].pressed;
    }

    getMouseMovement(): {x: number, y: number} {
        return {
            x: this.mouseDeltaX,
            y: this.mouseDeltaY
        }
    }
}
