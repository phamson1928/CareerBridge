import React, { useState } from 'react';
import { CompanyProfile, Internship } from '../../types';
import { Building, CheckCircle2, ShieldAlert, ExternalLink, X, Plus } from 'lucide-react';

interface CompanyModerationProps {
  companies: CompanyProfile[];
  internships: Internship[];
  onToggleVerifyCompany: (companyId: string) => void;
}

export const CompanyModeration: React.FC<CompanyModerationProps> = ({
  companies,
  internships,
  onToggleVerifyCompany,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Kiểm Duyệt & Xác Thực Doanh Nghiệp</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Xác minh tư cách pháp nhân của các doanh nghiệp đối tác đăng ký tuyển dụng thực tập.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {companies.map((cmp) => (
          <div key={cmp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={cmp.logo} alt={cmp.companyName} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{cmp.companyName}</h3>
                  <span className="text-xs text-slate-500">{cmp.industry}</span>
                </div>
              </div>

              {cmp.verified ? (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác thực
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                  Chờ kiểm duyệt
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{cmp.description}</p>

            <div className="text-xs text-slate-500 space-y-1">
              <p>📍 Địa chỉ: {cmp.address}</p>
              <p>✉️ Email liên hệ: {cmp.contactEmail}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <a
                href={cmp.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                Website công ty <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => onToggleVerifyCompany(cmp.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cmp.verified
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                }`}
              >
                {cmp.verified ? 'Hủy cấp tích xanh' : 'Xác thực doanh nghiệp ✓'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
