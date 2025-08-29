declare module 'dom-to-image-more' {
  interface Options {
    filter?: (node: Node) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: any;
    quality?: number;
  }

  function toPng(node: Node, options?: Options): Promise<string>;
  function toJpeg(node: Node, options?: Options): Promise<string>;
  function toBlob(node: Node, options?: Options): Promise<Blob>;
  function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
  function toSvg(node: Node, options?: Options): Promise<string>;

  export default {
    toPng,
    toJpeg,
    toBlob,
    toPixelData,
    toSvg
  };
}