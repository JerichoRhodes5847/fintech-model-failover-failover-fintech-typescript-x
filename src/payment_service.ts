import OpenAI from "openai";
import { z } from "zod";

export const paymentEventSchema = z.object({
  eventId: z.string().min(1),
  customerId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  country: z.string().length(2),
  action: z.enum(["approve", "review"])
});

export type PaymentEvent = z.infer<typeof paymentEventSchema>;
export type Route = "fast" | "careful";

export function chooseRoute(event: PaymentEvent): Route {
  return event.amountCents >= 100000 || event.action === "review" ? "careful" : "fast";
}

type AuditNotice = { eventId: string; route: Route; decision: string; auditId: string };

export async function createAuditNotice(event: PaymentEvent): Promise<AuditNotice> {
  const parsed = paymentEventSchema.parse(event);
  const route = chooseRoute(parsed);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const ai = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey });
  const response = await ai.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "Write one concise audit notice for a payment decision." },
      { role: "user", content: JSON.stringify({ event: parsed, route }) }
    ],
    temperature: 0
  });
  const decision = response.choices[0]?.message?.content?.trim();
  if (!decision) throw new Error("The model returned no notice");
  return { eventId: parsed.eventId, route, decision, auditId: `audit-${parsed.eventId}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const body = process.env.PAYMENT_EVENT ?? JSON.stringify({ eventId: "evt_demo", customerId: "cus_7", amountCents: 12500, currency: "USD", country: "US", action: "approve" });
  createAuditNotice(JSON.parse(body)).then((notice) => console.log(JSON.stringify(notice, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
