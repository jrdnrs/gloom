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
    points: Vec2[];
    segments: Segment[];

    constructor(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
        this.s1 = new Segment(this.p1, this.p2);
        this.s2 = new Segment(this.p2, this.p3);
        this.s3 = new Segment(this.p3, this.p4);
        this.s4 = new Segment(this.p4, this.p1);
        this.points = [this.p1, this.p2, this.p3, this.p4];
        this.segments = [this.s1, this.s2, this.s3, this.s4];
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

}
