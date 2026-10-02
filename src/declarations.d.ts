declare module 'heic-decode' {
  interface DecodeOptions {
    buffer: Uint8Array | ArrayBuffer;
    all?: boolean;
  }

  interface DecodedImage {
    width: number;
    height: number;
    data: Uint8ClampedArray | ArrayBuffer;
  }

  function decode(options: DecodeOptions): Promise<DecodedImage>;

  namespace decode {
    function all(options: DecodeOptions): Promise<Array<{
      width: number;
      height: number;
      decode: () => Promise<DecodedImage>;
    }>>;
  }

  export default decode;
}

declare module 'libheif-js' {
  const libheif: any;
  export default libheif;
}

declare module 'libheif-js/wasm-bundle' {
  const wasmBundle: any;
  export default wasmBundle;
}
