const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx0CQSWcZvPMFUdfb0NJj0QDuYH2FQuubVuu9gE3D6gf9lGSAM_i8dDOn5p2OKEZif5Og/exec";

export function sendLead(data: Record<string, unknown>) {
  if (!WEBHOOK_URL) return;

  fetch(WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data),
  }).catch(() => {});
}
