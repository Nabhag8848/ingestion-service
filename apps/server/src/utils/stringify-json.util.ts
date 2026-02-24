import { z } from 'zod';

export const stringifyJson = <T>(schema: z.ZodType<T>, data: T): string => {
  // Validate data against schema before stringifying
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(
      `Validation failed: ${result.error.issues
        .map((issue) => issue.message)
        .join(', ')}`
    );
  }

  return JSON.stringify(result.data);
};
