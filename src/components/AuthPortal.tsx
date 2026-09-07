import { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Send,
  FileCheck2,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthPortalProps {
  onContinueDemo: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthPortal({ onContinueDemo }: AuthPortalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(
        err.message?.includes('popup-closed-by-user')
          ? 'Sign-in radd ho gaya. Kripya punah prayas karein.'
          : 'Sign-in me samasya aayi. Kripya popup enable karein aur try karein.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 font-sans antialiased">
      {/* Top Banner */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xs py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 block leading-tight">
                Kiraya Khata
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                किराया खाता
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Indian Landlord &amp; Kirayedar Bahi-Khata Portal
            </span>
          </div>
        </div>

        <button
          onClick={onContinueDemo}
          className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition"
        >
          Demo Mode Me Dekhein &rarr;
        </button>
      </header>

      {/* Main Hero & Sign-in Box */}
      <main className="grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Column: Value Proposition */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>North India Landlords Special Edition</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Kiraya vasooli, automated WhatsApp reminder aur masik bahi-khata.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            Makaan maliko ke liye saral aur digital khata. Har kirayedar ka mobile number, due date, outstanding bakaya, rent agreement aur HRA-valid kiraya rashid manage karein.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 text-xs text-slate-700 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-left">
              <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900">
                  WhatsApp Kiraya Reminder
                </span>
                <span>Due date aane par automatic sandesh UPI / GPay payment link ke sath</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-left">
              <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900">
                  Kirayanama &amp; Police Verification
                </span>
                <span>Signed rent agreement aur identity documents profile me upload karein</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-left">
              <BarChart3 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900">
                  HRA Kiraya Rashid (PDF)
                </span>
                <span>Revenue stamp format aur Landlord PAN ke sath verified tax receipt</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-left">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900">
                  100% Surakshit Cloud Khata
                </span>
                <span>Har makaan malik ka data doosre malik se bilkul alag aur private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-amber-200 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black text-slate-900">
              Makaan Malik Login Portal
            </h2>
            <p className="text-xs text-slate-500">
              Apne Google account se sign-in karke apna kiraya bahi-khata surakshit karein
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Authenticating...' : 'Google Se Sign In Karein'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ya Pehle Dekhein
            </span>
          </div>

          <button
            onClick={onContinueDemo}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <span>Sample Demo Mode Dekhein</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Privacy & Multi-tenancy assurance */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Surakshit Multi-Tenant Cloud Architecture</span>
            </div>
            <p>
              Aapke kirayedar aur payments ka data keval aapke account me surakshit rahega.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Kiraya Khata &bull; Cloud Firestore &amp; Firebase Authentication dwara surakshit
      </footer>
    </div>
  );
}
