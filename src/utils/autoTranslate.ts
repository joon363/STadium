import {
  encodeBilingual,
  localizeRoundName,
  localizeStageCategory,
  localizeTeamPlaceholder,
  localizeVenueName,
  parseBilingual,
} from './bilingual';

const HANGUL_REGEX = /[가-힣]/;

export function containsHangul(text?: string | null): boolean {
  return Boolean(text && HANGUL_REGEX.test(text));
}

function tryDomainGlossary(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const stageCat = localizeStageCategory(trimmed, 'en');
  if (stageCat !== trimmed && !containsHangul(stageCat)) return stageCat;

  const round = localizeRoundName(trimmed, 'en');
  if (round !== trimmed && !containsHangul(round)) return round;

  const team = localizeTeamPlaceholder(trimmed, 'en');
  if (team !== trimmed && !containsHangul(team)) return team;

  const venue = localizeVenueName(trimmed, 'en');
  if (venue !== trimmed && !containsHangul(venue)) return venue;

  return null;
}

/**
 * Translates Korean text to natural English via Google Translate's public endpoint
 * while preserving URLs, markdown link targets, and line breaks.
 * Falls back safely to domain glossary / original text if offline or rate-limited.
 */
export async function translateKoToEn(text: string): Promise<string> {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  if (!containsHangul(trimmed)) return trimmed;

  const glossaryHit = tryDomainGlossary(trimmed);
  if (glossaryHit) return glossaryHit;

  // Preserve URLs (both inside markdown `[label](url)` and standalone `https://...`)
  const urlTokens: string[] = [];
  const prepared = trimmed
    .replace(/\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_m, url: string) => {
      const idx = urlTokens.push(url) - 1;
      return `](__URL_${idx}__)`;
    })
    .replace(/(https?:\/\/[^\s)]+)/g, (url: string) => {
      const idx = urlTokens.push(url) - 1;
      return `__URL_${idx}__`;
    });

  try {
    const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(prepared)}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return trimmed;
    }

    let translated = (data[0] as unknown[][])
      .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
      .join('')
      .trim();

    // Restore preserved URLs and clean up spaces that MT occasionally inserts inside `[label] (url)`
    urlTokens.forEach((url, idx) => {
      const tokenRegex = new RegExp(`__URL_\\s*${idx}\\s*__`, 'g');
      translated = translated.replace(tokenRegex, url);
    });
    translated = translated.replace(/\]\s+\((https?:\/\/|\/)/g, ']($1');

    return translated || trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Convenience helper for Admin save flows:
 * If Korean text is non-empty and English text is empty, translates Korean -> English automatically.
 */
export async function ensureEnglishTranslation(ko: string, en?: string): Promise<string> {
  const cleanEn = (en ?? '').trim();
  if (cleanEn) return cleanEn;
  const cleanKo = (ko ?? '').trim();
  if (!cleanKo) return '';
  return translateKoToEn(cleanKo);
}

/**
 * Ensures any bilingual field saved from Admin has an English translation
 * whenever Korean text was entered and the English field was left empty.
 */
export async function finalizeBilingualText(raw?: string | null): Promise<string> {
  const { ko, en } = parseBilingual(raw);
  if (!ko) return en ? encodeBilingual('', en) : '';
  if (en) return encodeBilingual(ko, en);
  const translated = await translateKoToEn(ko);
  return encodeBilingual(ko, translated);
}
