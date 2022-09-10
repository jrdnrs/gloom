import { KeyCodes, Key, KeyState } from "./keys";

export default class Input {
    private state: KeyState[];

    constructor() {
        this.state = Array.from(new Array(KeyCodes.length), () => {
            return {
                held: false,
                pressed: false
            };
        });

        window.addEventListener("keydown", (ev) => {
            ev.preventDefault();
            // multiple events will be fires if a key is held down, but we just want the first one
            if (ev.repeat) return;

            const i = KeyCodes.indexOf(ev.code);
            this.state[i].held = true;
            this.state[i].pressed = true;
        });

        window.addEventListener("keyup", (ev) => {
            ev.preventDefault();
            const i = KeyCodes.indexOf(ev.code);
            this.state[i].held = false;
        });

        // TODO: add mouse support
        // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
    }

    /**
     * Resets the `pressed` state, which denotes whether the key was first pressed this frame, for every key.
     * This should be called at the _end_ of every frame
     */
    update() {
        for (const keyState of this.state) {
            keyState.pressed = false;
        }
    }

    /**
     * Returns `true` if the specified key is currently held down, and `false` otherwise
     */
    isKeyHeld(key: Key): boolean {
        return this.state[key].held;
    }

    /**
     * Returns `true` if the specified key was pressed this frame, and `false` otherwise
     */
    isKeyPressed(key: Key): boolean {
        return this.state[key].pressed;
    }
}
