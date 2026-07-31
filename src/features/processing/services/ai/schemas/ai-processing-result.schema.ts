import { z } from "zod";

export const aiProcessingResultSchema = z.object({
  version: z.literal(1),
  summary: z.string(),
  keywords: z.array(z.string()),
});
