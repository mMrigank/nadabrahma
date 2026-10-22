with open('src/components/MasterMixerDrawer.tsx', 'r') as f:
    lines = f.readlines()

start = 440
end = 443
new_code = """              <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <div><span className="text-amber-300 font-semibold">Head-Related Transfer Function (HRTF)</span> models subtle microsecond interaural time delays and pinna filtering for true 3D headphone staging.</div>
                <button
                  onClick={() => setIsBinauralPreview(!isBinauralPreview)}
                  className={`py-1.5 px-3 rounded flex items-center justify-center gap-2 font-bold transition-colors ${
                    isBinauralPreview 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  {isBinauralPreview ? 'Binaural Audition Active' : 'Enable Binaural Preview'}
                </button>
              </div>\n"""

lines_before = lines[:start]
lines_after = lines[end:]

with open('src/components/MasterMixerDrawer.tsx', 'w') as f:
    f.writelines(lines_before)
    f.write(new_code)
    f.writelines(lines_after)
