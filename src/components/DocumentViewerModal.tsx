import { X, Download, FileText, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { LeaseDocument, Tenant } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LeaseDocument | null;
  tenant: Tenant | null;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  tenant,
}: DocumentViewerModalProps) {
  if (!isOpen || !document || !tenant) return null;

  const handleDownload = () => {
    if (document.dataUrl) {
      const link = window.document.createElement('a');
      link.href = document.dataUrl;
      link.download = document.name;
      link.click();
    } else {
      // Create a mock agreement file blob for download
      const content = `KIRAYANAMA / RENTAL LEASE AGREEMENT COPY\n\n` +
        `Kirayedar Ka Naam: ${tenant.name}\n` +
        `Kamra / Flat No: ${tenant.unit}\n` +
        `Mahina Kiraya: ₹${tenant.rentAmount.toLocaleString('en-IN')}\n` +
        `Amanat Rashi (Security Deposit): ₹${tenant.securityDeposit.toLocaleString('en-IN')}\n` +
        `Agreement Avadhi: ${tenant.leaseStart} to ${tenant.leaseEnd} (11 Mahine)\n` +
        `Dastaveez Ka Naam: ${document.name}\n` +
        `Dastaveez Prakar: ${document.documentType}\n` +
        `Upload Tareekh: ${document.uploadDate}\n\n` +
        `Mukhya Shartein:\n1. Kiraya har mahine ki ${tenant.dueDay} tareekh tak deya hoga.\n` +
        `2. Yeh samjhauta dono paksho ki sehmati se notarize karaya gaya hai.\n` +
        `3. Digital archive verified copy.`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name.endsWith('.pdf') ? document.name.replace('.pdf', '.txt') : document.name;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-lg">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white truncate max-w-md">{document.name}</h3>
              <p className="text-xs text-slate-300">
                {tenant.name} • {tenant.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 space-y-4">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block font-semibold">Document Prakar</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                {document.documentType}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Upload Tareekh</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {document.uploadDate}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">File Size</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{document.fileSize}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Satyapan (Status)</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Archive
              </span>
            </div>
          </div>

          {/* Document Content View */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 min-h-[220px] flex flex-col items-center justify-center text-center">
            {document.dataUrl && document.fileType.startsWith('image/') ? (
              <img
                src={document.dataUrl}
                alt={document.name}
                className="max-h-72 object-contain rounded-lg border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="max-w-md space-y-3">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-700">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{document.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {document.notes || 'Kirayanama aur police verification ki certified copy surakshit store hai.'}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs space-y-1 text-slate-700">
                  <p><strong>Kirayedar:</strong> {tenant.name} ({tenant.phone})</p>
                  <p><strong>Flat / Kamra:</strong> {tenant.unit}</p>
                  <p><strong>Agreement Samay:</strong> {tenant.leaseStart} se {tenant.leaseEnd}</p>
                  <p><strong>Mahina Kiraya:</strong> ₹{tenant.rentAmount.toLocaleString('en-IN')}/mahina (Due: {tenant.dueDay} tareekh)</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Surakshit Digital Kagazat
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Band Karein (Close)
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Kagazat Download Karein</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
