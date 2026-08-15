import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { verifyAdminPassword } from '../../../services/settingsService';

interface AdminAuthGateProps {
  onSuccess: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError(null);

    const isValid = await verifyAdminPassword(inputPassword);
    setIsVerifying(false);

    if (isValid) {
      onSuccess();
    } else {
      setAuthError('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-white">2026 STadium 관리자 로그인</h1>
          <p className="text-xs text-slate-400">
            경기 스코어, 공연 일정, 지도 및 공지사항 수정을 위한 인증
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">관리자 비밀번호</label>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-slate-950 border border-slate-700 px-3.5 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-rose-600"
            />
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isVerifying ? '검증 중...' : '관리자 로그인'}</span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>일반 사용자 화면으로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
