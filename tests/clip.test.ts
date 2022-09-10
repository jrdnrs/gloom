// import Segment from "../src/lib/maths/segment";
// import Vec2 from "../src/lib/maths/vec2";

// test("segmentClip", () => {
//     let seg = new Segment(new Vec2(-50, 20), new Vec2(300, 100));

//     seg.clipRect(0, 240, 0, 180);

//     expect(seg.p1.x).toBeCloseTo(0, 1);
//     expect(seg.p1.y).toBeCloseTo(31.4285714285714, 1);
//     expect(seg.p2.x).toBeCloseTo(240, 1);
//     expect(seg.p2.y).toBeCloseTo(86.2857142857143, 1);

//     seg = new Segment(
//         new Vec2(242.229784257969, 59.4425539355077),
//         new Vec2(-2.22978425796914, 59.4425539355077)
//     );
// });

// test("intersection", () => {
//     // parallel
//     let seg1 = new Segment(new Vec2(2, 5), new Vec2(25, 10));
//     let seg2 = new Segment(new Vec2(2, 20), new Vec2(25, 25));
//     let p = seg1.getIntersection(seg2);
//     expect(p).toBe(undefined);

//     // no intersection, but not parallel
//     seg1 = new Segment(new Vec2(2, 5), new Vec2(25, 10));
//     seg2 = new Segment(new Vec2(2, 15), new Vec2(25, 18));
//     p = seg1.getIntersection(seg2);
//     expect(p).toBe(undefined);

//     seg1 = new Segment(new Vec2(2, 5), new Vec2(25, 10));
//     seg2 = new Segment(new Vec2(2, 20), new Vec2(25, 0));
//     p = seg1.getIntersection(seg2);
//     expect(p?.x).toBeCloseTo(15.8);
//     expect(p?.y).toBeCloseTo(8);
// });
