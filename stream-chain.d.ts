declare module "stream-chain" {
  import type { Readable } from "stream";

  type ChainItem =
    | NodeJS.ReadableStream
    | NodeJS.WritableStream
    | ((data: unknown) => unknown)
    | ((data: unknown) => Promise<unknown>);

  interface ChainOptions {
    writableObjectMode?: boolean;
    readableObjectMode?: boolean;
  }

  function chain(items: ChainItem[], options?: ChainOptions): Readable;

  export { chain };
}
