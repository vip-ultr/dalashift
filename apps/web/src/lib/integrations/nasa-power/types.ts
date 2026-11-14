import { z } from 'zod';

const powerParameterSchema = z.record(
  z.string(),
  z.record(z.string(), z.number().finite().nullable()),
);

export const powerDailyResponseSchema = z.object({
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.array(z.number().finite()).min(2),
  }),
  properties: z.object({
    parameter: powerParameterSchema,
    header: z.object({
      fill_value: z.number().finite(),
      time_standard: z.string(),
      sources: z.array(z.string()).optional(),
      api: z.object({ version: z.string().optional() }).optional(),
    }),
    parameters: z.record(
      z.string(),
      z.object({ units: z.string(), longname: z.string().optional() }),
    ),
    messages: z.array(z.string()).optional(),
  }),
});

export type PowerDailyResponse = z.infer<typeof powerDailyResponseSchema>;
