declare module 'image-clipper' {

    function Clipper(path: string, callback: (this: ClipperObject) => void);

    class ClipperObject {
        crop(x: number, y: number, width: number, height: number): ClipperObject;
        resize(width: number, height?: number): ClipperObject;
        toDataURL(quality: number, callback: (string) => void): ClipperObject;
        toDataURL(callback: (string) => void): ClipperObject;
        getCanvas(): HTMLCanvasElement
    }

    export = Clipper;
}
