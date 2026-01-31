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

declare module "stream-json/filters/Filter.js" {
  import { Transform } from "stream";

  interface FilterOptions {
    filter?: (stack: Array<string | number | null>, chunk?: unknown) => boolean;
    pathSeparator?: string;
    replacement?: unknown;
    allowEmptyReplacement?: boolean;
    streamValues?: boolean;
    streamKeys?: boolean;
    once?: boolean;
  }

  interface Filter extends Transform {
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  interface FilterConstructor {
    filter(options?: FilterOptions): Filter;
  }

  const Filter: FilterConstructor;
  export default Filter;
}
