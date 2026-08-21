export const BOT_UA =
  /(bot|crawler|spider|slurp|curl|wget|headless|preview|facebookexternalhit|whatsapp|telegram|discord|bingbot|googlebot|twitterbot|linkedinbot|embedly|pingdom|Google-InspectionTool)/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return BOT_UA.test(userAgent ?? "");
}