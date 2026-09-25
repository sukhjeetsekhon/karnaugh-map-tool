import React from 'react';
import { PRESET_PROBLEMS } from '../../logic/presets';
import { PresetProblem } from '../../types';

interface PresetSelectorProps {
  onSelectPreset: (preset: PresetProblem) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelectPreset }) => {
  return (
    <div className="relative inline-block text-left">
      <select
        defaultValue=""
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (!isNaN(idx) && PRESET_PROBLEMS[idx]) {
            onSelectPreset(PRESET_PROBLEMS[idx]);
            e.target.value = '';
          }
        }}
        className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
      >
        <option value="" disabled>
          📖 Load CSE 140 Preset...
        </option>
        {PRESET_PROBLEMS.map((preset, idx) => (
          <option key={idx} value={idx}>
            {preset.name} ({preset.numVars} vars)
          </option>
        ))}
      </select>
    </div>
  );
};
