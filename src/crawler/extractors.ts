import * as cheerio from "cheerio";

export function extractEmails(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  return Array.from(new Set(matches));
}

export function extractPhones(html: string): string[] {
  const phoneRegex = /(\+?\d[\d\s-]{7,}\d)/g;
  const matches = html.match(phoneRegex) || [];
  return Array.from(new Set(matches));
}

export function extractText(html: string): string {
  const $ = cheerio.load(html);
  return $("body").text().replace(/\s+/g, " ").trim();
}
