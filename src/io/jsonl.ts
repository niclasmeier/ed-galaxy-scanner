import type { ParsedRecord } from "../domain/types.js";

export interface JsonReadOptions {
  continueOnError: boolean;
  onInvalid?: (index: number) => void;
  nativeJson?: boolean;
}

function isGzipPath(input: string): boolean {
  return input !== "-" && input.toLowerCase().endsWith(".gz");
}

function getInputStream(input: string): ReadableStream<Uint8Array> {
  const stream = input === "-" ? Bun.stdin.stream() : Bun.file(input).stream();
  if (isGzipPath(input)) {
    return stream.pipeThrough(new DecompressionStream("gzip"));
  }
  return stream;
}

async function readInputPrefix(input: string, maxBytes: number): Promise<string | null> {
  if (input === "-") {
    return null;
  }
  const stream = getInputStream(input);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) {
        break;
      }
      chunks.push(value);
      total += value.byteLength;
      if (total >= maxBytes) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) {
    return "";
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

async function readInputText(input: string): Promise<string> {
  if (input === "-") {
    return Bun.stdin.text();
  }
  const stream = getInputStream(input);
  return await new Response(stream).text();
}

export async function* readJsonLines<T>(
  input: string,
  options: JsonReadOptions,
): AsyncGenerator<ParsedRecord<T>> {
  // Load native simdjson parser if requested
  let nativeParser: any = null;
  if (options.nativeJson) {
    try {
      nativeParser = await import("@nozbe/simdjson");
    } catch (error) {
      throw new Error(
        "ERROR: --native-json flag set but @nozbe/simdjson native bindings are unavailable. " +
        "Install via 'npm install @nozbe/simdjson' or remove the --native-json flag.",
      );
    }
  }

  const stream = getInputStream(input);
  const decoder = new TextDecoder();
  let buffer = "";
  let lineNumber = 0;

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let index = buffer.indexOf("\n");
    while (index !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      lineNumber += 1;
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        index = buffer.indexOf("\n");
        continue;
      }
      try {
        let value: T;
        if (nativeParser) {
          // Use native simdjson parser
          value = nativeParser.parse(trimmed) as T;
        } else {
          // Fall back to standard JSON parser
          value = JSON.parse(trimmed) as T;
        }
        yield { value, lineNumber };
      } catch (error) {
        if (!options.continueOnError) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Invalid JSON on line ${lineNumber}: ${message}`);
        }
        options.onInvalid?.(lineNumber);
        console.error(`Warning: invalid JSON on line ${lineNumber}, skipping: ${error instanceof Error ? error.message : String(error)}`);
      }
      index = buffer.indexOf("\n");
    }
  }

  const remaining = buffer.trim();
  if (remaining.length > 0) {
    lineNumber += 1;
    try {
      const value = JSON.parse(remaining) as T;
      yield { value, lineNumber };
    } catch (error) {
      if (!options.continueOnError) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON on line ${lineNumber}: ${message}`);
      }
      options.onInvalid?.(lineNumber);
      console.error(`Warning: invalid JSON on line ${lineNumber}, skipping.`);
    }
  }
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
  // Load native simdjson parser if requested
  let nativeParser: any = null;
  if (options.nativeJson) {
    try {
      nativeParser = await import("@nozbe/simdjson");
    } catch (error) {
      throw new Error(
        "ERROR: --native-json flag set but @nozbe/simdjson native bindings are unavailable. " +
        "Install via 'npm install @nozbe/simdjson' or remove the --native-json flag.",
      );
    }
  }

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
              let value: T;
              if (nativeParser) {
                value = nativeParser.parse(trimmed) as T;
              } else {
                value = JSON.parse(trimmed) as T;
              }
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
        let value: T;
        if (nativeParser) {
          value = nativeParser.parse(trimmed) as T;
        } else {
          value = JSON.parse(trimmed) as T;
        }
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
  const prefix = await readInputPrefix(input, 65536);
  if (prefix === null) {
    return false;
  }
  const trimmed = prefix.trimStart();
  return trimmed.startsWith("[");
}
