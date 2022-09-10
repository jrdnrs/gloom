import type Polygon from "./poly";
import Vec2 from "./vec2";

export default class Segment {
    p1: Vec2;
    p2: Vec2;

    constructor(p1: Vec2, p2: Vec2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    *iterPoints(): Generator<Vec2> {
        yield this.p1;
        yield this.p2;
    }

    /**
     * Returns specified point in _this_ segment
     */
    get(index: number): Vec2 {
        switch (index) {
            case 0:
                return this.p1;
            case 1:
                return this.p2;
            default:
                throw new RangeError(`'${index}' is out of bounds'`);
        }
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

    /**
     * Returns `true` if _this_ segment is completely outside of the rect defined by the
     * provided args, and `false` otherwise
     */
    outOfBounds(
        xMin: number,
        xMax: number,
        yMin: number,
        yMax: number
    ): boolean {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;

        return (
            (x1 < xMin && x2 < xMin) ||
            (x1 > xMax && x2 > xMax) ||
            (y1 < yMin && y2 < yMin) ||
            (y1 > yMax && y2 > yMax)
        );
    }

    /**
     * Returns `true` if _this_ segment is inside of the rect defined by the
     * provided args, and `false` otherwise
     */
    inBounds(xMin: number, xMax: number, yMin: number, yMax: number): boolean {
        return !this.outOfBounds(xMin, xMax, yMin, yMax);
    }

    intersectsPoly(poly: Polygon): boolean {
        for (const seg of poly.iterSegs()) {
            if (this.intersectsSeg(seg)) return true;
        }
        return false;
    }

    /**
     * Round _this_ segment's coordinates to the nearest int
     */
    round(): this {
        this.p1.round();
        this.p2.round();
        return this;
    }

    /**
     * Clips _this_ segment on the Y axis when below the provided `yMin`
     */
    clipNear(yMin: number): this {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;

        for (let p of this.iterPoints()) {
            if (p.y < yMin) {
                p.y = yMin;
                p.x = ((x2 - x1) / (y2 - y1)) * (yMin - y1) + x1;
            }
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

        for (let p of this.iterPoints()) {
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
