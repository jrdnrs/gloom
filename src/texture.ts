export default class Texture {
    src: string;
    width: number;
    height: number;
    bytes: Uint8ClampedArray;

    private constructor(
        src: string,
        width: number,
        height: number,
        bytes: Uint8ClampedArray
    ) {
        this.src = src;
        this.bytes = bytes;
        this.width = width;
        this.height = height;
    }

    static async loadTexture(src: string, transpose = false): Promise<Texture> {
        const r = await fetch(src);
        if (!r.ok) {
            throw r.statusText;
        }
        const blob = await r.blob();
        const img = await createImageBitmap(blob);
        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = tmpCanvas.getContext("2d", { alpha: false })!;
        tmpCtx.drawImage(img, 0, 0);
        const bytes = tmpCtx.getImageData(0, 0, img.width, img.height).data;
        const texture = new Texture(src, img.width, img.height, bytes);
        if (transpose) texture.transpose();
        return texture;
    }

    transpose(): this {
        let transposed = new Uint8ClampedArray(this.bytes.length);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const readOffset = (y * this.width + (this.width - x)) * 4 - 4;
                const writeOffset = (x * this.height + y) * 4;
                transposed[writeOffset] = this.bytes[readOffset];
                transposed[writeOffset + 1] = this.bytes[readOffset + 1];
                transposed[writeOffset + 2] = this.bytes[readOffset + 2];
                transposed[writeOffset + 3] = this.bytes[readOffset + 3];
            }
        }

        this.bytes = transposed;
        [this.width, this.height] = [this.height, this.width];

        return this;
    }
}
