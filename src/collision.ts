import { PLAYER } from "./index";
import Vec2 from "./lib/maths/vec2";
import type { Polygon } from "./lib/maths/poly";
import type { Wall, Floor } from "./surface";

export function AABBtest(
    xMin1: number,
    xMax1: number,
    yMin1: number,
    yMax1: number,
    xMin2: number,
    xMax2: number,
    yMin2: number,
    yMax2: number
): boolean {
    return !(xMax1 < xMin2 || xMin1 > xMax2 || yMax1 < yMin2 || yMin1 > yMax2);
}

export function SATtest(poly1: Polygon, poly2: Polygon): boolean {
    for (let i = 0; i < 2; i++) {
        for (const seg of poly1.segments) {
            // I'm not sure if we need to normalise this??
            const normal = new Vec2(
                -(seg.p2.y - seg.p1.y),
                seg.p2.x - seg.p1.x
            );

            let min1 = Number.MAX_SAFE_INTEGER;
            let max1 = Number.MIN_SAFE_INTEGER;
            for (const point of poly1.points) {
                const q = point.dot(normal);
                min1 = Math.min(min1, q);
                max1 = Math.max(max1, q);
            }

            let min2 = Number.MAX_SAFE_INTEGER;
            let max2 = Number.MIN_SAFE_INTEGER;
            for (const point of poly2.points) {
                const q = point.dot(normal);
                min2 = Math.min(min2, q);
                max2 = Math.max(max2, q);
            }

            if (max1 < min2 || min1 > max2) return false;
        }
        [poly1, poly2] = [poly2, poly1];
    }

    return true;
}

export function wallCollisionResolution(walls: Wall[]) {
    for (const wall of walls) {
        if (
            wall.seg.intersectsPoly(PLAYER.boundingBox) &&
            !(
                wall.zOffset > PLAYER.topZoffset ||
                wall.zOffset + wall.height < PLAYER.bottomZoffset
            )
        ) {
            const normal = new Vec2(
                -(wall.seg.p2.y - wall.seg.p1.y),
                wall.seg.p2.x - wall.seg.p1.x
            ).normalise();

            // undo position change that caused the collision
            PLAYER.camera.pos.sub(PLAYER.velocity);

            // adjust velocity, parallel to wall
            const mag = PLAYER.velocity.dot(normal);
            const change = normal.copy().mulScalar(mag);
            PLAYER.velocity.sub(change);

            // redo position change
            PLAYER.camera.pos.add(PLAYER.velocity);

            PLAYER.updateBoundingBox();

            // check if we are still colliding
            if (wall.seg.intersectsPoly(PLAYER.boundingBox)) {
                // undo position/velocity change to return to non-colliding state for this wall
                PLAYER.camera.pos.sub(PLAYER.velocity);
                // PLAYER.velocity.add(change);
                // we shouldnt have velocity if we're running into a wall, so just reset
                PLAYER.velocity.x = 0;
                PLAYER.velocity.y = 0;

                PLAYER.updateBoundingBox();

                // get separation plane
                // if (wall.seg.intersectsPoly(PLAYER.boundingBox)) {
                //     console.log("separation plane");
                //     const normal2 = new Vec2(
                //         -(wall.seg.p1.y - wall.seg.p2.y),
                //         wall.seg.p1.x - wall.seg.p2.x
                //     ).normalise();
                //     let sep = Number.MIN_SAFE_INTEGER;
                //     for (const p of wall.seg.points) {
                //         let min = Number.MAX_SAFE_INTEGER;
                //         for (const p2 of PLAYER.boundingBox.points) {
                //             min = Math.min(
                //                 min,
                //                 p2.copy().sub(p).dot(normal2)
                //             );
                //         }
                //         sep = Math.max(sep, min);
                //     }
                //     PLAYER.camera.pos.sub(normal2.mulScalar(sep));
                // }
            } else {
                // re-run collision checks with new position
                wallCollisionResolution(walls);
                break;
            }
        }
    }
}

export function floorCollisionResolution(floors: Floor[]) {
    for (const floor of floors) {
        if (
            SATtest(floor.poly, PLAYER.boundingBox) &&
            floor.zOffset > PLAYER.bottomZoffset &&
            floor.zOffset < PLAYER.topZoffset
        ) {
            let zChange = 0;

            // check whether we need to move up/down relative to the floor, based on player midpoint
            if (PLAYER.bottomZoffset + PLAYER.halfHeight - floor.zOffset > 0) {
                zChange = floor.zOffset - PLAYER.bottomZoffset;
            } else {
                zChange = floor.zOffset - PLAYER.topZoffset;
            }
            PLAYER.camera.zOffset += zChange;
            PLAYER.updateBoundingBox();

            // check if we are still colliding
            if (
                floor.zOffset > PLAYER.bottomZoffset &&
                floor.zOffset < PLAYER.topZoffset
            ) {
                // undo position change to return to non-colliding state
                PLAYER.camera.zOffset -= zChange;
                PLAYER.updateBoundingBox();
            } else {
                // re-run collision checks with new position
                floorCollisionResolution(floors);
                break;
            }
        }
    }
}
