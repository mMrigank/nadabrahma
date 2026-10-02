        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Stereo True-Peak & LUFS Metering
          </h3>

          <div className="grid grid-cols-3 gap-4">
            
            {/* L / R Bars */}
            <div className="col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 font-mono text-[10px] text-slate-400">L</span>
                <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (meterL + 60) * 1.66))}%` }}
                  />
                </div>
                <span className="w-12 font-mono text-[10px] text-right text-slate-300">
                  {meterL.toFixed(1)} dB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-4 font-mono text-[10px] text-slate-400">R</span>
                <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (meterR + 60) * 1.66))}%` }}
                  />
                </div>
                <span className="w-12 font-mono text-[10px] text-right text-slate-300">
                  {meterR.toFixed(1)} dB
                </span>
              </div>
            </div>

            {/* Readouts */}
            <div className="flex items-center justify-around bg-slate-950 rounded-xl border border-slate-800/80 p-2">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-mono">Integrated</div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {currentLufs.toFixed(1)} LUFS
                </div>
              </div>
              <div className="w-px h-6 bg-slate-800"></div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-mono">Correlation</div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  +{correlation.toFixed(2)}
                </div>
              </div>
            </div>

          </div>
        </div>
