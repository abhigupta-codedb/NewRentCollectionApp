import { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Smartphone,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface DistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export default function DistributionModal({
  isOpen,
  onClose,
  appUrl,
}: DistributionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Doosre Makaan Maliko Ko App Bhejein</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                  मालिक शेयर
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Koi bhi landlord is link se apne kirayedaaron ka khata maintain kar sakta hai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Shareable App Web Link (WhatsApp ya Email par bhejein)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="grow px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  copied
                    ? 'bg-emerald-700 text-white'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copy Ho Gaya
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Link Copy Karein
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Is direct link ko kisi bhi property owner, PG owner ya flat landlord ko bhej sakte hain.
            </p>
          </div>

          {/* How It Works for Other Owners */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yeh Kaise Kaam Karta Hai? (Architecture)
            </h4>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">
                    1. Har Makaan Malik Ka Alag Space
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Jab koi naya malik link kholega, wo apne Google account se sign-in karega. Use apna naya aur niji bahi-khata milega.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">
                    2. Poori Privacy (Data Bilkul Surakshit)
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Ek landlord doosre landlord ke kirayedar, unke agreement kagazat ya payments ko kabhi nahi dekh sakta.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">
                    3. Mobile Phone &amp; Desktop Browser Ready
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Kisi app store download ki zaroorat nahi. Phone ke browser me khol kar seedha home screen par "Add to Home Screen" kiya ja sakta hai.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Checklist */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
            <span className="font-bold text-amber-950 block">
              Har Makaan Malik Ko Kya Milega:
            </span>
            <ul className="space-y-1.5 text-amber-950">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Unlimited kirayedar aur unka WhatsApp mobile number jodne ki suvidha</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>1-Click automatic WhatsApp kiraya reminder sandesh payment link ke sath</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Rent agreement aur police verification dastaveez upload vault</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>HRA-approved Kiraya Rashid (PDF) har bhugtan par download karne ki suvidha</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            Naye Tab Me Kholein
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Band Karein (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
