import React, { useState, useEffect } from 'react';
import {
  getSupabaseYoutubeLiveList,
  upsertSupabaseYoutubeLive,
  isSupabaseConfigured,
  YouTubeLiveItem,
} from '../../../lib/supabase';
import { Youtube, ExternalLink, Database, KeyRound, Save, Radio, Check } from 'lucide-react';

interface SettingsTabProps {
  youtubeLiveUrl: string;
  setYoutubeLiveUrl: (url: string) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  setSaveStatus,
}) => {
  const [liveList, setLiveList] = useState<YouTubeLiveItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseYoutubeLiveList(true).then((list) => {
      setLiveList(list);
    });
  }, []);

  const handleUrlChange = (sportKey: string, newUrl: string) => {
    setLiveList((prev) =>
      prev.map((item) => (item.sportKey === sportKey ? { ...item, url: newUrl } : item))
    );
  };

  const handleSaveItem = async (item: YouTubeLiveItem) => {
    setSavingKey(item.sportKey);
    const ok = await upsertSupabaseYoutubeLive(item);
    setSavingKey(null);
    if (ok) {
      setSavedKey(item.sportKey);
      setSaveStatus(`[${item.name}] 실시간 중계 링크가 저장되었습니다.`);
      setTimeout(() => {
        setSavedKey(null);
        setSaveStatus(null);
      }, 3000);
    } else {
      setSaveStatus('중계 링크 저장 실패');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleSaveAll = async () => {
    for (const item of liveList) {
      await upsertSupabaseYoutubeLive(item);
    }
    setSaveStatus('모든 종목의 실시간 중계 링크가 성공적으로 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-base text-gray-900">
          관리자 설정 및 종목별 실시간 중계 링크
        </h2>
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>전체 중계 링크 일괄 저장</span>
        </button>
      </div>

      {/* Sport-by-Sport YouTube Live Stream Manager */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 font-extrabold text-sm text-gray-900">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>종목별 실시간 유튜브 라이브 (LIVE) 링크 설정</span>
          </div>
          <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
            종목별 분기 지원
          </span>
        </div>

        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          방문자가 해당 종목(축구, 야구, LoL 등) 및 공연의 <strong>LIVE &gt;</strong> 배지를 클릭했을 때 이동할 전용 유튜브 중계 링크입니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {liveList.map((item) => (
            <div
              key={item.sportKey}
              className="bg-slate-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                  {item.sportKey === 'main' && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black">
                      기본 채널
                    </span>
                  )}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 bg-white border border-red-200 px-2 py-0.5 rounded transition-colors"
                  >
                    <span>확인</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => handleUrlChange(item.sportKey, e.target.value)}
                  placeholder="예: https://youtube.com/live/... 또는 https://youtube.com/@stadium_official"
                  className="flex-1 bg-white border border-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  onClick={() => handleSaveItem(item)}
                  disabled={savingKey === item.sportKey}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs ${
                    savedKey === item.sportKey
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {savedKey === item.sportKey ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>저장됨</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingKey === item.sportKey ? '...' : '저장'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
          <Database className="w-4 h-4 text-postech" />
          <span>Supabase 연결 상태</span>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">연동 상태:</span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                연동 활성화 (데이터베이스 동기화중)
              </span>
            ) : (
              <span className="text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                로컬 모드 (Supabase 환경변수 미설정)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin Password Information & Environment Variable Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <KeyRound className="w-4 h-4 text-postech" />
            <span>관리자 비밀번호 보안 설정</span>
          </div>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
            Vercel 환경변수 연동
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          관리자 접속 비밀번호는 <strong>Vercel 환경 변수 (<code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">VITE_ADMIN_PASSWORD</code>)</strong>를 통해 엄격하게 인증됩니다.
        </p>

        <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5 text-gray-600">
          <p className="font-bold text-gray-800">💡 Vercel에서 비밀번호를 변경하는 방법:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-gray-600 pl-1">
            <li>Vercel 대시보드 &gt; STadium 프로젝트 &gt; <strong>Settings &gt; Environment Variables</strong> 이동</li>
            <li>Key: <code className="font-mono font-bold text-indigo-600">VITE_ADMIN_PASSWORD</code> / Value: <code className="font-mono text-gray-800">[원하는 새 비밀번호]</code> 입력 후 Save</li>
            <li>프로젝트를 Redeploy하면 새 비밀번호가 즉시 적용됩니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
