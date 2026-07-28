export function fillTemplateTokens(
  body: string,
  contact: { firstName: string; company: string | null; industryDetail: string | null }
) {
  return body
    .replaceAll("{{firstName}}", contact.firstName)
    .replaceAll("{{company}}", contact.company ?? "")
    .replaceAll("{{industryDetail}}", contact.industryDetail ?? "");
}
