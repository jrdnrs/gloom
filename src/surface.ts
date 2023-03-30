import { Poly } from "./lib/maths/poly";
import type Segment from "./lib/maths/segment";
import type Vec2 from "./lib/maths/vec2";
import type Texture from "./texture";

/**
 * @param rgb must be an integer between 0 and 255
 **/
export type Colour = {
    r: number;
    g: number;
    b: number;
};

export const RED = {
    r: 192,
    g: 64,
    b: 64,
};

export const GREEN = {
    r: 64,
    g: 192,
    b: 64,
};

export const BLUE = {
    r: 64,
    g: 64,
    b: 192,
};

export const YELLOW = {
    r: 192,
    g: 192,
    b: 64,
};

export const MAGENTA = {
    r: 192,
    g: 64,
    b: 192,
};

export class Thing {
    point: Vec2;
    textureCoords: Vec2[];
    width: number;
    height: number;
    zOffset: number;
    colour: Colour;
    distance: number;
    alpha: boolean;
    texture?: Texture;

    constructor(
        point: Vec2,
        textureCoords: Vec2[],
        width: number,
        height: number,
        zOffset: number,
        colour: Colour,
        alpha: boolean,
        texture?: Texture,
    ) {
        this.point = point;
        this.textureCoords = textureCoords;
        this.width = width;
        this.height = height;
        this.zOffset = zOffset;
        this.colour = colour;
        this.distance = 0;

        this.alpha = alpha;
        this.texture = texture;
    }
}

export class Wall {
    seg: Segment;
    textureCoords: Vec2[];
    height: number;
    zOffset: number;
    colour: Colour;
    distance: number;
    alpha: boolean;
    texture?: Texture;

    constructor(
        seg: Segment,
        textureCoords: Vec2[],
        height: number,
        zOffset: number,
        colour: Colour,
        alpha: boolean,
        texture?: Texture,
    ) {
        this.seg = seg;
        this.textureCoords = textureCoords;
        this.height = height;
        this.zOffset = zOffset;
        this.colour = colour;
        this.distance = 0;

        this.alpha = alpha;
        this.texture = texture;
    }
}

export class Floor {
    poly: Poly;
    points: Vec2[];
    textureCoords: Vec2[];
    indices: number[];
    zOffset: number;
    colour: Colour;
    distance: number;
    alpha: boolean;
    texture?: Texture;

    constructor(
        points: Vec2[],
        textureCoords: Vec2[],
        indices: number[],
        zOffset: number,
        colour: Colour,
        alpha: boolean,
        texture?: Texture,
    ) {
        this.points = points;
        this.poly = new Poly(this.points);
        this.textureCoords = textureCoords;
        this.indices = indices;
        this.zOffset = zOffset;
        this.colour = colour;
        this.distance = 0;

        this.alpha = alpha;
        this.texture = texture;
    }
}
