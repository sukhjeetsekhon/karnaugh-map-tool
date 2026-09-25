import React from 'react';
import { VariableCount, Implicant, CellCoord } from '../../types';
import { mintermToCoord } from '../../logic/grayCode';

interface KMapOverlayProps {
  numVars: VariableCount;
  implicants: Implicant[];
  activeImplicantId: string | null;
  cellWidth: number;
  cellHeight: number;
  gridRows: number;
  gridCols: number;
}

interface RectPiece {
  rStart: number;
  rEnd: number;
  cStart: number;
  cEnd: number;
  wrapTop: boolean;
  wrapBottom: boolean;
  wrapLeft: boolean;
  wrapRight: boolean;
}

export const KMapOverlay: React.FC<KMapOverlayProps> = ({
  numVars,
  implicants,
  activeImplicantId,
  cellWidth,
  cellHeight,
  gridRows,
  gridCols,
}) => {
  function getPiecesForImplicant(implicant: Implicant): RectPiece[] {
    const coords: CellCoord[] = implicant.minterms.map((m) => mintermToCoord(numVars, m));
    const rowSet = Array.from(new Set(coords.map((c) => c.row))).sort((a, b) => a - b);
    const colSet = Array.from(new Set(coords.map((c) => c.col))).sort((a, b) => a - b);

    const rowSegments: { start: number; end: number; wrapTop: boolean; wrapBottom: boolean }[] = [];
    if (gridRows === 4 && rowSet.length === 2 && rowSet[0] === 0 && rowSet[1] === 3) {
      rowSegments.push({ start: 0, end: 0, wrapTop: true, wrapBottom: false });
      rowSegments.push({ start: 3, end: 3, wrapTop: false, wrapBottom: true });
    } else {
      rowSegments.push({
        start: rowSet[0],
        end: rowSet[rowSet.length - 1],
        wrapTop: false,
        wrapBottom: false,
      });
    }

    const colSegments: { start: number; end: number; wrapLeft: boolean; wrapRight: boolean }[] = [];
    if (gridCols === 4 && colSet.length === 2 && colSet[0] === 0 && colSet[1] === 3) {
      colSegments.push({ start: 0, end: 0, wrapLeft: true, wrapRight: false });
      colSegments.push({ start: 3, end: 3, wrapLeft: false, wrapRight: true });
    } else {
      colSegments.push({
        start: colSet[0],
        end: colSet[colSet.length - 1],
        wrapLeft: false,
        wrapRight: false,
      });
    }

    const pieces: RectPiece[] = [];
    for (const rSeg of rowSegments) {
      for (const cSeg of colSegments) {
        pieces.push({
          rStart: rSeg.start,
          rEnd: rSeg.end,
          cStart: cSeg.start,
          cEnd: cSeg.end,
          wrapTop: rSeg.wrapTop,
          wrapBottom: rSeg.wrapBottom,
          wrapLeft: cSeg.wrapLeft,
          wrapRight: cSeg.wrapRight,
        });
      }
    }

    return pieces;
  }

  const svgWidth = gridCols * cellWidth;
  const svgHeight = gridRows * cellHeight;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none w-full h-full overflow-visible z-10"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      {implicants.map((implicant, impIndex) => {
        const isHovered = activeImplicantId === implicant.id;
        const isAnyHovered = activeImplicantId !== null;
        const opacity = isAnyHovered ? (isHovered ? 1 : 0.25) : 0.85;
        const strokeWidth = isHovered ? 3.5 : 2.5;

        const offset = (impIndex % 4) * 3 + 6;
        const pieces = getPiecesForImplicant(implicant);

        return (
          <g key={implicant.id} style={{ opacity, transition: 'opacity 0.2s ease-in-out' }}>
            {pieces.map((p, pIdx) => {
              const x1 = p.cStart * cellWidth + offset;
              const y1 = p.rStart * cellHeight + offset;
              const x2 = (p.cEnd + 1) * cellWidth - offset;
              const y2 = (p.rEnd + 1) * cellHeight - offset;

              const r = 12;

              if (!p.wrapTop && !p.wrapBottom && !p.wrapLeft && !p.wrapRight) {
                return (
                  <rect
                    key={pIdx}
                    x={x1}
                    y={y1}
                    width={x2 - x1}
                    height={y2 - y1}
                    rx={r}
                    ry={r}
                    fill={implicant.color}
                    fillOpacity={isHovered ? 0.28 : 0.15}
                    stroke={implicant.color}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                  />
                );
              }

              const actualX1 = p.wrapLeft ? 0 : x1;
              const actualX2 = p.wrapRight ? svgWidth : x2;
              const actualY1 = p.wrapTop ? 0 : y1;
              const actualY2 = p.wrapBottom ? svgHeight : y2;

              const tlRadius = !p.wrapTop && !p.wrapLeft ? r : 0;
              const trRadius = !p.wrapTop && !p.wrapRight ? r : 0;
              const brRadius = !p.wrapBottom && !p.wrapRight ? r : 0;
              const blRadius = !p.wrapBottom && !p.wrapLeft ? r : 0;

              const pathData = `
                M ${actualX1 + tlRadius} ${actualY1}
                H ${actualX2 - trRadius}
                ${trRadius ? `A ${trRadius} ${trRadius} 0 0 1 ${actualX2} ${actualY1 + trRadius}` : ''}
                V ${actualY2 - brRadius}
                ${brRadius ? `A ${brRadius} ${brRadius} 0 0 1 ${actualX2 - brRadius} ${actualY2}` : ''}
                H ${actualX1 + blRadius}
                ${blRadius ? `A ${blRadius} ${blRadius} 0 0 1 ${actualX1} ${actualY2 - blRadius}` : ''}
                V ${actualY1 + tlRadius}
                ${tlRadius ? `A ${tlRadius} ${tlRadius} 0 0 1 ${actualX1 + tlRadius} ${actualY1}` : ''}
                Z
              `;

              return (
                <path
                  key={pIdx}
                  d={pathData}
                  fill={implicant.color}
                  fillOpacity={isHovered ? 0.28 : 0.15}
                  stroke={implicant.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={p.wrapLeft || p.wrapRight || p.wrapTop || p.wrapBottom ? '5 3' : undefined}
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
