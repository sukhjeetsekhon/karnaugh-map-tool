import { VariableCount } from '../types';

export interface ParseResult {
  isValid: boolean;
  error?: string;
  minterms: number[];
}

type TokenType = 'VAR' | 'CONST' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
}

export function tokenizeBooleanExpression(expr: string): { tokens: Token[]; error?: string } {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.trim();

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/^[a-dA-D]$/.test(ch)) {
      tokens.push({ type: 'VAR', value: ch.toUpperCase() });
      i++;
      while (i < s.length && (s[i] === "'" || s[i] === "’" || s[i] === '`' || s[i] === '\u0305' || s[i] === '\u0304')) {
        tokens.push({ type: 'NOT', value: "'" });
        i++;
      }
      continue;
    }

    if (ch === '0' || ch === '1') {
      tokens.push({ type: 'CONST', value: ch });
      i++;
      continue;
    }

    if (ch === '!' || ch === '~' || ch === '¬') {
      tokens.push({ type: 'NOT', value: '!' });
      i++;
      continue;
    }

    if (ch === "'" || ch === "’" || ch === '`') {
      tokens.push({ type: 'NOT', value: "'" });
      i++;
      continue;
    }

    if (ch === '*' || ch === '&' || ch === '·' || ch === '∧') {
      if (ch === '&' && i + 1 < s.length && s[i + 1] === '&') {
        i++;
      }
      tokens.push({ type: 'AND', value: '*' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '|' || ch === '∨') {
      if (ch === '|' && i + 1 < s.length && s[i + 1] === '|') {
        i++;
      }
      tokens.push({ type: 'OR', value: '+' });
      i++;
      continue;
    }

    if (ch === '^' || ch === '⊕') {
      tokens.push({ type: 'XOR', value: '^' });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      while (i < s.length && (s[i] === "'" || s[i] === "’" || s[i] === '`')) {
        tokens.push({ type: 'NOT', value: "'" });
        i++;
      }
      continue;
    }

    const remaining = s.slice(i);
    const wordMatch = remaining.match(/^(and|or|xor|not)\b/i);
    if (wordMatch) {
      const word = wordMatch[1].toLowerCase();
      if (word === 'and') tokens.push({ type: 'AND', value: '*' });
      else if (word === 'or') tokens.push({ type: 'OR', value: '+' });
      else if (word === 'xor') tokens.push({ type: 'XOR', value: '^' });
      else if (word === 'not') tokens.push({ type: 'NOT', value: '!' });
      i += wordMatch[0].length;
      continue;
    }

    return { tokens: [], error: `Unexpected character: '${ch}' at position ${i + 1}` };
  }

  const implicitTokens: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    implicitTokens.push(cur);

    if (j + 1 < tokens.length) {
      const next = tokens[j + 1];
      const curCanEndTerm = cur.type === 'VAR' || cur.type === 'CONST' || cur.type === 'RPAREN' || (cur.type === 'NOT' && cur.value === "'");
      const nextCanStartTerm = next.type === 'VAR' || next.type === 'CONST' || next.type === 'LPAREN' || (next.type === 'NOT' && next.value === '!');

      if (curCanEndTerm && nextCanStartTerm) {
        implicitTokens.push({ type: 'AND', value: '*' });
      }
    }
  }

  return { tokens: implicitTokens };
}

type ASTNode =
  | { type: 'VAR'; name: string }
  | { type: 'CONST'; val: boolean }
  | { type: 'NOT'; child: ASTNode }
  | { type: 'AND'; left: ASTNode; right: ASTNode }
  | { type: 'OR'; left: ASTNode; right: ASTNode }
  | { type: 'XOR'; left: ASTNode; right: ASTNode };

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  public parse(): ASTNode {
    const node = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token '${this.tokens[this.pos].value}' at position ${this.pos}`);
    }
    return node;
  }

  private parseOr(): ASTNode {
    let left = this.parseXor();
    while (this.peek()?.type === 'OR') {
      this.consume();
      const right = this.parseXor();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  private parseXor(): ASTNode {
    let left = this.parseAnd();
    while (this.peek()?.type === 'XOR') {
      this.consume();
      const right = this.parseAnd();
      left = { type: 'XOR', left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseUnary();
    while (this.peek()?.type === 'AND') {
      this.consume();
      const right = this.parseUnary();
      left = { type: 'AND', left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek()?.type === 'NOT' && this.peek()?.value === '!') {
      this.consume();
      const child = this.parseUnary();
      return { type: 'NOT', child };
    }

    let node = this.parsePrimary();

    while (this.peek()?.type === 'NOT' && this.peek()?.value === "'") {
      this.consume();
      node = { type: 'NOT', child: node };
    }

    return node;
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();
    if (!tok) {
      throw new Error('Unexpected end of expression');
    }

    if (tok.type === 'VAR') {
      this.consume();
      return { type: 'VAR', name: tok.value };
    }

    if (tok.type === 'CONST') {
      this.consume();
      return { type: 'CONST', val: tok.value === '1' };
    }

    if (tok.type === 'LPAREN') {
      this.consume();
      const inner = this.parseOr();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error("Missing closing parenthesis ')'");
      }
      this.consume();
      return inner;
    }

    throw new Error(`Unexpected token '${tok.value}'`);
  }
}

function evaluateAst(ast: ASTNode, env: Record<string, boolean>): boolean {
  switch (ast.type) {
    case 'VAR':
      return !!env[ast.name];
    case 'CONST':
      return ast.val;
    case 'NOT':
      return !evaluateAst(ast.child, env);
    case 'AND':
      return evaluateAst(ast.left, env) && evaluateAst(ast.right, env);
    case 'OR':
      return evaluateAst(ast.left, env) || evaluateAst(ast.right, env);
    case 'XOR':
      return evaluateAst(ast.left, env) !== evaluateAst(ast.right, env);
  }
}

export function parseAndEvaluateExpression(expr: string, numVars: VariableCount): ParseResult {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Expression is empty', minterms: [] };
  }

  const { tokens, error: tokenError } = tokenizeBooleanExpression(trimmed);
  if (tokenError) {
    return { isValid: false, error: tokenError, minterms: [] };
  }

  if (tokens.length === 0) {
    return { isValid: false, error: 'Expression is empty', minterms: [] };
  }

  try {
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const allowedVars = ['A', 'B', 'C', 'D'].slice(0, numVars);
    const allowedSet = new Set(allowedVars);

    function checkAllowedVars(node: ASTNode) {
      if (node.type === 'VAR') {
        if (!allowedSet.has(node.name)) {
          throw new Error(`Variable '${node.name}' is outside the current ${numVars}-variable scope (${allowedVars.join(', ')})`);
        }
      } else if (node.type === 'NOT') {
        checkAllowedVars(node.child);
      } else if (node.type === 'AND' || node.type === 'OR' || node.type === 'XOR') {
        checkAllowedVars(node.left);
        checkAllowedVars(node.right);
      }
    }
    checkAllowedVars(ast);

    const totalCombinations = 1 << numVars;
    const minterms: number[] = [];

    for (let m = 0; m < totalCombinations; m++) {
      const env: Record<string, boolean> = {};
      for (let v = 0; v < numVars; v++) {
        const bit = (m >> (numVars - 1 - v)) & 1;
        env[allowedVars[v]] = bit === 1;
      }

      if (evaluateAst(ast, env)) {
        minterms.push(m);
      }
    }

    return { isValid: true, minterms };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: msg, minterms: [] };
  }
}
