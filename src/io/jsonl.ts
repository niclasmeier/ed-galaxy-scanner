import type { ParsedRecord } from "../domain/types.js";

export interface JsonReadOptions {
  continueOnError: boolean;
  onInvalid?: (index: number) => void;
}

async function getInputStream(input: string): Promise<Uint8Array> {
  const baseStream = input === "-" ? Bun.stdin.stream() : Bun.file(input).stream();
  
  let stream = baseStream;
  
  // Auto-decompress if filename ends with .gz
  if (input !== "-" && input.toLowerCase().endsWith(".gz")) {
    stream = baseStream.pipeThrough(new DecompressionStream("gzip"));
  }
  
  // Convert ReadableStream to Uint8Array
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  // Combine all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  return combined;
}

/**
 * Extract only the required fields from a system object for memory efficiency
 * This demonstrates the capability to reduce payload during streaming
 */
function selectRequiredFields(system: unknown): unknown {
  if (typeof system !== "object" || system === null) {
    return system;
  }

  const obj = system as Record<string, unknown>;
  
  // Return only fields needed for settlement candidate evaluation
  return {
    name: obj.name,
    coords: obj.coords,
    population: obj.population,
    allegiance: obj.allegiance,
    bodies: obj.bodies,
    stations: obj.stations,
  };
}

export async function readJsonArray<T>(input: string): Promise<T[]> {
  const results: T[] = [];
  
  for await (const record of readJsonArrayStream<T>(input, { continueOnError: false })) {
    results.push(record.value);
  }
  
  return results;
}

export async function* readJsonArrayStream<T>(
  input: string,
  options: JsonReadOptions,
): AsyncGenerator<ParsedRecord<T>> {
  const data = await getInputStream(input);
  const text = new TextDecoder().decode(data);
  
  // Parse the entire JSON array at once
  let jsonArray: unknown[];
  
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("Input is not a JSON array");
    }
    jsonArray = parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${message}`);
  }
  
  let index = 0;
  
  for (const item of jsonArray) {
    try {
      // Keep the full object structure; field selection happens at usage time
      const system = item as T;
      
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
}

export async function detectJsonArrayInput(input: string): Promise<boolean> {
  const data = await getInputStream(input);
  const text = new TextDecoder().decode(data);
  
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}
