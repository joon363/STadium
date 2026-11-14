import type { Language } from '../context/LanguageContext';

export const BILINGUAL_DELIMITER = ' ||| ';

export interface BilingualValue {
  ko: string;
  en: string;
}

/**
 * Combines Korean and English text using the schema-compatible bilingual delimiter.
 * Omits the delimiter when English is empty or identical to Korean.
 */
export function encodeBilingual(ko: string, en?: string): string {
  const cleanKo = (ko ?? '').trim();
  const cleanEn = (en ?? '').trim();
  if (!cleanKo && !cleanEn) return '';
  if (!cleanEn || cleanEn === cleanKo) return cleanKo;
  return `${cleanKo}${BILINGUAL_DELIMITER}${cleanEn}`;
}

/**
 * Splits a stored bilingual field into `{ ko, en }`.
 * Handles legacy plain Korean strings gracefully (`en: ''`).
 */
export function parseBilingual(raw?: string | null): BilingualValue {
  if (!raw) return { ko: '', en: '' };
  const idx = raw.indexOf(BILINGUAL_DELIMITER);
  if (idx !== -1) {
    return {
      ko: raw.slice(0, idx).trim(),
      en: raw.slice(idx + BILINGUAL_DELIMITER.length).trim(),
    };
  }
  const alt = raw.match(/^([\s\S]*?)\s*\|\|\|\s*([\s\S]*)$/);
  if (alt) {
    return { ko: alt[1].trim(), en: alt[2].trim() };
  }
  return { ko: raw, en: '' };
}

const KNOWN_VENUE_MAP: Record<string, string> = {
  대운동장: 'Main Field',
  체육관: 'Gymnasium',
  'POSTECH 체육관': 'POSTECH Gymnasium',
  포스텍체육관: 'POSTECH Gymnasium',
  대강당: 'Auditorium',
  'POSTECH 대강당': 'POSTECH Auditorium',
  경기장: 'Main Venue',
  학생회관: 'Student Union',
  무은재기념관: 'Mueunjae Memorial Hall',
  노천극장: 'Outdoor Amphitheater',
  청암학술정보관: 'Tae-Joon Park Digital Library',
  정보통신연구소: 'PIRL',
  운동장: 'Athletic Field',
  축구장: 'Soccer Field',
  야구장: 'Baseball Field',
  농구장: 'Basketball Court',
  배드민턴장: 'Badminton Court',
  'e-Sports 경기장': 'e-Sports Arena',
  '학생회관 아틀라스홀': 'Student Union Atlas Hall',
};

const KNOWN_CATEGORY_MAP: Record<string, string> = {
  밴드: 'Band',
  댄스: 'Dance',
  힙합: 'Hip-hop',
  보컬: 'Vocal',
  응원단: 'Cheerleading',
  마술: 'Magic',
  기타: 'Other',
  문화공연: 'Cultural Stage',
  '공연 준비중': 'Performance TBD',
  '등록된 공연 정보가 없습니다': 'No stage performances scheduled yet.',
  '공연 대기중': 'Waiting for stage',
  일반: 'General',
  '경기/관람': 'Matches & Viewing',
  '공연/무대': 'Stage & Performances',
  '부스/푸드': 'Booths & Food',
  '시설/위치': 'Facilities & Map',
  '안전/응급': 'Safety & First Aid',
  체험: 'Experience',
  '체험 부스': 'Experience',
  음식: 'Food & Drinks',
  '음식/식음': 'Food & Drinks',
  이벤트: 'Event',
  홍보: 'Promotion',
  굿즈: 'Merchandise',
  '총괄': 'Head Organizing Committee',
  '부문별 운영진': 'Section Directors',
  '시간 미정': 'Time TBD',
  일정: 'Schedule',
  '경기 일정 준비중': 'Schedule TBD',
  '일정 준비중': 'TBD',
};

const KNOWN_SCHOOL_MAP: Record<string, string> = {
  포항공과대학교: 'POSTECH',
  한국과학기술원: 'KAIST',
  광주과학기술원: 'GIST',
  대구경북과학기술원: 'DGIST',
  울산과학기술원: 'UNIST',
  한국에너지공과대학교: 'KENTECH',
};

export function localizeRoundName(raw: string, language: Language): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') return ko || en;
  if (en) return en;
  const s = ko.trim();
  if (!s) return '';
  if (KNOWN_CATEGORY_MAP[s]) return KNOWN_CATEGORY_MAP[s];

  // 3rd / 4th place match
  if (/3\s*[·,.~-]?\s*4위/.test(s)) {
    return '3rd Place Match';
  }
  // Quarterfinals / Preliminaries: 예선 1경기, 예선1, 8강 2경기, 6강 1
  const prelim = s.match(/^(예선|8강|6강)\s*(\d+)?\s*(경기)?$/);
  if (prelim) {
    const label = prelim[1] === '6강' ? 'Round of 6' : 'Quarterfinals';
    if (prelim[2]) return `${label} ${prelim[3] ? 'Game ' : ''}${prelim[2]}`;
    return label;
  }
  // Semifinals: 본선 1경기, 본선1, 준결승 1경기, 준결선, 4강 1경기
  const semi = s.match(/^(본선|준결승|준결선|4강)\s*(\d+)?\s*(경기)?$/);
  if (semi) {
    if (semi[2]) return `Semifinals ${semi[3] ? 'Game ' : ''}${semi[2]}`;
    return 'Semifinals';
  }
  // Finals
  if (/^(결승전?|결선)$/.test(s)) {
    return 'Finals';
  }
  return s;
}

export function localizeTeamPlaceholder(raw: string, language: Language): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') return ko || en;
  if (en) return en;
  const s = ko.trim();
  if (!s) return '';
  if (KNOWN_SCHOOL_MAP[s]) return KNOWN_SCHOOL_MAP[s];

  const teamNum = s.match(/^팀\s*(\d+)$/);
  if (teamNum) return `Team ${teamNum[1]}`;

  // "[Round] 승자" or "[Round] 패자" or "예선1 승자"
  const placeholder = s.match(/^(.+?)\s*(승자|패자)$/);
  if (placeholder) {
    const baseRound = localizeRoundName(placeholder[1].trim(), 'en');
    return `${baseRound} ${placeholder[2] === '패자' ? 'Loser' : 'Winner'}`;
  }

  return s;
}

export function localizeVenueName(raw: string, language: Language): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') return ko || en;
  if (en) return en;
  const s = ko.trim();
  if (!s) return '';
  if (KNOWN_VENUE_MAP[s]) return KNOWN_VENUE_MAP[s];

  // Fallback partial replacements for compound names like "체육관 1코트"
  let out = s;
  for (const [k, v] of Object.entries(KNOWN_VENUE_MAP)) {
    if (out.includes(k)) {
      out = out.replace(k, v);
    }
  }
  out = out.replace(/(\d+)\s*코트/g, 'Court $1').replace(/(\d+)\s*구장/g, 'Field $1');
  return out;
}

export function localizeStageCategory(raw: string, language: Language): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') return ko || en;
  if (en) return en;
  return KNOWN_CATEGORY_MAP[ko.trim()] || ko;
}

export function localizeFaqCategory(raw: string, language: Language): string {
  return localizeStageCategory(raw, language);
}

export function localizeBoothCategory(raw: string, language: Language): string {
  return localizeStageCategory(raw, language);
}

export function localizeTimeRangeText(raw: string, language: Language): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') return ko || en;
  if (en) return en;
  return KNOWN_CATEGORY_MAP[ko.trim()] || ko;
}

/**
 * Returns the localized display text from a bilingual field or plain Korean field,
 * optionally applying a domain fallback translator when English text hasn't been provided.
 */
export function getLocalizedValue(
  raw?: string | null,
  language: Language = 'ko',
  fallbackTranslator?: (ko: string) => string
): string {
  const { ko, en } = parseBilingual(raw);
  if (language === 'ko') {
    return ko || en;
  }
  if (en) return en;
  if (!ko) return '';
  if (fallbackTranslator) return fallbackTranslator(ko);
  return KNOWN_CATEGORY_MAP[ko.trim()] || KNOWN_VENUE_MAP[ko.trim()] || KNOWN_SCHOOL_MAP[ko.trim()] || ko;
}
