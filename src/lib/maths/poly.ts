import type Vec2 from "./vec2";
import Segment from "./segment";

export interface Polygon {
    points: Vec2[];
    segments: Segment[];
    getMinX(): number;
    getMinY(): number;
    getMaxX(): number;
    getMaxY(): number;

}

export class Poly {
    points: Vec2[];
    segments: Segment[];

    constructor(points: Vec2[]) {
        this.points = points;
        this.segments = [];
        for (let i = 0; i < this.points.length; i++) {
            this.segments.push(
                new Segment(
                    this.points[i],
                    this.points[(i + 1) % this.points.length]
                )
            );
        }
    }

    getMinX(): number {
        let min = Number.MAX_SAFE_INTEGER;
        for (const p of this.points) {
            Math.min(min, p.x);
        }
        return min
    }

    getMinY(): number {
        let min = Number.MAX_SAFE_INTEGER;
        for (const p of this.points) {
            Math.min(min, p.y);
        }
        return min
    }

    getMaxX(): number {
        let max = Number.MIN_SAFE_INTEGER;
        for (const p of this.points) {
            Math.max(max, p.x);
        }
        return max
    }

    getMaxY(): number {
        let max = Number.MIN_SAFE_INTEGER;
        for (const p of this.points) {
            Math.max(max, p.y);
        }
        return max
    }
}
