import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { verifyAdminPassword } from '../../../services/settingsService';
import { useLanguage } from '../../../context/LanguageContext';
import { LanguageToggle } from '../../../components/LanguageToggle';

interface AdminAuthGateProps {
  onSuccess: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      setAuthError(t('admin.authError'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="fixed top-4 right-4 z-10">
        <LanguageToggle variant="dark" />
      </div>
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-white">{t('admin.authTitle')}</h1>
          <p className="text-xs text-slate-400">{t('admin.authSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {t('admin.authLabel')}
            </label>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder={t('admin.authPlaceholder')}
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
            <span>{isVerifying ? t('admin.authVerifying') : t('admin.authSubmit')}</span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('admin.authBack')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
