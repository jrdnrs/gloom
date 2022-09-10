import type Segment from "./segment";
import type Vec2 from "./vec2";

export default interface Polygon {
    iterPoints(): Generator<Vec2>;
    iterSegs(): Generator<Segment>;
    getMinX(): number;
    getMinY(): number;
    getMaxX(): number;
    getMaxY(): number;
    outOfBounds(
        xMin: number,
        xMax: number,
        yMin: number,
        yMax: number
    ): boolean;
    inBounds(xMin: number, xMax: number, yMin: number, yMax: number): boolean;
}
