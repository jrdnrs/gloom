import { Colour } from "./index";
import Segment from "./lib/maths/segment";

export default class Wall {
    seg: Segment;
    height: number;
    yOffset: number;
    colour: Colour;
    alpha?: number;
    distance: number;

    constructor(seg: Segment, height: number, yOffset: number, colour: Colour, alpha?: number) {
        this.seg = seg;
        this.height = height;
        this.yOffset = yOffset;
        this.colour = colour;
        this.distance = 0;
        if (alpha !== undefined) this.alpha = alpha;
    }
}
