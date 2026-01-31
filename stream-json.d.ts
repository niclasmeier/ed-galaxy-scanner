declare module "stream-json" {
  import { Transform } from "stream";

  interface Parser extends Transform {
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  function parser(): Parser;

  export { parser };
}

declare module "stream-json/streamers/StreamArray.js" {
  import { Transform } from "stream";

  interface StreamArrayItem {
    key: number;
    value: unknown;
  }

  interface StreamArray extends Transform {
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  function streamArray(): StreamArray;

  export { streamArray };
}
