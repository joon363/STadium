import { SponsorItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export const DEFAULT_FIXED_SPONSORS: SponsorItem[] = [
  {
    id: 'sp-1',
    name: '플라스뽀 (PLASPEAU) ||| PLASPEAU',
    tier: 'main',
    logoUrl: '/sponsors/1plaspeau.png',
    description:
      '포항공대(POSTECH)에서 개발한 플라즈마 기반 NOx 기술을 바탕으로 탄생한 K-리커버리 스킨케어 브랜드입니다. 제품 개발 시 스킨 롱제비티, 피부 장벽, 수분 보습을 핵심 가치로 삼고 있습니다.\n\n플라스뽀의 에센셜 라인은 에센셜 모이스처 세럼, 크림, 오버나잇 리페어 밤으로 구성되어 있습니다. 행사 당일 플라스뽀 부스에서 만나보세요! ||| Born from plasma-based NOx technology developed at POSTECH, PLASPEAU is a K-recovery skincare brand focused on skin longevity, skin barrier care, and deep hydration.\n\nIts Essential Line features the Essential Moisture Serum, Cream, and Overnight Repair Balm. Visit the PLASPEAU booth on event day!',
    websiteUrl: 'https://plaspeau.kr/',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'sp-2',
    name: '펜타시큐리티 (Penta Security) ||| Penta Security',
    tier: 'main',
    logoUrl: '/sponsors/2penta.png',
    description:
      '펜타시큐리티는 "Secure First, Then Connect."라는 슬로건 아래 정보보안의 리더로서 세계 수많은 사람들의 정보와 전산을 보호하고 있습니다. 다년간 이룬 기업정보보안 시장 1위 기술과 경험을 바탕으로 사물인터넷(IoT), 블록체인 영역에서도 믿을 수 있는 보안을 제공합니다. ||| Under the slogan "Secure First, Then Connect.", Penta Security is a leader in information security protecting the data and systems of countless people worldwide. Building on years of No. 1 technology and experience in the enterprise information security market, it also provides trusted security across IoT and blockchain.',
    websiteUrl: 'https://www.pentasecurity.co.kr',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'sp-3',
    name: '뉴로메카 (Neuromeka) ||| Neuromeka',
    tier: 'main',
    logoUrl: '/sponsors/3neuromeka.png',
    description:
      '뉴로메카는 쓰기 쉽고 경제적인 협동로봇을 통한 중소기업 제조라인의 자동화를 선도합니다. 뉴로메카의 협동로봇은 사람과 작업할 수 있도록 안전하게 동작하며, 프로그래밍을 통해 다양한 작업에 적용 가능합니다. ||| Neuromeka leads the automation of SME manufacturing lines through easy-to-use and cost-effective collaborative robots. Neuromeka\'s collaborative robots operate safely alongside humans and can be programmed for a wide range of tasks.',
    websiteUrl: 'https://www.neuromeka.com',
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'sp-4',
    name: 'BGN 밝은눈안과 ||| BGN Eye Clinic',
    tier: 'main',
    logoUrl: '/sponsors/4eye.png',
    description:
      '2009년 강남에 개원한 밝은눈안과는 아시아 최초로 스마일수술 장비 비쥬맥스(VisuMax)를 도입하고, ZEISS로부터스마일 10만 케이스를 공식 인증받은 시력교정 전문 안과입니다. 보건복지부 인증 외국인 환자 유치 우수 의료기관(KAHF)으로, 2026년 논현역 B722타워로 확장 이전하여 접수와 검사(1F), 수술과 외래(B1F) 전용 공간을 운영하고 있습니다. ||| Opened in Gangnam in 2009, BGN Eye Clinic is a specialized vision correction clinic that was the first in Asia to introduce the VisuMax SMILE surgery system and is officially certified by ZEISS for 100,000 SMILE cases. Accredited by the Ministry of Health and Welfare as an Outstanding Medical Institution for Attracting Foreign Patients (KAHF), it expanded and relocated to B722 Tower near Nonhyeon Station in 2026, operating dedicated spaces for reception and examinations (1F) and surgery and outpatient care (B1F).',
    websiteUrl: 'https://brighteyesclinic.com/',
    isActive: true,
    displayOrder: 4,
  },
];

export async function getSupabaseSponsors(forceRefresh: boolean = false): Promise<SponsorItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<SponsorItem[]>('sponsors');
    if (cached) return cached;
  }

  if (!supabase) return DEFAULT_FIXED_SPONSORS;
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('[Supabase Sponsors Fetch Error]', error);
      saveToCache('sponsors', DEFAULT_FIXED_SPONSORS);
      return DEFAULT_FIXED_SPONSORS;
    }

    const formatted: SponsorItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      tier: r.tier || 'gold',
      logoUrl: r.logo_url || '',
      description: r.description || '',
      websiteUrl: r.website_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('sponsors', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Sponsors Exception]', err);
    return DEFAULT_FIXED_SPONSORS;
  }
}

export async function upsertSupabaseSponsor(
  item: SponsorItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').upsert({
      id: item.id,
      name: item.name,
      tier: item.tier,
      logo_url: item.logoUrl || '',
      description: item.description || '',
      website_url: item.websiteUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseSponsor(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
