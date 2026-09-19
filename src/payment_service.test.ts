import test from "node:test";
import assert from "node:assert/strict";
import { chooseRoute, paymentEventSchema } from "./payment_service.ts";

test("high-value review events use the careful route", () => {
  const event = paymentEventSchema.parse({ eventId: "evt_1", customerId: "cus_1", amountCents: 100000, currency: "USD", country: "US", action: "approve" });
  assert.equal(chooseRoute(event), "careful");
});

test("ordinary approvals use the fast route", () => {
  const event = paymentEventSchema.parse({ eventId: "evt_2", customerId: "cus_2", amountCents: 1200, currency: "EUR", country: "DE", action: "approve" });
  assert.equal(chooseRoute(event), "fast");
});
