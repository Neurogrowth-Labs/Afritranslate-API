import React, { useState } from "react";
import { Search, Globe, Users, FileText, ArrowRight, CornerDownRight, AlignLeft, AlignRight } from "lucide-react";
import { AFRICAN_LANGUAGES, Language } from "../data/languages";

interface LanguageExplorerTabProps {
  onTryTranslate: (langCode: string) => void;
}

const REGIONS = [
  "All",
  "East Africa",
  "West Africa",
  "Southern Africa",
  "Central Africa",
  "North Africa",
  "Global"
];

export default function LanguageExplorerTab({ onTryTranslate }: LanguageExplorerTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");

  const filteredLanguages = AFRICAN_LANGUAGES.filter((lang) => {
    const matchesSearch = 
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = 
      selectedRegion === "All" ||
      lang.region.toLowerCase() === selectedRegion.toLowerCase();

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search language by name, code, native text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] py-2.5 pl-10 pr-4 text-xs text-slate-100 outline-none focus:border-amber-500 transition-all"
          />
        </div>

        {/* Regions list */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRegion(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                selectedRegion === r
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : "bg-[#0F172A] border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Language Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLanguages.length > 0 ? (
          filteredLanguages.map((lang: Language) => (
            <div 
              key={lang.code}
              className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col justify-between hover:border-amber-500/40 hover:shadow-lg transition-all group"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-[#0F172A] px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider border border-slate-800">
                    {lang.code}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold font-mono tracking-wider uppercase">
                    {lang.region}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-white text-base leading-tight">
                    {lang.name}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-600" />
                    Native: <strong className="text-slate-300 font-sans">{lang.native}</strong>
                  </p>
                </div>
              </div>

              {/* Specs */}
              <div className="my-5 border-t border-b border-slate-850 py-3.5 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-350">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span>L1/L2 Speakers:</span>
                  </div>
                  <span className="font-semibold text-slate-200">
                    {lang.speakers >= 1000 ? `${(lang.speakers / 1000).toFixed(1)} Billion` : `${lang.speakers.toFixed(1)} Million`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-350">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Native Script:</span>
                  </div>
                  <span className="font-semibold text-slate-200">{lang.script}</span>
                </div>

                <div className="flex items-center justify-between text-slate-350">
                  <div className="flex items-center gap-1.5">
                    {lang.rtl ? (
                      <AlignRight className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Directionality:</span>
                  </div>
                  <span className="font-semibold text-slate-200 uppercase text-[10px]">
                    {lang.rtl ? "Right-to-Left (RTL)" : "Left-to-Right (LTR)"}
                  </span>
                </div>
              </div>

              {/* Try link */}
              <button
                type="button"
                onClick={() => onTryTranslate(lang.code)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-[#0F172A] py-2.5 text-xs font-semibold text-slate-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 active:scale-95 transition-all cursor-pointer"
              >
                Try Translating
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full h-full min-h-[250px] rounded-2xl border border-dashed border-slate-800 p-8 text-center flex flex-col items-center justify-center space-y-3">
            <Globe className="h-8 w-8 text-slate-650" />
            <div className="space-y-1">
              <h5 className="font-sans font-semibold text-slate-200 text-sm">No Languages Match Your Query</h5>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                Try refining your search text or select a different region filter from the filters panel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
