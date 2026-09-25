# 🗺️ Interactive Karnaugh Map Tool
### Designed for UCSD CSE 140: Components & Design Techniques for Digital Systems

[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![UCSD CSE 140](https://img.shields.io/badge/UCSD-CSE_140-182B49.svg?logo=google-classroom&logoColor=FFCD00)](https://cseweb.ucsd.edu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An interactive, pedagogical Karnaugh Map (K-map) web application built specifically for students and instructors in **UCSD CSE 140** (Digital Systems & Boolean Logic). The tool bridges algebraic boolean logic, visual subcube grouping, exact Quine-McCluskey minimization, and gate-level circuit synthesis.

Please note that this code is written with AI and is not a representation of my coding ability. I just want to create a useful tool to help with studying and understanding computer engineering concepts.

---

## 🌟 Key Features

### 1. Flexible Variable Dimensions ($2$ to $4$ Inputs: $A, B, C, D$)
- **2-Variable** ($A, B$): $2 \times 2$ grid covering minterms $m_0 \dots m_3$
- **3-Variable** ($A, B, C$): $2 \times 4$ grid covering minterms $m_0 \dots m_7$ with Row $A$ and Columns $BC$
- **4-Variable** ($A, B, C, D$): $4 \times 4$ grid covering minterms $m_0 \dots m_{15}$ with Rows $AB$ and Columns $CD$
- Standard Gray code ordering (`00`, `01`, `11`, `10`) ensuring adjacent cells differ by exactly 1 bit.
- Every cell features minterm subscript labels ($m_i$) and full binary coordinate tags ($0000_2 \dots 1111_2$).

### 2. Four-Way Synchronized Inputs
- **Interactive K-Map Grid**:
  - Left-click a cell to cycle values: `0` $\to$ `1` $\to$ `X` (Don't-Care) $\to$ `0`.
  - Right-click a cell for quick-setting `X` (Don't-Care).
- **Numeric Minterm / Maxterm Bar**:
  - Enter numeric minterms and don't-cares directly: $\Sigma m(1, 3, 5, 7) + d(0, 2)$ or maxterms $\Pi M(0, 2) \cdot D(4)$.
  - Batch action buttons: **Clear All (0s)**, **All 1s**, **Invert**, and **Randomize**.
- **Boolean Expression Parser**:
  - Evaluates algebraic expressions in real time:
    - Postfix prime notation: `A'B + C'D`
    - Prefix NOT / C-style / Verilog operators: `!A & B | C & !D` or `~A * B + ~C * D`
    - Implicit multiplication (adjacent literals): `AB`, `A(B + C)`
    - Exclusive OR (XOR): `A ^ B` or `A ⊕ B`
- **Synchronized Truth Table**:
  - Displays all $2^n$ binary combinations alongside output $F$.
  - Click any row's $F$ value to cycle `0` $\to$ `1` $\to$ `X` $\to$ `0`.
  - Hovering over an implicant highlights its corresponding rows in the truth table.

### 3. Pedagogical Solver & Implicant Derivation
- **Exact Tabular Minimization**:
  - Implements the complete **Quine-McCluskey** reduction algorithm with **Petrick's branch-and-bound cover selection**.
  - Derives both **Minimal SOP** (Sum of Products) and **Minimal POS** (Product of Sums).
- **Implicant Classification**:
  - Categorizes all **Prime Implicants (PIs)** and highlights **Essential Prime Implicants (EPIs)** with gold badges.
  - Interactive **Prime Implicant Coverage Table** shows which minterms each implicant covers, highlighting columns with a single checkmark (uniquely covered minterms).
- **Toroidal Wrap-Around Loop Visualizer (SVG)**:
  - Draws rounded, color-coded rectangles directly on the K-map.
  - Supports **cylindrical edge wrapping** (left $\leftrightarrow$ right, top $\leftrightarrow$ bottom).
  - Supports **4-corner wrapping** ($m_0, m_2, m_8, m_{10} = B'D'$ in 4-variable maps).
  - Bidirectional hover highlighting: hovering an implicant in the equation or chart illuminates its corresponding loop on the map.

### 4. Interactive Practice & Self-Test Mode
- **Custom Group Builder**:
  - Switch to Practice Mode and click cells on the K-map to select candidate subcubes.
  - Click **Add Group** to assign distinct color tags to your proposed groupings.
- **Pedagogical Diagnostic Feedback ("Check My Solution")**:
  - Validates power-of-2 sizes ($1, 2, 4, 8, 16$).
  - Validates geometric Gray code subcube shapes (including toroidal wrapping).
  - Flags illegal grouping of `0` cells when grouping for 1s.
  - Alerts you to **uncovered minterms**, **redundant groups**, and **non-prime groups** (groups that could be expanded to a larger power of 2).
  - Plays a **confetti celebration** when an optimal minimal cover is discovered!
- **Reveal Solution**: Toggle to inspect the optimal solver solution and compare it with your work.

### 5. 2-Level Gate Logic Circuit Schematic
- Generates an interactive SVG schematic of the synthesized circuit:
  - **SOP Mode**: Standard **AND-OR** network with toggle for universal **NAND-NAND** equivalent.
  - **POS Mode**: Standard **OR-AND** network with toggle for universal **NOR-NOR** equivalent.
  - Features vertical input rails ($A, B, C, D$), input node dots, inversion bubbles, and clean Manhattan routing wires to output $F$.

### 6. Homework Export Suite & Presets
- **Export to LaTeX / TikZ**: Formatted LaTeX code (`\begin{tabular} ... \end{tabular}`) and minimized math equations ready to paste into Overleaf homework assignments.
- **Synthesizable Verilog HDL**: Exports standard `module kmap_circuit (...)` definitions with bitwise assign logic.
- **Notation Switcher**: Instantly switch between Prime tick ($A'B + C'$) and Overline ($\bar{A}B + \bar{C}$) notation.
- **Built-in UCSD CSE 140 Presets**:
  1. *1-Bit Full Adder Carry Out ($C_{out} = AB + BC + AC$)*
  2. *1-Bit Full Adder Sum ($S = A \oplus B \oplus C_{in}$)*
  3. *7-Segment Display: Segment $a$ (with BCD don't-cares $10 \dots 15$)*
  4. *7-Segment Display: Segment $e$*
  5. *4-Input Majority Voter*
  6. *4-Input Parity Generator*
  7. *4-Corner Wrap Classic ($m_0, m_2, m_8, m_{10}$)*
  8. *BCD Invalid Code Detector*
  9. *2-Variable XOR Function*

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer recommended)
- `npm` (packaged with Node.js)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/bjsek/karnaugh-map-tool.git
cd karnaugh-map-tool

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` (or the URL displayed in the terminal).

### Production Build
To create a production-optimized build:
```bash
npm run build
```
The compiled, zero-dependency static bundle will be written to the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 🏗️ Project Architecture

```
karnaugh-map-tool/
├── index.html                   # HTML entry point with fonts & meta tags
├── favicon.svg                  # UCSD-themed K-map vector icon
├── package.json                 # Dependencies & build scripts
├── tsconfig.json                # TypeScript strict configuration
├── tailwind.config.js           # Tailwind configuration with UCSD palette
├── vite.config.ts               # Vite configuration with relative base path
└── src/
    ├── main.tsx                 # React DOM root entry
    ├── App.tsx                  # Main application orchestrator
    ├── index.css                # Global styles & custom scrollbars
    ├── types/
    │   └── index.ts             # TypeScript interfaces for K-map, implicants, & solver
    ├── logic/
    │   ├── grayCode.ts          # Gray code mappings, coordinate transforms, term formatters
    │   ├── parser.ts            # Recursive-descent boolean algebraic expression parser
    │   ├── quineMcCluskey.ts    # Quine-McCluskey reduction, PI/EPI derivation, Petrick's solver
    │   ├── verifier.ts          # Practice mode subcube shape & minimal cover validator
    │   └── presets.ts           # Curated UCSD CSE 140 classic digital design problems
    └── components/
        ├── KMap/
        │   ├── KMapGrid.tsx     # Interactive 2D Karnaugh map grid
        │   └── KMapOverlay.tsx  # SVG loop overlay renderer with toroidal wrap-around
        ├── Inputs/
        │   ├── MintermBar.tsx   # Numerical minterm/maxterm/don't-care input
        │   ├── ExpressionInput.tsx # Boolean expression parser bar
        │   └── TruthTable.tsx   # Synchronized truth table with row highlighting
        ├── Solver/
        │   └── SolverView.tsx   # Minimal equations, PI/EPI badges, coverage chart
        ├── Practice/
        │   └── PracticeMode.tsx # Interactive homework self-test & error diagnostic suite
        ├── Circuit/
        │   └── CircuitViewer.tsx# 2-level logic gate schematic generator (AND-OR/NAND-NAND)
        ├── Export/
        │   └── ExportModal.tsx  # LaTeX & Verilog export dialog
        └── Header/
            └── PresetSelector.tsx # Textbook preset dropdown
```

---

## 🧮 Algorithm Details

### 1. Quine-McCluskey Reduction
1. **Grouping by Hamming Weight**: Minterms and don't-cares are partitioned into groups based on their count of `1` bits.
2. **Successive Merging**: Adjacent groups are compared. Any two terms differing by exactly one bit position are combined, replacing the varying bit with `-`.
3. **Prime Implicant Extraction**: Terms that cannot be combined with any other term are saved as **Prime Implicants (PIs)**.

### 2. Petrick's Method & Minimal Cover Selection
1. **Coverage Matrix**: Columns represent 1-minterms (don't-cares are omitted from columns as they do not require coverage). Rows represent Prime Implicants.
2. **Essential Prime Implicants (EPIs)**: Any column with a single checkmark identifies an Essential Prime Implicant. All EPIs are unconditionally added to the minimal cover.
3. **Branch-and-Bound Cover**: If uncovered minterms remain, branch-and-bound minimal set cover identifies the smallest subset of remaining PIs with the least number of total literals.

### 3. Subcube Mathematical Verification
A collection of cells forms a valid rectangular subcube of size $2^k$ if and only if there exists a unique ternary pattern (composed of $0, 1, -$ with exactly $k$ dashes) that generates precisely that set of minterms. This unified test naturally validates all cylindrical edge wraps and 4-corner wraps without requiring special-case geometric hacks.

---

## 🚢 Deploying to GitHub Pages

This project is pre-configured with a relative base path (`base: './'` in `vite.config.ts`) for seamless GitHub Pages hosting:

1. Push your repository to GitHub.
2. Go to **Settings** $\to$ **Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch** or use a **GitHub Actions** Vite deployment workflow.
   - Branch: `gh-pages` (or select the branch containing your `dist/` directory).
4. Your interactive Karnaugh Map tool is immediately live!

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with ❤️ for students, TAs, and instructors of **UCSD CSE 140**.
