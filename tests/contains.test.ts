import Quad from "../src/lib/maths/quad";
import Vec2 from "../src/lib/maths/vec2";

test("pointInPolygon", () => {
    let point = new Vec2(10, 10);

    let quad = new Quad(
        new Vec2(0, 0),
        new Vec2(20, 0),
        new Vec2(20, 20),
        new Vec2(0, 20)
    );

    expect(point.inPoly(quad)).toBe(true);

    point = new Vec2(100, 100);

    expect(point.inPoly(quad)).toBe(false);
});
