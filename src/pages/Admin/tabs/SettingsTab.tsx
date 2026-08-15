import React, { useState } from 'react';
import {
  updateAdminPasswordInSupabase,
  updateSupabaseYoutubeLiveUrl,
  isSupabaseConfigured,
} from '../../../lib/supabase';
import { Youtube, ExternalLink, Database, KeyRound, Save } from 'lucide-react';

interface SettingsTabProps {
  youtubeLiveUrl: string;
  setYoutubeLiveUrl: (url: string) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  setSaveStatus: (msg: string | null) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  youtubeLiveUrl,
  setYoutubeLiveUrl,
  isSaving,
  setIsSaving,
  setSaveStatus,
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSavingYoutube, setIsSavingYoutube] = useState<boolean>(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsSaving(true);
    const ok = await updateAdminPasswordInSupabase(newPassword);
    setIsSaving(false);

    if (ok) {
      setSaveStatus('관리자 비밀번호가 성공적으로 변경되었습니다.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  const handleSaveYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingYoutube(true);
    const ok = await updateSupabaseYoutubeLiveUrl(youtubeLiveUrl);
    setIsSavingYoutube(false);
    if (ok) {
      setSaveStatus('유튜브 실시간 중계 링크가 성공적으로 저장되었습니다.');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      alert('유튜브 중계 링크 저장에 실패했습니다.');
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-b-xl shadow-2xs space-y-6">
      <h2 className="font-extrabold text-base text-gray-900">
        관리자 설정 및 실시간 중계 링크
      </h2>

      {/* YouTube Live Stream URL Setting */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 font-extrabold text-sm text-gray-900">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>실시간 유튜브 중계 (LIVE) 링크 설정</span>
          </div>
          {youtubeLiveUrl && (
            <a
              href={youtubeLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <span>새 탭에서 링크 확인</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <p className="text-xs text-gray-600 font-medium">
          방문자가 경기 및 공연 카드의 <strong>LIVE &gt;</strong> 배지를 클릭했을 때 바로
          이동할 유튜브 실시간 스트리밍 또는 채널 URL입니다.
        </p>

        <form onSubmit={handleSaveYoutube} className="space-y-3 max-w-xl pt-1">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              유튜브 라이브 스트리밍 URL
            </label>
            <input
              type="url"
              value={youtubeLiveUrl}
              onChange={(e) => setYoutubeLiveUrl(e.target.value)}
              placeholder="예: https://youtube.com/live/... 또는 https://youtube.com/@stadium_official"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingYoutube}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingYoutube ? '저장 중...' : '유튜브 중계 링크 저장'}</span>
          </button>
        </form>
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

      {/* Password Change Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
          <KeyRound className="w-4 h-4 text-postech" />
          <span>관리자 비밀번호 변경</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              새 관리자 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 입력"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-postech"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 다시 입력"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-postech"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-postech hover:bg-postech-dark text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>비밀번호 변경 저장</span>
          </button>
        </form>
      </div>
    </div>
  );
};
