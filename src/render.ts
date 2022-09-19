import {
    WIDTH,
    HEIGHT,
    Attributes,
    NEAR,
    HFOV,
    VFOV,
    VIEW_SPACE,
    WIREFRAME,
    CAMERA,
} from "./index";
import Quad from "./lib/maths/quad";
import Segment from "./lib/maths/segment";
import Triangle from "./lib/maths/triangle";
import Vec2 from "./lib/maths/vec2";
import { textureTriangle, drawSegment, textureWall } from "./rasterize";
import { Floor, GREEN, Wall } from "./surface";


// TODO: stop using this
function perspectiveProjectionSeg(segment: Segment, zOffset: number): Segment {
    for (let point of segment.iterPoints()) {
        const depth = point.y;

        if (depth <= 0)
            throw `perspective divide failed, '${depth}' depth is invalid`;

        // - `CAMERA.pitch * depth` is used to mimic real pitch using Y-shearing.
        // - Adding `CAMERA.height` here instead of negating it because otherwise up would be negative Z
        //   and that's weird
        point.x = (point.x * HFOV) / depth;
        point.y =
            ((zOffset + CAMERA.zOffset + CAMERA.pitch * depth) * VFOV) / depth;

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

    // - `CAMERA.pitch * depth` is used to mimic real pitch using Y-shearing.
    // - Adding `CAMERA.height` here instead of negating it because otherwise up would be negative Z
    //   and that's weird
    point.x = (point.x * HFOV) / depth;
    point.y =
        ((zOffset + CAMERA.zOffset + CAMERA.pitch * depth) * VFOV) / depth;

    // set centre of screen as new origin
    point.x += WIDTH / 2;
    point.y += HEIGHT / 2;

    return point;
}
        const transformed = floor.points.map((p) => {
            return p
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos);
        });

function sortWalls(walls: Wall[]) {
    walls.sort((a, b) => b.distance - a.distance);
}

export function drawWalls(walls: Wall[]) {
    // sort the walls from farthest to nearest,
    // based on the distance calculation from the previous frame
    sortWalls(walls);

    for (const wall of walls) {
        const segment = new Segment(
            wall.seg.p1
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos),
            wall.seg.p2
                .copy()
                .sub(CAMERA.pos)
                .rotate(0, CAMERA.yawSin, CAMERA.yawCos)
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

        let a1 = { u: wall.textureCoords[0].x, v: wall.textureCoords[0].y, d: segment.p1.y };
        let a2 = { u: wall.textureCoords[1].x, v: wall.textureCoords[1].y, d: segment.p2.y };

        // important to do this as negative Y values can create artefacts during perspective division
        // TODO: this clipping is causing issues with texture mapping, we might need to store the texture
        //       coords and clip those too
        if (segment.p1.y < NEAR || segment.p2.y < NEAR) {
            segment.clipNearAttr(NEAR, a1, a2);
        }

        // don't want to clip V
        a1.v = wall.textureCoords[0].y;
        a2.v = wall.textureCoords[1].y;

        // using +/- half of wall height to split it at the horizon (middle of screen)
        // negating the zOffset (Y in screen space) as positive Y is down in screen space
        const bottom = perspectiveProjectionSeg(
            segment.copy(),
            wall.height / 2 - wall.zOffset
        );
        const top = perspectiveProjectionSeg(
            segment.copy(),
            -wall.height / 2 - wall.zOffset
        );

        // with a more sophisticated visibility check we could do this earlier,
        // but for now check if its out of screen space will do
        if (
            new Quad(bottom.p1, bottom.p2, top.p1, top.p2).outOfBounds(
                0,
                WIDTH,
                0,
                HEIGHT
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
                GREEN,
                wall.alpha
            );
            drawSegment(
                top.copy().clipRect(0, WIDTH, 0, HEIGHT).round(),
                GREEN,
                wall.alpha
            );
        }
    }
}
