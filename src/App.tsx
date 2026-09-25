import React, { useState, useMemo, useEffect } from 'react';
import {
  VariableCount,
  CellValue,
  SolutionMode,
  NotationMode,
  AppMode,
  UserPracticeGroup,
  PresetProblem,
} from './types';
import { minimizeKMap } from './logic/quineMcCluskey';
import { KMapGrid } from './components/KMap/KMapGrid';
import { MintermBar } from './components/Inputs/MintermBar';
import { ExpressionInput } from './components/Inputs/ExpressionInput';
import { TruthTable } from './components/Inputs/TruthTable';
import { SolverView } from './components/Solver/SolverView';
import { PracticeMode } from './components/Practice/PracticeMode';
import { CircuitViewer } from './components/Circuit/CircuitViewer';
import { ExportModal } from './components/Export/ExportModal';
import { PresetSelector } from './components/Header/PresetSelector';
import {
  Download,
  Moon,
  Sun,
  Binary,
} from 'lucide-react';

export default function App() {
  const [numVars, setNumVars] = useState<VariableCount>(4);
  const [grid, setGrid] = useState<Record<number, CellValue>>(() => {
    return {
      0: '1',
      2: '1',
      8: '1',
      10: '1',
      5: '1',
      7: '1',
    };
  });

  const [solutionMode, setSolutionMode] = useState<SolutionMode>('SOP');
  const [notation, setNotation] = useState<NotationMode>('prime');
  const [appMode, setAppMode] = useState<AppMode>('solver');
  const [activeImplicantId, setActiveImplicantId] = useState<string | null>(null);

  const [userGroups, setUserGroups] = useState<UserPracticeGroup[]>([]);
  const [selectedMinterms, setSelectedMinterms] = useState<Set<number>>(new Set());
  const [showOptimalInPractice, setShowOptimalInPractice] = useState(false);

  const [isExportOpen, setIsExportOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const solution = useMemo(() => {
    return minimizeKMap(numVars, grid, notation);
  }, [numVars, grid, notation]);

  function handleCellClick(minterm: number) {
    if (appMode === 'practice') {
      const next = new Set(selectedMinterms);
      if (next.has(minterm)) {
        next.delete(minterm);
      } else {
        next.add(minterm);
      }
      setSelectedMinterms(next);
      return;
    }

    const currentVal = grid[minterm] ?? '0';
    let nextVal: CellValue = '0';
    if (currentVal === '0') nextVal = '1';
    else if (currentVal === '1') nextVal = 'X';
    else if (currentVal === 'X') nextVal = '0';

    setGrid((prev) => ({
      ...prev,
      [minterm]: nextVal,
    }));
  }

  function handleCellRightClick(minterm: number, e: React.MouseEvent) {
    e.preventDefault();
    if (appMode === 'practice') return;

    const currentVal = grid[minterm] ?? '0';
    const nextVal: CellValue = currentVal === 'X' ? '0' : 'X';
    setGrid((prev) => ({
      ...prev,
      [minterm]: nextVal,
    }));
  }

  function handleSelectNumVars(vars: VariableCount) {
    setNumVars(vars);
    const maxMinterm = 1 << vars;
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < maxMinterm; m++) {
      newGrid[m] = grid[m] ?? '0';
    }
    setGrid(newGrid);
    setUserGroups([]);
    setSelectedMinterms(new Set());
    setActiveImplicantId(null);
  }

  function handleSelectPreset(preset: PresetProblem) {
    setNumVars(preset.numVars);
    const total = 1 << preset.numVars;
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < total; m++) {
      if (preset.minterms.includes(m)) {
        newGrid[m] = '1';
      } else if (preset.dontCares.includes(m)) {
        newGrid[m] = 'X';
      } else {
        newGrid[m] = '0';
      }
    }
    setGrid(newGrid);
    setUserGroups([]);
    setSelectedMinterms(new Set());
    setShowOptimalInPractice(false);
  }

  const displayedImplicants = useMemo(() => {
    if (appMode === 'practice') {
      if (showOptimalInPractice) {
        return solutionMode === 'SOP' ? solution.minimalSop : solution.minimalPos;
      }
      return userGroups.map((ug, idx) => ({
        id: ug.id,
        pattern: '',
        minterms: ug.minterms,
        isEssential: false,
        color: ug.color,
        sopTerm: `Group #${idx + 1}`,
        posTerm: `Group #${idx + 1}`,
      }));
    }
    return solutionMode === 'SOP' ? solution.minimalSop : solution.minimalPos;
  }, [appMode, showOptimalInPractice, solutionMode, solution, userGroups]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#182B49] to-[#00629B] flex items-center justify-center text-white shadow-md">
              <Binary className="w-6 h-6 text-[#FFCD00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Karnaugh Map Tool
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#182B49] text-[#FFCD00] border border-[#C69214]/50 shadow-sm">
                  UCSD CSE 140
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Boolean Logic & Circuit Minimization Visualizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {([2, 3, 4] as VariableCount[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSelectNumVars(v)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    numVars === v
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {v} Vars ({v === 2 ? 'A,B' : v === 3 ? 'A,B,C' : 'A,B,C,D'})
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAppMode('solver');
                  setSelectedMinterms(new Set());
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  appMode === 'solver'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Solver
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppMode('practice');
                  setShowOptimalInPractice(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  appMode === 'practice'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Practice Mode
              </button>
            </div>

            <PresetSelector onSelectPreset={handleSelectPreset} />

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
              title="Export to LaTeX, TikZ, and Verilog for Homework"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MintermBar
            numVars={numVars}
            grid={grid}
            onChangeGrid={setGrid}
            solutionMode={solutionMode}
            onToggleSolutionMode={setSolutionMode}
          />
          <ExpressionInput
            numVars={numVars}
            onChangeGrid={setGrid}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {numVars}-Variable Karnaugh Map
                </h2>
                <p className="text-xs text-slate-400">
                  Standard Gray code layout &bull; toroidal wrap-around overlay
                </p>
              </div>

              {appMode === 'practice' && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Click cells to select group
                </span>
              )}
            </div>

            <KMapGrid
              numVars={numVars}
              grid={grid}
              onCellClick={handleCellClick}
              onCellRightClick={handleCellRightClick}
              implicants={displayedImplicants}
              activeImplicantId={activeImplicantId}
              mode={appMode}
              selectedMinterms={selectedMinterms}
            />
          </div>

          <div className="lg:col-span-1">
            <TruthTable
              numVars={numVars}
              grid={grid}
              onCellClick={handleCellClick}
              activeImplicant={
                activeImplicantId
                  ? solution.allPrimeImplicantsSop.find((p) => p.id === activeImplicantId) ||
                    solution.allPrimeImplicantsPos.find((p) => p.id === activeImplicantId) ||
                    null
                  : null
              }
            />
          </div>
        </div>

        {appMode === 'solver' ? (
          <SolverView
            solution={solution}
            solutionMode={solutionMode}
            notation={notation}
            onToggleNotation={() => setNotation(notation === 'prime' ? 'overline' : 'prime')}
            activeImplicantId={activeImplicantId}
            onHoverImplicant={setActiveImplicantId}
          />
        ) : (
          <PracticeMode
            numVars={numVars}
            grid={grid}
            solutionMode={solutionMode}
            notation={notation}
            userGroups={userGroups}
            onSetUserGroups={setUserGroups}
            selectedMinterms={selectedMinterms}
            onClearSelection={() => setSelectedMinterms(new Set())}
            onRevealSolution={() => setShowOptimalInPractice(!showOptimalInPractice)}
          />
        )}

        <CircuitViewer
          numVars={numVars}
          solution={solution}
          solutionMode={solutionMode}
        />
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        Interactive Karnaugh Map Tool &bull; Designed for UCSD CSE 140 (Digital Systems & Logic Design) &bull; React, TypeScript & Tailwind CSS
      </footer>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        numVars={numVars}
        grid={grid}
        solution={solution}
        solutionMode={solutionMode}
      />
    </div>
  );
}
