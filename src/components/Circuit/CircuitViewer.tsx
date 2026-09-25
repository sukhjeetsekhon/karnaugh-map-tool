import React, { useState } from 'react';
import { VariableCount, MinimizationResult, SolutionMode } from '../../types';
import { VARIABLE_NAMES } from '../../logic/grayCode';
import { Cpu, RefreshCw } from 'lucide-react';

interface CircuitViewerProps {
  numVars: VariableCount;
  solution: MinimizationResult;
  solutionMode: SolutionMode;
}

export const CircuitViewer: React.FC<CircuitViewerProps> = ({
  numVars,
  solution,
  solutionMode,
}) => {
  const [useUniversalGates, setUseUniversalGates] = useState(false);

  const vars = VARIABLE_NAMES[numVars];
  const activeTerms = solutionMode === 'SOP' ? solution.minimalSop : solution.minimalPos;

  if (solution.isTautology) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm text-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Circuit Schematic</h3>
        <div className="inline-block p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
          Output F is tied directly to VDD (Logic 1 / Constant High)
        </div>
      </div>
    );
  }

  if (solution.isContradiction || activeTerms.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm text-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Circuit Schematic</h3>
        <div className="inline-block p-4 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold text-slate-500">
          Output F is tied directly to Ground (GND / Logic 0 / Constant Low)
        </div>
      </div>
    );
  }

  const numGates = activeTerms.length;
  const gateHeight = 44;
  const gateSpacing = 28;
  const totalGateHeight = numGates * gateHeight + (numGates - 1) * gateSpacing;
  const svgHeight = Math.max(260, totalGateHeight + 80);
  const svgWidth = 620;

  const railStartX = 50;
  const railGap = 20;
  const railPositions: Record<string, number> = {};
  vars.forEach((v, i) => {
    railPositions[v] = railStartX + i * railGap;
  });

  const level1GateX = railStartX + vars.length * railGap + 70;
  const level2GateX = level1GateX + 160;
  const outputX = level2GateX + 100;
  const level2GateY = svgHeight / 2 - gateHeight / 2;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            2-Level Logic Gate Schematic
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setUseUniversalGates(!useUniversalGates)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
          Implementation:{' '}
          {solutionMode === 'SOP'
            ? useUniversalGates
              ? 'NAND-NAND (Universal)'
              : 'AND-OR (Standard)'
            : useUniversalGates
            ? 'NOR-NOR (Universal)'
            : 'OR-AND (Standard)'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-center p-4">
        <svg width={svgWidth} height={svgHeight} className="select-none font-mono">
          {vars.map((v) => {
            const x = railPositions[v];
            return (
              <g key={v}>
                <line
                  x1={x}
                  y1={30}
                  x2={x}
                  y2={svgHeight - 20}
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={22}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="12"
                  fontWeight="bold"
                  className="fill-slate-600 dark:fill-slate-300"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {activeTerms.map((term, idx) => {
            const gateY = 40 + idx * (gateHeight + gateSpacing);
            const gateCenterY = gateY + gateHeight / 2;
            const gateW = 48;
            const gateH = gateHeight;

            const connections: { varName: string; inverted: boolean }[] = [];
            for (let i = 0; i < term.pattern.length; i++) {
              const char = term.pattern[i];
              if (char !== '-') {
                const varName = vars[i];
                const inverted = solutionMode === 'SOP' ? char === '0' : char === '1';
                connections.push({ varName, inverted });
              }
            }

            const isAndGate = solutionMode === 'SOP';
            const hasOutputBubble = useUniversalGates;

            return (
              <g key={term.id}>
                {connections.map((conn, cIdx) => {
                  const inputWireY =
                    connections.length === 1
                      ? gateCenterY
                      : gateY + 10 + (cIdx * (gateH - 20)) / (connections.length - 1);

                  const railX = railPositions[conn.varName];

                  return (
                    <g key={conn.varName}>
                      <circle cx={railX} cy={inputWireY} r="3" fill="#3B82F6" />
                      <line
                        x1={railX}
                        y1={inputWireY}
                        x2={level1GateX}
                        y2={inputWireY}
                        stroke="#64748B"
                        strokeWidth="1.5"
                      />
                      {conn.inverted && (
                        <circle
                          cx={level1GateX - 4}
                          cy={inputWireY}
                          r="3"
                          fill="white"
                          stroke="#E11D48"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  );
                })}

                {isAndGate ? (
                  <path
                    d={`M ${level1GateX} ${gateY} H ${level1GateX + gateW / 2} A ${gateH / 2} ${gateH / 2} 0 0 1 ${level1GateX + gateW / 2} ${gateY + gateH} H ${level1GateX} Z`}
                    fill="#3B82F6"
                    fillOpacity="0.12"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                ) : (
                  <path
                    d={`M ${level1GateX} ${gateY} Q ${level1GateX + 12} ${gateCenterY} ${level1GateX} ${gateY + gateH} Q ${level1GateX + gateW * 0.7} ${gateY + gateH * 0.9} ${level1GateX + gateW} ${gateCenterY} Q ${level1GateX + gateW * 0.7} ${gateY + gateH * 0.1} ${level1GateX} ${gateY} Z`}
                    fill="#10B981"
                    fillOpacity="0.12"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                )}

                {hasOutputBubble && (
                  <circle
                    cx={level1GateX + gateW + 4}
                    cy={gateCenterY}
                    r="4"
                    fill="white"
                    stroke={isAndGate ? '#3B82F6' : '#10B981'}
                    strokeWidth="1.5"
                  />
                )}

                <line
                  x1={level1GateX + gateW + (hasOutputBubble ? 8 : 0)}
                  y1={gateCenterY}
                  x2={level2GateX - 20}
                  y2={gateCenterY}
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                <line
                  x1={level2GateX - 20}
                  y1={gateCenterY}
                  x2={level2GateX - 20}
                  y2={
                    numGates === 1
                      ? level2GateY + gateHeight / 2
                      : level2GateY + 8 + (idx * (gateHeight - 16)) / (numGates - 1)
                  }
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                <line
                  x1={level2GateX - 20}
                  y1={
                    numGates === 1
                      ? level2GateY + gateHeight / 2
                      : level2GateY + 8 + (idx * (gateHeight - 16)) / (numGates - 1)
                  }
                  x2={level2GateX}
                  y2={
                    numGates === 1
                      ? level2GateY + gateHeight / 2
                      : level2GateY + 8 + (idx * (gateHeight - 16)) / (numGates - 1)
                  }
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {(() => {
            const isLevel2Or = solutionMode === 'SOP';
            const gateW = 54;
            const gateH = gateHeight;
            const gateCenterY = level2GateY + gateH / 2;
            const hasOutputBubble = useUniversalGates;

            return (
              <g>
                {isLevel2Or ? (
                  <path
                    d={`M ${level2GateX} ${level2GateY} Q ${level2GateX + 14} ${gateCenterY} ${level2GateX} ${level2GateY + gateH} Q ${level2GateX + gateW * 0.7} ${level2GateY + gateH * 0.9} ${level2GateX + gateW} ${gateCenterY} Q ${level2GateX + gateW * 0.7} ${level2GateY + gateH * 0.1} ${level2GateX} ${level2GateY} Z`}
                    fill="#10B981"
                    fillOpacity="0.15"
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />
                ) : (
                  <path
                    d={`M ${level2GateX} ${level2GateY} H ${level2GateX + gateW / 2} A ${gateH / 2} ${gateH / 2} 0 0 1 ${level2GateX + gateW / 2} ${level2GateY + gateH} H ${level2GateX} Z`}
                    fill="#3B82F6"
                    fillOpacity="0.15"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                  />
                )}

                {hasOutputBubble && (
                  <circle
                    cx={level2GateX + gateW + 4}
                    cy={gateCenterY}
                    r="4"
                    fill="white"
                    stroke={isLevel2Or ? '#10B981' : '#3B82F6'}
                    strokeWidth="1.5"
                  />
                )}

                <line
                  x1={level2GateX + gateW + (hasOutputBubble ? 8 : 0)}
                  y1={gateCenterY}
                  x2={outputX}
                  y2={gateCenterY}
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  className="stroke-slate-800 dark:stroke-slate-100"
                />
                <circle
                  cx={outputX}
                  cy={gateCenterY}
                  r="3.5"
                  fill="#1E293B"
                  className="fill-slate-800 dark:fill-slate-100"
                />
                <text
                  x={outputX + 12}
                  y={gateCenterY + 4}
                  fontSize="14"
                  fontWeight="bold"
                  fill="#00629B"
                  className="fill-blue-600 dark:fill-blue-400"
                >
                  F
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
