import "server-only";

/**
 * Operator details for the imprint and privacy policy, read from env at
 * runtime so self-hosters show their own details. Without LEGAL_NAME,
 * LEGAL_ADDRESS and LEGAL_EMAIL the legal pages and footer links are off.
 * Callers must opt into request time first (`await connection()`), otherwise
 * the build would bake in the build-time environment.
 */
export type LegalInfo = {
  name: string;
  /** Lines, from LEGAL_ADDRESS split at "|" or newlines. */
  address: string[];
  email: string;
  phone?: string;
  /** Free text shown in the imprint, e.g. "Kleinunternehmer gemäß § 19 UStG". */
  note?: string;
  /** Hosting provider incl. address, for the privacy policy. */
  hosting?: string;
  /** Competent data protection authority, for the privacy policy. */
  authority?: string;
};

export function getLegalInfo(): LegalInfo | null {
  const env = process.env;
  const name = env.LEGAL_NAME?.trim();
  const address = env.LEGAL_ADDRESS?.split(/\||\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const email = env.LEGAL_EMAIL?.trim();
  if (!name || !address?.length || !email) return null;
  return {
    name,
    address,
    email,
    phone: env.LEGAL_PHONE?.trim() || undefined,
    note: env.LEGAL_NOTE?.trim() || undefined,
    hosting: env.LEGAL_HOSTING?.trim() || undefined,
    authority: env.LEGAL_AUTHORITY?.trim() || undefined,
  };
}
