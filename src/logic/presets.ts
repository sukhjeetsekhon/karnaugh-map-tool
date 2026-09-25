import { PresetProblem } from '../types';

export const PRESET_PROBLEMS: PresetProblem[] = [
  {
    name: '1-Bit Full Adder Carry Out (Cout)',
    description: 'CSE 140 Classic: 3-variable carry generator Cout = AB + BC + AC',
    numVars: 3,
    minterms: [3, 5, 6, 7],
    dontCares: [],
  },
  {
    name: '1-Bit Full Adder Sum (S)',
    description: 'CSE 140 Classic: 3-variable odd parity checker S = A ⊕ B ⊕ Cin',
    numVars: 3,
    minterms: [1, 2, 4, 7],
    dontCares: [],
  },
  {
    name: '7-Segment Display: Segment a',
    description: 'BCD digit display driver for segment "a" with don\'t-cares for invalid BCD (10-15)',
    numVars: 4,
    minterms: [0, 2, 3, 5, 6, 7, 8, 9],
    dontCares: [10, 11, 12, 13, 14, 15],
  },
  {
    name: '7-Segment Display: Segment e',
    description: 'BCD digit display driver for segment "e" (lower-left vertical bar)',
    numVars: 4,
    minterms: [0, 2, 6, 8],
    dontCares: [10, 11, 12, 13, 14, 15],
  },
  {
    name: '4-Input Majority Voter',
    description: 'High whenever 3 or 4 voters vote YES (1)',
    numVars: 4,
    minterms: [7, 11, 13, 14, 15],
    dontCares: [],
  },
  {
    name: '4-Input Even Parity Checker',
    description: 'Checker function that produces 1 when an even number of inputs are 1',
    numVars: 4,
    minterms: [0, 3, 5, 6, 9, 10, 12, 15],
    dontCares: [],
  },
  {
    name: '4-Corner Wrap Classic',
    description: 'Classic CSE 140 problem demonstrating 4-corner toroidal wrap: m0, m2, m8, m10 = B\'D\'',
    numVars: 4,
    minterms: [0, 2, 8, 10],
    dontCares: [],
  },
  {
    name: 'BCD Invalid Code Detector',
    description: 'Detects illegal binary-coded decimal states (10 through 15) to trigger an error flag',
    numVars: 4,
    minterms: [10, 11, 12, 13, 14, 15],
    dontCares: [],
  },
  {
    name: '2-Variable XOR Function',
    description: 'Simple 2-variable checker demonstrating uncombinable diagonal minterms A\'B + AB\'',
    numVars: 2,
    minterms: [1, 2],
    dontCares: [],
  },
];
