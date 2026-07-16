import axiosSecure from "./axiosSecure";

/**
 * Gateway-agnostic payment helpers.
 *
 * The frontend NEVER knows which gateway is live. It calls initiatePayment()
 * and then simply follows the `flow` the backend returns:
 *   - "instant"       -> already done (fake gateway); use `result`.
 *   - "redirect_post" -> auto-submit `checkout` to the gateway (PayU).
 */

/**
 * Start a payment.
 * @param {{purpose:"BOOKING"|"SUBSCRIPTION", booking_id?:string, plan_uuid?:string}} payload
 * @returns {Promise<{flow:string, payment?:object, result?:object, checkout?:{action_url:string, params:object}}>}
 */
export async function initiatePayment(payload) {
  const res = await axiosSecure.post("/v1/payments/initiate/", payload);
  return res.data;
}

/**
 * Redirect the browser to the hosted checkout page by auto-submitting a form.
 * (Works for PayU and any future redirect_post gateway — same shape.)
 * @param {{action_url:string, params:object}} checkout
 */
export function redirectToGateway(checkout) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.action_url;
  form.style.display = "none";

  Object.entries(checkout.params || {}).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Poll a payment's status (used on the return page after a redirect).
 * @param {string} paymentUuid
 * @param {{intervalMs?:number, timeoutMs?:number}} opts
 * @returns {Promise<object>} the final payment payload
 */
export async function pollPaymentStatus(
  paymentUuid,
  { intervalMs = 2000, timeoutMs = 30000 } = {}
) {
  const deadline = Date.now() + timeoutMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await axiosSecure.get(`/v1/payments/status/${paymentUuid}/`);
    const data = res.data;
    if (data.status === "SUCCESS" || data.status === "FAILED") return data;
    if (Date.now() > deadline) return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
