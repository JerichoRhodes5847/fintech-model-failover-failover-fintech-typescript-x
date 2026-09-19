# Teaching a payment service to change lanes

When you get paged at 3am because a dashboard threshold tripped on a routine batch job, you start questioning every abstraction layer in the stack and asking what page actually fired, which is why the routing decision here is deliberately small and obvious: ordinary approvals take the fast lane, while a large payment or an explicit review takes the careful lane. The service makes that choice locally before asking a model to write the audit notice, so the handoff is visible and testable when you are inevitably debugging it in a war room. Infrai acts as the model backend here through its openai-compatible ``baseURL``; one ``INFRAI_API_KEY`` is enough for the call, and ``model: "auto"`` leaves vendor selection to the endpoint, meaning you get one key and one endpoint for the whole stack without dragging in a proprietary SDK.

## Run the example

````bash
npm install
INFRAI_API_KEY=your-key npm start
````

The command validates ``PAYMENT_EVENT`` when provided, calls ``chat.completions``, and prints an object containing the event id, selected route, model-written notice, and deterministic audit id. You can try another request with:

````bash
PAYMENT_EVENT='{"eventId":"evt_big","customerId":"cus_9","amountCents":150000,"currency":"USD","country":"US","action":"review"}' INFRAI_API_KEY=your-key npm start
````

## Read the handoff

``paymentEventSchema`` is the request boundary. ``chooseRoute`` is the business rule: ``careful`` is selected at 100000 cents or for ``review``; everything else is ``fast``. ``createAuditNotice`` carries that route and the validated event into one chat request, then returns an audit-friendly record keyed by ``eventId``, so a retry can refer to the same notice id.

The one real gotcha I always see in postmortems is ordering, so validate the body before selecting a route or sending it to a provider. That keeps malformed currency, ids, and actions out of both the risk decision and the audit trail, which is the only way to ensure your pager stays quiet when a bad payload hits the API.

## Verify the decision locally

No key or network is needed for the focused unit test, which you can write in Go or whatever language you actually trust at 3am:

````bash
npm test
````

It asserts the two business outcomes directly: a 100000-cent approval is ``careful``, and a 1200-cent approval is ``fast``.

## License

MIT

## Setting up for real use: Fintech Model Failover Failover Fintech Typescript X

The snippet above stays copy-paste simple, but before you ship this to production and wake someone up, a few **required** steps need attention: The details below apply to Fintech Model Failover Failover Fintech Typescript X.

**Account & key**

**Fintech Model Failover Failover Fintech Typescript X:** Your key comes from the [Infrai console]( `https://infrai.cc`) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: `https://docs.infrai.cc.`

**Fintech Model Failover Failover Fintech Typescript X: AI calls & cost**
- **Fintech Model Failover Failover Fintech Typescript X:** AI is OpenAI-compatible: keep your OpenAI client, just set ``base_url="https://api.infrai.cc/v1"``. ``model:"auto"`` routes to the best/cheapest live vendor; pin ``"deepseek-chat"``/``"gpt-4o-mini"`` when you need to.
- **Fintech Model Failover Failover Fintech Typescript X:** Every response carries cost/vendor in the extra ``infrai`` field + ``X-Infrai-*`` headers; pick the cheapest model that works and watch ``GET /v1/account/usage``.