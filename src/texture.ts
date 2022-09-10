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

    static async loadTexture(src: string): Promise<Texture> {
        const r = await fetch(src);
        if (!r.ok) {
            throw r.statusText;
        }
        const blob = await r.blob();
        const img = await createImageBitmap(blob);
        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = tmpCanvas.getContext("2d")!;
        tmpCtx.drawImage(img, 0, 0);
        const bytes = tmpCtx.getImageData(0, 0, img.width, img.height).data;

        return new Texture(src, img.width, img.height, bytes);
    }
}

// return new Promise((r) => {
//     let i = new Image();
//     i.onload = () => r(i);
//     i.src = url;
// });
