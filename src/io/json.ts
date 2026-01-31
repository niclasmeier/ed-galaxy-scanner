import { chain } from "stream-chain";
import { Readable } from "stream";
import { parser } from "stream-json";
import Filter from "stream-json/filters/Filter.js";
import { streamArray } from "stream-json/streamers/StreamArray.js";
import type { ParsedRecord } from "../domain/types.js";

export interface JsonReadOptions {
  continueOnError: boolean;
  onInvalid?: (index: number) => void;
}

const REQUIRED_FIELDS = new Set([
  "id64",
  "name",
  "coords",
  "population",
  "bodyCount",
  "allegiance",
  "bodies",
  "stations",
]);

function getInputStream(input: string): NodeJS.ReadableStream {
  const baseStream = input === "-" ? Bun.stdin.stream() : Bun.file(input).stream();
  const webStream =
    input !== "-" && input.toLowerCase().endsWith(".gz")
      ? baseStream.pipeThrough(new DecompressionStream("gzip"))
      : baseStream;

  return Readable.fromWeb(webStream as unknown as ReadableStream<Uint8Array>);
}

function createFieldFilter() {
  return Filter.filter({
    filter: (stack: Array<string | number | null>) => {
      if (stack.length <= 1) {
        return true;
      }

      const key = stack[1];
      if (typeof key !== "string") {
        return true;
      }

      return REQUIRED_FIELDS.has(key);
    },
  });
}


export async function* readJsonArrayStream<T>(
  input: string,
  options: JsonReadOptions,
): AsyncGenerator<ParsedRecord<T>> {
  const inputStream = getInputStream(input);
  const pipeline = chain([
    inputStream,
    parser(),
    createFieldFilter(),
    streamArray(),
  ]);

  let index = 0;

  try {
    for await (const item of pipeline) {
      const entry = item as { key: number; value: unknown };

      try {
        const system = entry.value as T;
        index += 1;
        yield { value: system, lineNumber: index };
      } catch (error) {
        if (!options.continueOnError) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid JSON in array at index ${index + 1}: ${message}`);
        }
        options.onInvalid?.(index + 1);
        console.error(`Warning: invalid system record in JSON array at index ${index + 1}, skipping.`);
        index += 1;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${message}`);
  }
}

export async function detectJsonArrayInput(input: string): Promise<boolean> {
  const inputStream = getInputStream(input);
  const pipeline = chain([inputStream, parser()]);

  try {
    for await (const token of pipeline) {
      const item = token as { name?: string };
      return item.name === "startArray";
    }
    return false;
  } catch {
    return false;
  }
}
