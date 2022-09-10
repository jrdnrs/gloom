import type Vec2 from "./vec2";
import Segment from "./segment";

export default class Quad {
    p1: Vec2;
    p2: Vec2;
    p3: Vec2;
    p4: Vec2;
    s1: Segment;
    s2: Segment;
    s3: Segment;
    s4: Segment;

    constructor(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.s1 = new Segment(this.p1, this.p2);
        this.s2 = new Segment(this.p2, this.p3);
        this.s3 = new Segment(this.p3, this.p4);
        this.s4 = new Segment(this.p4, this.p1);
    }

    *iterPoints(): Generator<Vec2> {
        yield this.p1;
        yield this.p2;
        yield this.p3;
        yield this.p4;
    }

    *iterSegs(): Generator<Segment> {
        yield this.s1;
        yield this.s2;
        yield this.s3;
        yield this.s4;
    }

    getMinX(): number {
        return Math.min(this.p1.x, this.p2.x, this.p3.x, this.p4.x);
    }

    getMinY(): number {
        return Math.min(this.p1.y, this.p2.y, this.p3.y, this.p4.y);
    }

    getMaxX(): number {
        return Math.max(this.p1.x, this.p2.x, this.p3.x, this.p4.x);
    }

    getMaxY(): number {
        return Math.max(this.p1.y, this.p2.y, this.p3.y, this.p4.y);
    }

    /**
     * Returns `true` if _this_ quad is completely outside of the rect defined by the
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
        const x3 = this.p3.x;
        const y3 = this.p3.y;
        const x4 = this.p4.x;
        const y4 = this.p4.y;

        return (
            (x1 < xMin && x2 < xMin && x3 < xMin && x4 < xMin) ||
            (x1 > xMax && x2 > xMax && x3 > xMax && x4 > xMax) ||
            (y1 < yMin && y2 < yMin && y3 < yMin && y4 < yMin) ||
            (y1 > yMax && y2 > yMax && y3 > yMax && y4 > yMax)
        );
    }

    /**
     * Returns `true` if _this_ quad is inside of the rect defined by the
     * provided args, and `false` otherwise
     */
    inBounds(xMin: number, xMax: number, yMin: number, yMax: number): boolean {
        return !this.outOfBounds(xMin, xMax, yMin, yMax);
    }
}
