import type { ParsedRecord } from "../domain/types.js";

export interface JsonReadOptions {
  continueOnError: boolean;
  onInvalid?: (index: number) => void;
}

function getInputStream(input: string): ReadableStream<Uint8Array> {
  const baseStream = input === "-" ? Bun.stdin.stream() : Bun.file(input).stream();
  if (input !== "-" && input.toLowerCase().endsWith(".gz")) {
    return baseStream.pipeThrough(new DecompressionStream("gzip"));
  }
  return baseStream;
}

async function readInputText(input: string): Promise<string> {
  const stream = getInputStream(input);
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
  }

  buffer += decoder.decode();
  return buffer;
}

export async function readJsonArray<T>(input: string): Promise<T[]> {
  const text = await readInputText(input);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array input");
  }
  return parsed as T[];
}


export async function* readJsonArrayStream<T>(
  input: string,
  options: JsonReadOptions,
): AsyncGenerator<ParsedRecord<T>> {
  const stream = getInputStream(input);
  const decoder = new TextDecoder();
  let buffer = "";
  let started = false;
  let collecting = false;
  let current = "";
  let itemDepth = 0;
  let inString = false;
  let escape = false;
  let index = 0;
  let done = false;

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let i = 0;
    while (i < buffer.length && !done) {
      const char = buffer[i];

      if (!started) {
        if (char === "[") {
          started = true;
        }
        i += 1;
        continue;
      }

      if (!collecting) {
        if (char === "]") {
          done = true;
          i += 1;
          continue;
        }
        if (char === "," || char.trim() === "") {
          i += 1;
          continue;
        }
        collecting = true;
        current = "";
        itemDepth = 0;
        inString = false;
        escape = false;
      }

      if (collecting) {
        if (inString) {
          current += char;
          if (escape) {
            escape = false;
          } else if (char === "\\") {
            escape = true;
          } else if (char === '"') {
            inString = false;
          }
          i += 1;
          continue;
        }

        if (char === '"') {
          inString = true;
          current += char;
          i += 1;
          continue;
        }

        if ((char === "," || char === "]") && itemDepth === 0) {
          const trimmed = current.trim();
          current = "";
          collecting = false;
          itemDepth = 0;
          if (trimmed.length > 0) {
            index += 1;
            try {
              const value = JSON.parse(trimmed) as T;
              yield { value, lineNumber: index };
            } catch (error) {
              if (!options.continueOnError) {
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(`Invalid JSON in array at index ${index}: ${message}`);
              }
              options.onInvalid?.(index);
              console.error(`Warning: invalid JSON in array at index ${index}, skipping.`);
            }
          }
          if (char === "]") {
            done = true;
          }
          i += 1;
          continue;
        }

        if (char === "{" || char === "[") {
          itemDepth += 1;
        } else if (char === "}" || char === "]") {
          if (itemDepth > 0) {
            itemDepth -= 1;
          }
        }

        current += char;
      }

      i += 1;
    }

    buffer = "";
  }

  if (collecting) {
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      index += 1;
      try {
        const value = JSON.parse(trimmed) as T;
        yield { value, lineNumber: index };
      } catch (error) {
        if (!options.continueOnError) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid JSON in array at index ${index}: ${message}`);
        }
        options.onInvalid?.(index);
        console.error(`Warning: invalid JSON in array at index ${index}, skipping.`);
      }
    }
  }
}

export async function detectJsonArrayInput(input: string): Promise<boolean> {
  const stream = getInputStream(input);
  const decoder = new TextDecoder();

  try {
    for await (const chunk of stream) {
      const text = decoder.decode(chunk, { stream: true });
      for (const char of text) {
        if (char.trim() === "") {
          continue;
        }
        return char === "[";
      }
    }
    return false;
  } catch {
    return false;
  }
}
