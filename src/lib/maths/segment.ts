import { Attributes } from "../../index";
import type { Polygon } from "./poly";
import Vec2 from "./vec2";

export default class Segment {
    p1: Vec2;
    p2: Vec2;
    points: Vec2[];

    constructor(p1: Vec2, p2: Vec2) {
        this.p1 = p1;
        this.p2 = p2;
        this.points = [this.p1, this.p2];
    }

    getMinX(): number {
        return Math.min(this.p1.x, this.p2.x);
    }

    getMinY(): number {
        return Math.min(this.p1.y, this.p2.y);
    }

    getMaxX(): number {
        return Math.max(this.p1.x, this.p2.x);
    }

    getMaxY(): number {
        return Math.max(this.p1.y, this.p2.y);
    }

    /**
     * Returns a new deep copy
     */
    copy(): Segment {
        return new Segment(this.p1.copy(), this.p2.copy());
    }

    /**
     * Round _this_ segment's coordinates to the nearest int
     */
    round(): this {
        this.p1.round();
        this.p2.round();
        return this;
    }

    rotate(
        rad: number,
        sin: number = Math.sin(rad),
        cos: number = Math.cos(rad)
    ): this {
        this.p1.rotate(rad, sin, cos);
        this.p2.rotate(rad, sin, cos);
        return this;
    }

    /**
     * Returns `true` if _this_ and the `other` segment intersect at some point, and `false` otherwise.
     * Prefer this over `getIntersection()` if you don't actually need the point
     */
    // https://en.wikipedia.org/wiki/Line-line_intersection#Given_two_points_on_each_line_segment
    intersectsSeg(other: Segment): boolean {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const x3 = other.p1.x;
        const y3 = other.p1.y;
        const x4 = other.p2.x;
        const y4 = other.p2.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        // den will be 0 when parallel
        if (den === 0) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / den;

        // return t >= 0 && t <= 1 && u >= 0 && u <= 1;
        return !(t < 0 || t > 1 || u < 0 || u > 1);
    }

    /**
     * If _this_ and the `other` segment intersect at some point, the point will be returned,
     * otherwise returns `undefined`
     */
    getIntersectionSeg(other: Segment): Vec2 | undefined {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const x3 = other.p1.x;
        const y3 = other.p1.y;
        const x4 = other.p2.x;
        const y4 = other.p2.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (den === 0) return undefined;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / den;

        if (t < 0 || t > 1 || u < 0 || u > 1) return undefined;

        return new Vec2(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }

    intersectsPoly(poly: Polygon): boolean {
        for (const seg of poly.segments) {
            if (this.intersectsSeg(seg)) return true;
        }
        return false;
    }

    /**
     * Clips _this_ segment on the Y axis when below the provided `yMin`
     */
    clipNear(yMin: number): this {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;

        for (let p of this.points) {
            if (p.y < yMin) {
                p.y = yMin;
                p.x = ((x2 - x1) / (y2 - y1)) * (yMin - y1) + x1;
            }
        }

        return this;
    }

    /**
     * Clips _this_ segment on the Y axis when below the provided `yMin`.
     * This will also interpolate the provided attributes in the same way for U and D
     */
    clipNearAttr(yMin: number, a1: Attributes, a2: Attributes): this {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
        const u1 = a1.u;
        const v1 = a1.v;
        const d1 = a1.d;
        const u2 = a2.u;
        const v2 = a2.v;
        const d2 = a2.d;

        if (this.p1.y < yMin) {
            const t = (yMin - y1) / (y2 - y1);

            this.p1.y = yMin;
            this.p1.x = x1 + t * (x2 - x1);
            a1.u = u1 + t * (u2 - u1);
            a1.v = v1 + t * (v2 - v1);
            a1.d = d1 + t * (d2 - d1);
        }

        if (this.p2.y < yMin) {
            const t = (yMin - y1) / (y2 - y1);

            this.p2.y = yMin;
            this.p2.x = x1 + t * (x2 - x1);
            a2.u = u1 + t * (u2 - u1);
            a2.v = v1 + t * (v2 - v1);
            a2.d = d1 + t * (d2 - d1);
        }

        return this;
    }

    /**
     * Clips _this_ segment to remain within the rect defined by the provided args
     */
    clipRect(xMin: number, xMax: number, yMin: number, yMax: number): this {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;

        for (let p of this.points) {
            if (p.x < xMin) {
                p.x = xMin;
                p.y = ((y2 - y1) / (x2 - x1)) * (xMin - x1) + y1;
            } else if (p.x > xMax) {
                p.x = xMax;
                p.y = ((y2 - y1) / (x2 - x1)) * (xMax - x1) + y1;
            }

            if (p.y < yMin) {
                p.y = yMin;
                p.x = ((x2 - x1) / (y2 - y1)) * (yMin - y1) + x1;
            } else if (p.y > yMax) {
                p.y = yMax;
                p.x = ((x2 - x1) / (y2 - y1)) * (yMax - y1) + x1;
            }
        }

        return this;
    }
}
