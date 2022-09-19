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

export class Wall {
    seg: Segment;
    textureCoords: Vec2[];
    height: number;
    zOffset: number;
    colour: Colour;
    distance: number;
    texture?: Texture;
    alpha?: number;

    constructor(
        seg: Segment,
        textureCoords: Vec2[],
        height: number,
        zOffset: number,
        colour: Colour,
        texture?: Texture,
        alpha?: number
    ) {
        this.seg = seg;
        this.textureCoords = textureCoords;
        this.height = height;
        this.zOffset = zOffset;
        this.colour = colour;
        this.distance = 0;

        this.texture = texture;
        this.alpha = alpha;
    }
}

export class Floor {
    points: Vec2[];
    textureCoords: Vec2[];
    indices: number[];
    zOffset: number;
    colour: Colour;
    distance: number;
    texture?: Texture;
    alpha?: number;

    constructor(
        points: Vec2[],
        textureCoords: Vec2[],
        indices: number[],
        zOffset: number,
        colour: Colour,
        texture?: Texture,
        alpha?: number
    ) {
        this.points = points;
        this.textureCoords = textureCoords;
        this.indices = indices;
        this.zOffset = zOffset;
        this.colour = colour;
        this.distance = 0;

        this.texture = texture;
        this.alpha = alpha;
    }
}
