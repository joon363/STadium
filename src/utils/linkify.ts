export interface TextPart {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

export function parseLinks(text: string): TextPart[] {
  if (!text) return [];

  // 1. Markdown link: [label](url)
  // 2. Full URL: https://... or http://...
  // 3. www. URL: www.example.com...
  const regex = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    if (match[1] && match[2]) {
      // Markdown link: [label](url)
      const label = match[1];
      let url = match[2].trim();
      if (!/^https?:\/\/|^mailto:|^tel:/i.test(url)) {
        url = 'https://' + url;
      }
      parts.push({
        type: 'link',
        content: label,
        url,
      });
    } else if (match[3]) {
      // Standalone URL
      let rawUrl = match[3];
      let trailing = '';

      // 1. Strip trailing punctuation like .,!?:;)
      const trailPunct = rawUrl.match(/[.,!?:;]+$/);
      if (trailPunct) {
        trailing = trailPunct[0] + trailing;
        rawUrl = rawUrl.slice(0, -trailPunct[0].length);
      }

      // 2. If URL ends with ')' and there was no unmatched '(', strip it
      if (rawUrl.endsWith(')') && !rawUrl.includes('(')) {
        trailing = ')' + trailing;
        rawUrl = rawUrl.slice(0, -1);
      }

      // 3. If the URL has no path slash (e.g. "www.daum.net입니다" or "https://naver.com입니다"),
      // strip any trailing non-ASCII characters (Korean josa/postpositions)
      const hostOnlyMatch = rawUrl.match(/^(https?:\/\/|www\.)[a-zA-Z0-9.-]+([^\/]*)$/);
      if (hostOnlyMatch && /[^\x00-\x7F]/.test(hostOnlyMatch[2])) {
        const nonAsciiTrail = rawUrl.match(/[^\x00-\x7F]+$/);
        if (nonAsciiTrail) {
          trailing = nonAsciiTrail[0] + trailing;
          rawUrl = rawUrl.slice(0, -nonAsciiTrail[0].length);
        }
      }

      // Another check for trailing punctuation that might have been before non-ascii
      const trailPunct2 = rawUrl.match(/[.,!?:;]+$/);
      if (trailPunct2) {
        trailing = trailPunct2[0] + trailing;
        rawUrl = rawUrl.slice(0, -trailPunct2[0].length);
      }

      let href = rawUrl;
      if (!/^https?:\/\/|^mailto:|^tel:/i.test(href)) {
        href = 'https://' + href;
      }

      parts.push({
        type: 'link',
        content: rawUrl,
        url: href,
      });

      if (trailing) {
        parts.push({
          type: 'text',
          content: trailing,
        });
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}
