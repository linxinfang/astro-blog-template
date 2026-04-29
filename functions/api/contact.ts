interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();

    const name = String(formData.get("name") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
      return new Response("Missing required fields.", { status: 400 });
    }

    const html = `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\\n/g, "<br>")}</p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: context.env.CONTACT_FROM_EMAIL,
        to: context.env.CONTACT_TO_EMAIL,
        reply_to: email,
        subject: `New contact form from ${name}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return new Response(`Email send failed: ${errorText}`, { status: 500 });
    }

    return Response.redirect(new URL("/contact-success", context.request.url), 302);
  } catch (error) {
    return new Response("Server error.", { status: 500 });
  }
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
