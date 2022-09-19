import type Vec2 from "./vec2";
import type Polygon from "./poly";
import Segment from "./segment";
import { Attributes } from "../../index";

export default class Triangle {
    p1: Vec2;
    p2: Vec2;
    p3: Vec2;
    s1: Segment;
    s2: Segment;
    s3: Segment;

    constructor(p1: Vec2, p2: Vec2, p3: Vec2) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.s1 = new Segment(this.p1, this.p2);
        this.s2 = new Segment(this.p2, this.p3);
        this.s3 = new Segment(this.p3, this.p1);
    }

    *iterPoints(): Generator<Vec2> {
        yield this.p1;
        yield this.p2;
        yield this.p3;
    }

    *iterSegs(): Generator<Segment> {
        yield this.s1;
        yield this.s2;
        yield this.s3;
    }

    /**
     * Returns specified point in _this_ triangle
     */
    get(index: number): Vec2 {
        switch (index) {
            case 0:
                return this.p1;
            case 1:
                return this.p2;
            case 2:
                return this.p3;
            default:
                throw new RangeError(`'${index}' is out of bounds'`);
        }
    }

    getMinX(): number {
        return Math.min(this.p1.x, this.p2.x, this.p3.x);
    }

    getMinY(): number {
        return Math.min(this.p1.y, this.p2.y, this.p3.y);
    }

    getMaxX(): number {
        return Math.max(this.p1.x, this.p2.x, this.p3.x);
    }

    getMaxY(): number {
        return Math.max(this.p1.y, this.p2.y, this.p3.y);
    }

    /**
     * Returns a new deep copy
     */
    copy(): Triangle {
        return new Triangle(this.p1.copy(), this.p2.copy(), this.p3.copy());
    }

    /**
     * Returns `true` if _this_ triangle is completely outside of the rect defined by the
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

        return (
            (x1 < xMin && x2 < xMin && x3 < xMin) ||
            (x1 > xMax && x2 > xMax && x3 > xMax) ||
            (y1 < yMin && y2 < yMin && y3 < yMin) ||
            (y1 > yMax && y2 > yMax && y3 > yMax)
        );
    }

    /**
     * Returns `true` if _this_ triangle is inside of the rect defined by the
     * provided args, and `false` otherwise
     */
    inBounds(xMin: number, xMax: number, yMin: number, yMax: number): boolean {
        return !this.outOfBounds(xMin, xMax, yMin, yMax);
    }

    intersectsPoly(poly: Polygon): boolean {
        for (const pSeg of poly.iterSegs()) {
            for (const tSeg of this.iterSegs()) {
                if (tSeg.intersectsSeg(pSeg)) return true;
            }
        }
        return false;
    }

    /**
     * Clips _this_ triangle at `yMin` and returns _this_ triangle and possibly one other _new_ triangle,
     * depending on the scenario.
     *
     * If possible, only _this_ triangle will be clipped, however, if only
     * one of the points is below `yMin` then clipping will form a quad. In this case, the quad is split
     * into two triangles.
     */
    clipNear(yMin: number): Triangle[] {
        if (this.p1.y >= yMin && this.p2.y >= yMin && this.p3.y >= yMin) {
            // entirely in front of the near plane, don't clip
            return [this];
        }

        let belowPoints: number[] = [];
        let abovePoints: number[] = [];
        let i = 0;

        for (const point of this.iterPoints()) {
            if (point.y < yMin) {
                belowPoints.push(i);
            } else {
                abovePoints.push(i);
            }
            i++;
        }

        switch (belowPoints.length) {
            case 1:
                // two triangles
                const triangle2 = this.copy();

                const triangle1FrontPoint = this.get(abovePoints[0]);
                const triangle2BehindPoint = triangle2.get(belowPoints[0]);
                // i don't love this, but it works to mutate this and triangle2's points via
                // the pointer given to the new segments
                new Segment(
                    triangle2.get(abovePoints[0]),
                    triangle2BehindPoint
                ).clipNear(yMin);
                new Segment(
                    this.get(abovePoints[1]),
                    this.get(belowPoints[0])
                ).clipNear(yMin);

                triangle1FrontPoint.x = triangle2BehindPoint.x;
                triangle1FrontPoint.y = triangle2BehindPoint.y;

                // basically we clip the left side for triangle 1 and the right side for triangle 2
                // then modify the top-right point of triangle 1 to be the bottom of triangle 2
                //
                // triangle 1        triangle 2
                //  ____               ____
                // |  /                \  |
                // | /                  \ |
                // |/                    \|

                return [this, triangle2];

            case 2:
                // just one triangle
                const frontPoint = this.get(abovePoints[0]);
                new Segment(frontPoint, this.get(belowPoints[0])).clipNear(
                    yMin
                );
                new Segment(frontPoint, this.get(belowPoints[1])).clipNear(
                    yMin
                );
                return [this];

            default:
                // must be that all three points are behind so
                // we have flattened the triangle onto yMin 0.0
                return [this];
        }
    }

    clipNearAttr(
        yMin: number,
        a: Attributes[]
    ): { triangles: Triangle[]; attributes: Attributes[][] } {
        if (this.p1.y >= yMin && this.p2.y >= yMin && this.p3.y >= yMin) {
            // entirely in front of the near plane, don't clip
            return { triangles: [this], attributes: [a] };
        }

        let belowPoints: number[] = [];
        let abovePoints: number[] = [];
        let i = 0;

        for (const point of this.iterPoints()) {
            if (point.y < yMin) {
                belowPoints.push(i);
            } else {
                abovePoints.push(i);
            }
            i++;
        }

        switch (belowPoints.length) {
            case 1:
                // two triangles - two points above, one point below
                const t2 = this.copy();
                const a2 = [{ ...a[0] }, { ...a[1] }, { ...a[2] }];

                const t1BelowPoint = this.get(belowPoints[0]);
                const t1AbovePoint1 = this.get(abovePoints[0]);
                const t1AbovePoint2 = this.get(abovePoints[1]);

                const t2BelowPoint = t2.get(belowPoints[0]);
                const t2AbovePoint1 = t2.get(abovePoints[0]);

                // i don't love this, but it works to mutate this and triangle2's points via
                // the pointer given to the new segments
                new Segment(t2AbovePoint1, t2BelowPoint).clipNearAttr(
                    yMin,
                    a2[abovePoints[0]],
                    a2[belowPoints[0]]
                );
                new Segment(t1AbovePoint2, t1BelowPoint).clipNearAttr(
                    yMin,
                    a[abovePoints[1]],
                    a[belowPoints[0]]
                );

                t1AbovePoint1.x = t2BelowPoint.x;
                t1AbovePoint1.y = t2BelowPoint.y;
                a[abovePoints[0]] = { ...a2[belowPoints[0]] };

                // basically we clip the left side for triangle 1 and the right side for triangle 2
                // then modify the top-right point of triangle 1 to be the bottom of triangle 2
                //
                // triangle 1        triangle 2
                //  ____               ____
                // |  /                \  |
                // | /                  \ |
                // |/                    \|

                return { triangles: [this, t2], attributes: [a, a2] };

            case 2:
                // just one triangle - one point above, two points below
                const abovePoint = this.get(abovePoints[0]);
                const belowPoint1 = this.get(belowPoints[0]);
                const belowPoint2 = this.get(belowPoints[1]);

                new Segment(abovePoint, belowPoint1).clipNearAttr(
                    yMin,
                    a[abovePoints[0]],
                    a[belowPoints[0]]
                );
                new Segment(abovePoint, belowPoint2).clipNearAttr(
                    yMin,
                    a[abovePoints[0]],
                    a[belowPoints[1]]
                );
                return { triangles: [this], attributes: [a] };

            default:
                // must be that all three points are behind so
                // we have flattened the triangle onto yMin 0.0
                return { triangles: [this], attributes: [a] };
        }
    }
}
