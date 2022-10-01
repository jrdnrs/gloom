import {
    WIDTH,
    HEIGHT,
    Attributes,
    NEAR,
    HFOV,
    VFOV,
    VIEW_SPACE,
    WIREFRAME,
    PLAYER,
    SCREEN_SPACE,
    FAR,
    HFOVdegrees,
} from "./index";
import { SATtest } from "./collision";
import Quad from "./lib/maths/quad";
import Segment from "./lib/maths/segment";
import Triangle from "./lib/maths/triangle";
import Vec2 from "./lib/maths/vec2";
import { textureTriangle, drawSegment, textureWall } from "./rasterise";
import { MAGENTA, Floor, Wall, BLUE } from "./surface";
import Texture from "./texture";

export interface Renderable {
    distance: number;
}

// TODO: stop using this
function perspectiveProjectionSeg(segment: Segment, zOffset: number): Segment {
    for (let point of segment.points) {
        const depth = point.y;

        if (depth <= 0)
            throw `perspective divide failed, '${depth}' depth is invalid`;

        // - `PLAYER.camera.pitch * depth` is used to mimic real pitch using Y-shearing.
        // - Adding `PLAYER.camera.height` here instead of negating it because otherwise up would be negative Z
        //   and that's weird
        point.x = (point.x * HFOV) / depth;
        point.y =
            ((zOffset +
                PLAYER.camera.zOffset +
                PLAYER.camera.pitchTan * depth) *
                VFOV) /
            depth;

        // set centre of screen as new origin
        point.x += WIDTH / 2;
        point.y += HEIGHT / 2;
    }

    return segment;
}

function perspectiveProjection(point: Vec2, zOffset: number): Vec2 {
    const depth = point.y;

    if (depth <= 0)
        throw `perspective divide failed, '${depth}' depth is invalid`;

    // - `PLAYER.camera.pitch * depth` is used to mimic real pitch using Y-shearing.
    // - Adding `PLAYER.camera.height` here instead of negating it because otherwise up would be negative Z
    //   and that's weird
    point.x = (point.x * HFOV) / depth;
    point.y =
        ((zOffset + PLAYER.camera.zOffset + PLAYER.camera.pitchTan * depth) *
            VFOV) /
        depth;

    // set centre of screen as new origin
    point.x += WIDTH / 2;
    point.y += HEIGHT / 2;

    return point;
}

export function drawFloors(floors: Floor[]) {
    for (const floor of floors) {
        const transformed = floor.points.map((p) => {
            return p
                .copy()
                .sub(PLAYER.camera.pos)
                .rotate(0, PLAYER.camera.yawSin, PLAYER.camera.yawCos);
        });

        let triangles: Triangle[] = [];
        let attributes: Attributes[][] = [];

        let x = 0;
        let y = 0;
        for (const p of transformed) {
            x += p.x;
            y += p.y;
        }
        x /= transformed.length;
        y /= transformed.length;
        floor.distance = Math.sqrt(x ** 2 + y ** 2);

        for (let i = 0; i < floor.indices.length; i += 3) {
            const p1 = transformed[floor.indices[i]];
            const p2 = transformed[floor.indices[i + 1]];
            const p3 = transformed[floor.indices[i + 2]];

            const t1 = floor.textureCoords[floor.indices[i]];
            const t2 = floor.textureCoords[floor.indices[i + 1]];
            const t3 = floor.textureCoords[floor.indices[i + 2]];

            const tri = new Triangle(p1.copy(), p2.copy(), p3.copy());

            const attr = [
                { u: t1.x, v: t1.y, d: p1.y },
                { u: t2.x, v: t2.y, d: p2.y },
                { u: t3.x, v: t3.y, d: p3.y },
            ];

            // view space culling check
            if (!SATtest(tri, VIEW_SPACE)) {
                continue;
            }

            const out = tri.clipNearAttr(NEAR, attr);

            triangles.push(...out.triangles);
            attributes.push(...out.attributes);
        }

        for (const [i, tri] of triangles.entries()) {
            for (const point of tri.points) {
                perspectiveProjection(point, -floor.zOffset);
            }

            // screen space culling check
            if (!SATtest(tri, SCREEN_SPACE)) {
                continue;
            }

            const a = attributes[i];

            textureTriangle(tri, a[0], a[1], a[2], floor.texture!, floor.alpha);

            if (WIREFRAME) {
                for (const seg of tri.segments) {
                    drawSegment(
                        seg.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
                        MAGENTA,
                        floor.alpha
                    );
                }
            }
        }
    }
}

export function sortRenderables(renderables: Renderable[]) {
    renderables.sort((a, b) => a.distance - b.distance);
}

export function drawWalls(walls: Wall[]) {
    for (const wall of walls) {
        const segment = new Segment(
            wall.seg.p1
                .copy()
                .sub(PLAYER.camera.pos)
                .rotate(0, PLAYER.camera.yawSin, PLAYER.camera.yawCos),
            wall.seg.p2
                .copy()
                .sub(PLAYER.camera.pos)
                .rotate(0, PLAYER.camera.yawSin, PLAYER.camera.yawCos)
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
        }

        let a1 = {
            u: wall.textureCoords[0].x,
            v: wall.textureCoords[0].y,
            d: segment.p1.y,
        };
        let a2 = {
            u: wall.textureCoords[1].x,
            v: wall.textureCoords[1].y,
            d: segment.p2.y,
        };

        // important to do this as negative Y values can create artefacts during perspective division
        if (segment.p1.y < NEAR || segment.p2.y < NEAR) {
            segment.clipNearAttr(NEAR, a1, a2);
        }

        // don't want to clip V
        a1.v = wall.textureCoords[0].y;
        a2.v = wall.textureCoords[1].y;

        // using +/- half of wall height to split it at the horizon (middle of screen)
        // negating the zOffset (Y in screen space) as positive Y is down in screen space
        const bottom = perspectiveProjectionSeg(segment.copy(), -wall.zOffset);
        const top = perspectiveProjectionSeg(
            segment.copy(),
            -(wall.height + wall.zOffset)
        );

        // with a more sophisticated visibility check we could do this earlier,
        // but for now check if its out of screen space will do
        if (
            !SATtest(
                new Quad(bottom.p1, bottom.p2, top.p1, top.p2),
                SCREEN_SPACE
            )
        ) {
            continue;
        }

        // fillColour(bottom, top, wall.colour, wall.alpha);
        textureWall(bottom, top, a1, a2, wall.texture!, wall.alpha);

        // TODO: temp for debugging
        if (WIREFRAME) {
            drawSegment(
                bottom.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
                MAGENTA,
                wall.alpha
            );
            drawSegment(
                top.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
                MAGENTA,
                wall.alpha
            );
        }
    }
}

export function drawSky(texture: Texture, rot: number) {
    let top = new Segment(new Vec2(0, 0), new Vec2(WIDTH, 0));
    let bottom = new Segment(new Vec2(0, HEIGHT), new Vec2(WIDTH, HEIGHT));

    const yShear = PLAYER.camera.pitchTan * VFOV;

    bottom.p1.y = yShear;
    bottom.p2.y = yShear;
    top.p1.y = yShear;
    top.p2.y = yShear;

    bottom.p1.y += HEIGHT * 0.67;
    bottom.p2.y += HEIGHT * 0.67;
    top.p1.y -= HEIGHT * 1.33;
    top.p2.y -= HEIGHT * 1.33;

    let a1 = {
        u: 0,
        v: 0,
        d: 1_000_000,
    };
    let a2 = {
        u: 1,
        v: 1,
        d: 1_000_000,
    };

    const coordWidth = HFOVdegrees / 2 / 360;
    const angle = (PLAYER.camera.yaw + rot) % 360;
    const midCoord = angle / 360;
    const firstCoord = midCoord - coordWidth + 2;
    const lastCoord = midCoord + coordWidth + 2;

    a1.u = firstCoord;
    a2.u = lastCoord;

    textureWall(bottom, top, a1, a2, texture);
}
