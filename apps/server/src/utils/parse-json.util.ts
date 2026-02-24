import { z } from 'zod';

export const parseJson = <T>(
  schema: z.ZodType<T>,
  jsonString: string | null
): T | null => {
  if (!jsonString) {
    return null;
  }

  try {
    // Step 1: Parse JSON string to object
    const parsed = JSON.parse(jsonString);

    // Step 2: Validate the parsed object against schema
    const result = schema.safeParse(parsed);

    // Step 3: Return validated data or null
    return result.success ? result.data : null;
  } catch {
    // Invalid JSON or validation failed
    return null;
  }
};
