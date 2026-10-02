        {/* Section 4: Live 7.1.4 Spatial Metering */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Atmos 7.1.4 Bed & LUFS Metering
          </h3>

          <div className="grid grid-cols-5 gap-4 items-center">
            
            {/* 7.1.4 Meters */}
            <div className="col-span-3 grid grid-cols-4 gap-x-2 gap-y-1">
              {(() => {
                const azimuth = Math.atan2(spatialX, spatialY) * (180 / Math.PI);
                const distance = Math.sqrt(spatialX*spatialX + spatialY*spatialY);
                const pos = { azimuth, elevation: spatialElevation, distance: 1 }; // normalize distance to 1 for VBAP
                const baseDb = (meterL + meterR) / 2;
                const baseLin = Math.pow(10, baseDb / 20);
                const vbap = vbapGains(pos, SPEAKER_BEDS["7.1.4"]);
                
                return SPEAKER_BEDS["7.1.4"].speakers.map((spk, i) => {
                  const gain = spk.isLfe ? (isPlaying ? 0.3 : 0) : vbap[i];
                  const lin = (gain * baseLin) + (isPlaying ? (Math.random()*0.02) : 0);
                  const db = lin > 0.0001 ? 20 * Math.log10(lin) : -60;
                  const pct = Math.min(100, Math.max(0, (db + 60) * 1.66));
                  
                  return (
                    <div key={spk.id} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-end">
                        <span className="font-mono text-[8px] text-slate-400 leading-none">{spk.id}</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                          style={{ width: `${pct}%`, opacity: gain > 0.1 || spk.isLfe ? 1 : 0.4 }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Readouts */}
            <div className="col-span-2 flex flex-col gap-2 bg-slate-950 rounded-xl border border-slate-800/80 p-3">
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-mono">Integrated</div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {currentLufs.toFixed(1)} LUFS
                </div>
              </div>
              <div className="w-full h-px bg-slate-800"></div>
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-mono">True Peak</div>
                <div className="text-xs font-mono font-bold text-red-400">
                  -0.8 dBTP
                </div>
              </div>
              <div className="w-full h-px bg-slate-800"></div>
              <div className="flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-mono">Phrase Target</div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {lufsTarget} LUFS
                </div>
              </div>
            </div>

          </div>
        </div>
