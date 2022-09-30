import type { Polygon } from "./poly";
import Segment from "./segment";

export default class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the normal of the vector which is perpendicular (rotated 90 degrees)
     */
    static normal(v: Vec2): Vec2 {
        return new Vec2(-v.y, v.x);
    }

    /**
     * Returns a new deep copy
     */
    copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalise(): this {
        const m = this.magnitude();
        if (m > 0) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }

    dot(rhs: Vec2): number {
        return this.x * rhs.x + this.y * rhs.y;
    }

    add(rhs: Vec2): this {
        this.x += rhs.x;
        this.y += rhs.y;
        return this;
    }

    sub(rhs: Vec2): this {
        this.x -= rhs.x;
        this.y -= rhs.y;
        return this;
    }

    addScalar(rhs: number): this {
        this.x += rhs;
        this.y += rhs;
        return this;
    }

    subScalar(rhs: number): this {
        this.x -= rhs;
        this.y -= rhs;
        return this;
    }

    mulScalar(rhs: number): this {
        this.x *= rhs;
        this.y *= rhs;
        return this;
    }

    divScalar(rhs: number): this {
        this.x /= rhs;
        this.y /= rhs;
        return this;
    }

    sqrt(): this {
        this.x = Math.sqrt(this.x);
        this.y = Math.sqrt(this.y);
        return this;
    }

    neg(): this {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    rotate(
        rad: number,
        sin: number = Math.sin(rad),
        cos: number = Math.cos(rad)
    ): this {
        const x = this.x;
        const y = this.y;
        this.x = cos * x - sin * y;
        this.y = sin * x + cos * y;
        return this;
    }

    round(): this {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
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
        return this.x < xMin || this.x > xMax || this.y < yMin || this.y > yMax;
    }

    /**
     * Returns `true` if _this_ segment is inside of the rect defined by the
     * provided args, and `false` otherwise
     */
    inBounds(xMin: number, xMax: number, yMin: number, yMax: number): boolean {
        return !this.outOfBounds(xMin, xMax, yMin, yMax);
    }

    /**
     * Returns `true` if _this_ point is inside the provided polygon, otherwise returns `false`.
     * If _this_ point shares coordinates with one of the polygon's points, result can vary
     */
    inPoly(poly: Polygon): boolean {
        // rough bounds check first
        if (
            this.outOfBounds(
                poly.getMinX(),
                poly.getMaxX(),
                poly.getMinY(),
                poly.getMaxY()
            )
        ) {
            return false;
        }

        const extendedPoint = new Segment(
            this,
            new Vec2(0, Number.MAX_SAFE_INTEGER)
        );
        let intersections = 0;

        for (const seg of poly.segments) {
            if (seg.intersectsSeg(extendedPoint)) intersections++;
        }

        return intersections % 2 === 1;
    }
}
