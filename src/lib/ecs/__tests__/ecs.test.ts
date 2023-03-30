import { Format } from "../../collections/types";
import { ComponentArrays } from "../component";
import { Entity } from "../entity";
import World from "../world";

const Velocity = {
    speed: Format.f32,
    dir: {
        x: Format.f32,
        y: Format.f32,
    },
};

const Position = {
    x: Format.f32,
    y: Format.f32,
};

const Colour = {
    r: Format.u8,
    g: Format.u8,
    b: Format.u8,
};

test("general", () => {
    const w = new World();

    w.registerComponent(Velocity);
    w.registerComponent(Position);
    w.registerComponent(Colour);

    let start = performance.now();
    for (let i = 0; i < 333; i++) {
        let e = w.createEntity();
        w.addComponent(e, Position, {
            x: 5,
            y: 2,
        });
        w.addComponent(e, Colour, {
            r: 128,
            g: 0,
            b: 0,
        });
    }

    for (let i = 0; i < 333; i++) {
        let e = w.createEntity();
        w.addComponent(e, Position, {
            x: 1,
            y: 10,
        });
        w.addComponent(e, Velocity, {
            speed: 0.5,
            dir: {
                x: -1,
                y: 0,
            },
        });
        w.addComponent(e, Colour, {
            r: 0,
            g: 128,
            b: 0,
        });
    }

    for (let i = 0; i < 333; i++) {
        let e = w.createEntity();
        w.addComponent(e, Position, {
            x: 5,
            y: 2,
        });
    }
    console.log("created 999 entities", performance.now() - start);

    start = performance.now();
    const q1 = w.createQuery(Position);
    const q2 = w.createQuery(Velocity, Position);
    const q3 = w.createQuery(Colour);
    console.log("created 3 queries", performance.now() - start);

    const s1 = (length: number, position: ComponentArrays<typeof Position>) => {
        for (let i = 0; i < length; i++) {
            position.x[i] *= 5;
            position.y[i] += 10;
        }
    };

    const s2 = (
        length: number,
        velocity: ComponentArrays<typeof Velocity>,
        position: ComponentArrays<typeof Position>
    ) => {
        for (let i = 0; i < length; i++) {
            position.x[i] += velocity.speed[i] * velocity.dir.x[i];
            position.y[i] += velocity.speed[i] * velocity.dir.y[i];
        }
    };

    const s3 = (length: number, colour: ComponentArrays<typeof Colour>) => {
        for (let i = 0; i < length; i++) {
            if (colour.r[i] > 0) {
                colour.b[i] = 64;
            }
        }
    };

    w.addSystem(s1, q1);
    w.addSystem(s2, q2);
    w.addSystem(s3, q3);

    start = performance.now();
    w.runSystems();
    console.log("ran 3 systems on 1998 entities", performance.now() - start);
});
