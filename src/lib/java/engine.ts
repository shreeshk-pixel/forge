export type Check = { label: string; code: string };

export type TestRow = {
  label: string;
  ok: boolean;
  message: string;
  output: string;
};

export type GradeResult = {
  compileError: string | null;
  results: TestRow[];
};

export type MainResult = {
  error: string | null;
  output: string;
};

export class JavaError extends Error {
  line: number;
  constructor(message: string, line = 0) {
    super(line > 0 ? `Line ${line}: ${message}` : message);
    this.line = line;
    this.name = "JavaError";
  }
}

class Thrown {
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}
class ReturnSignal {
  value: JV;
  constructor(value: JV) {
    this.value = value;
  }
}
class BreakSignal {}
class ContinueSignal {}

type Tok = { kind: "eof" | "ident" | "num" | "str" | "char" | "op" | "kw"; v: string; line: number };

type TypeN = { name: string; dims: number };

type Expr =
  | { k: "num"; v: string; line: number }
  | { k: "str"; v: string; line: number }
  | { k: "char"; v: string; line: number }
  | { k: "name"; v: string; line: number }
  | { k: "this"; line: number }
  | { k: "super"; line: number }
  | { k: "null"; line: number }
  | { k: "bool"; v: boolean; line: number }
  | { k: "unary"; op: string; e: Expr; line: number }
  | { k: "bin"; op: string; l: Expr; r: Expr; line: number }
  | { k: "assign"; op: string; l: Expr; r: Expr; line: number }
  | { k: "invoke"; target: Expr; args: Expr[]; line: number }
  | { k: "index"; obj: Expr; index: Expr; line: number }
  | { k: "get"; obj: Expr; name: string; line: number }
  | { k: "newObj"; name: string; args: Expr[]; line: number }
  | { k: "newArr"; base: string; sizes: Expr[]; line: number }
  | { k: "newInit"; base: string; dims: number; elems: Expr[]; line: number }
  | { k: "arrLit"; elems: Expr[]; line: number }
  | { k: "cast"; type: TypeN; e: Expr; line: number }
  | { k: "instanceof"; e: Expr; type: string; line: number };

type Stmt =
  | { k: "block"; body: Stmt[] }
  | { k: "var"; type: TypeN; name: string; init: Expr | null; line: number }
  | { k: "expr"; e: Expr }
  | { k: "if"; cond: Expr; then: Stmt; elseB: Stmt | null }
  | { k: "while"; cond: Expr; body: Stmt }
  | { k: "for"; init: Stmt | null; cond: Expr | null; update: Expr | null; body: Stmt }
  | { k: "foreach"; type: TypeN; name: string; iter: Expr; body: Stmt; line: number }
  | { k: "return"; e: Expr | null; line: number }
  | { k: "throw"; e: Expr; line: number }
  | { k: "break" }
  | { k: "continue" }
  | { k: "empty" };

type JV =
  | { t: "int"; v: number }
  | { t: "double"; v: number }
  | { t: "bool"; v: boolean }
  | { t: "str"; v: string; id: number; ch: boolean }
  | { t: "null" }
  | { t: "void" }
  | { t: "arr"; v: JV[]; elem: string; dims: number; id: number }
  | { t: "obj"; cls: string; id: number; fields: Record<string, JV>; native?: NativeData }
  | { t: "class"; name: string };

type NativeData =
  | { kind: "list"; items: JV[] }
  | { kind: "map"; items: { k: JV; v: JV }[] }
  | { kind: "stack"; items: JV[] }
  | { kind: "queue"; items: JV[] }
  | { kind: "deque"; items: JV[] };

type RTField = {
  name: string;
  type: TypeN;
  access: "public" | "private";
  isStatic: boolean;
  isFinal: boolean;
  init: Expr | null;
  owner: string;
};

type RTMethod = {
  name: string;
  access: "public" | "private";
  isStatic: boolean;
  isAbstract: boolean;
  ret: TypeN;
  params: TypeN[];
  paramNames: string[];
  body: Stmt[] | null;
  native?: (ctx: Ctx, self: JV | null, args: JV[], line: number) => JV;
  owner: string;
  line: number;
};

type RTCtor = {
  params: TypeN[];
  paramNames: string[];
  body: Stmt[];
  line: number;
};

type RTClass = {
  name: string;
  kind: "class" | "interface";
  isAbstract: boolean;
  isFinal: boolean;
  superName: string | null;
  ifaces: string[];
  fields: RTField[];
  methods: RTMethod[];
  ctors: RTCtor[];
  statics: Record<string, JV>;
  builtin?: "list" | "map" | "stack" | "queue" | "deque" | "core";
};

type Ctx = {
  world: Map<string, RTClass>;
  frames: Map<string, JV>[];
  self: JV | null;
  execClass: string | null;
  steps: number;
  depth: number;
  out: string[];
  outLen: number;
  strIds: Map<string, number>;
  nextId: number;
};

const KW = new Set([
  "class",
  "interface",
  "abstract",
  "extends",
  "implements",
  "public",
  "private",
  "protected",
  "static",
  "final",
  "void",
  "int",
  "double",
  "boolean",
  "char",
  "if",
  "else",
  "for",
  "while",
  "return",
  "new",
  "this",
  "super",
  "null",
  "true",
  "false",
  "throw",
  "instanceof",
  "import",
  "package",
  "break",
  "continue",
]);

const STEP_LIMIT = 250_000;
const DEPTH_LIMIT = 400;

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const push = (kind: Tok["kind"], v: string) => out.push({ kind, v, line });
  while (i < n) {
    const c = src[i]!;
    if (c === "\n") {
      line++;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") line++;
        i++;
      }
      if (i >= n) throw new JavaError("Unclosed comment", line);
      i += 2;
      continue;
    }
    if (c === '"') {
      i++;
      let s = "";
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\") {
          const e = src[i + 1] ?? "";
          s += e === "n" ? "\n" : e === "t" ? "\t" : e === "\\" ? "\\" : e === '"' ? '"' : e;
          i += 2;
          continue;
        }
        if (src[i] === "\n") line++;
        s += src[i];
        i++;
      }
      if (src[i] !== '"') throw new JavaError("Unclosed string", line);
      i++;
      push("str", s);
      continue;
    }
    if (c === "'") {
      i++;
      let s = "";
      if (src[i] === "\\") {
        const e = src[i + 1] ?? "";
        s = e === "n" ? "\n" : e === "t" ? "\t" : e === "'" ? "'" : e === "\\" ? "\\" : e;
        i += 2;
      } else {
        s = src[i] ?? "";
        if (s === "") throw new JavaError("Empty character literal", line);
        i++;
      }
      if (src[i] !== "'") throw new JavaError("Unclosed character literal", line);
      i++;
      push("char", s);
      continue;
    }
    if (/[0-9]/.test(c)) {
      let s = "";
      while (i < n && /[0-9_]/.test(src[i]!)) {
        if (src[i] !== "_") s += src[i];
        i++;
      }
      if (src[i] === "." && /[0-9]/.test(src[i + 1] ?? "")) {
        s += ".";
        i++;
        while (i < n && /[0-9_]/.test(src[i]!)) {
          if (src[i] !== "_") s += src[i];
          i++;
        }
      }
      push("num", s);
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let s = "";
      while (i < n && /[A-Za-z0-9_]/.test(src[i]!)) {
        s += src[i];
        i++;
      }
      push(KW.has(s) ? "kw" : "ident", s);
      continue;
    }
    const two = src.slice(i, i + 2);
    const twos = ["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%="];
    if (twos.includes(two)) {
      push("op", two);
      i += 2;
      continue;
    }
    if ("{}()[];,.=+-*/%!<>:".includes(c)) {
      push("op", c);
      i++;
      continue;
    }
    throw new JavaError(`Unexpected character '${c}'`, line);
  }
  push("eof", "");
  return out;
}

class Parser {
  private i = 0;
  private readonly t: Tok[];
  constructor(t: Tok[]) {
    this.t = t;
  }

  private cur(): Tok {
    return this.t[this.i] ?? { kind: "eof", v: "", line: 0 };
  }
  private line(): number {
    return this.cur().line;
  }
  private isOp(v: string): boolean {
    const c = this.cur();
    return c.kind === "op" && c.v === v;
  }
  private isKw(v: string): boolean {
    const c = this.cur();
    return c.kind === "kw" && c.v === v;
  }
  private eatOp(v: string): void {
    if (!this.isOp(v)) throw new JavaError(`Expected '${v}'`, this.line());
    this.i++;
  }
  private eatKw(v?: string): string {
    const c = this.cur();
    if (c.kind !== "kw" || (v && c.v !== v)) throw new JavaError(v ? `Expected '${v}'` : "Expected keyword", c.line);
    this.i++;
    return c.v;
  }
  private eatIdent(): string {
    const c = this.cur();
    if (c.kind !== "ident") throw new JavaError("Expected a name", c.line);
    this.i++;
    return c.v;
  }

  parseFile(): ParsedClass[] {
    const classes: ParsedClass[] = [];
    while (this.cur().kind !== "eof") {
      if (this.isKw("package") || this.isKw("import")) {
        while (this.cur().kind !== "eof" && !this.isOp(";")) this.i++;
        if (this.isOp(";")) this.i++;
        continue;
      }
      classes.push(this.parseTypeDecl());
    }
    return classes;
  }

  private parseTypeDecl(): ParsedClass {
    const mods = this.parseMods();
    const line = this.line();
    let kind: "class" | "interface" = "class";
    if (this.isKw("interface")) {
      kind = "interface";
      this.i++;
    } else if (this.isKw("class")) {
      this.i++;
    } else throw new JavaError("Expected class or interface", line);
    const name = this.eatIdent();
    let superName: string | null = null;
    if (this.isKw("extends")) {
      this.i++;
      superName = this.eatIdent();
    }
    const ifaces: string[] = [];
    if (this.isKw("implements")) {
      this.i++;
      ifaces.push(this.eatIdent());
      while (this.isOp(",")) {
        this.i++;
        ifaces.push(this.eatIdent());
      }
    }
    this.eatOp("{");
    const fields: ParsedField[] = [];
    const methods: ParsedMethod[] = [];
    const ctors: ParsedCtor[] = [];
    while (!this.isOp("}") && this.cur().kind !== "eof") {
      this.parseMember(name, kind, fields, methods, ctors);
    }
    this.eatOp("}");
    return {
      name,
      kind,
      isAbstract: mods.ab || kind === "interface",
      isFinal: mods.fin,
      superName,
      ifaces,
      fields,
      methods,
      ctors,
      line,
    };
  }

  private parseMods(): { pub: boolean; priv: boolean; stat: boolean; fin: boolean; ab: boolean } {
    const m = { pub: false, priv: false, stat: false, fin: false, ab: false };
    for (;;) {
      if (this.isKw("public")) {
        m.pub = true;
        this.i++;
      } else if (this.isKw("private")) {
        m.priv = true;
        this.i++;
      } else if (this.isKw("protected")) {
        m.pub = true;
        this.i++;
      } else if (this.isKw("static")) {
        m.stat = true;
        this.i++;
      } else if (this.isKw("final")) {
        m.fin = true;
        this.i++;
      } else if (this.isKw("abstract")) {
        m.ab = true;
        this.i++;
      } else break;
    }
    return m;
  }

  private parseMember(
    className: string,
    kind: "class" | "interface",
    fields: ParsedField[],
    methods: ParsedMethod[],
    ctors: ParsedCtor[],
  ): void {
    const mods = this.parseMods();
    const line = this.line();
    if (this.cur().kind === "ident" && this.cur().v === className && this.t[this.i + 1]?.v === "(") {
      this.i++;
      const params = this.parseParams();
      this.eatOp("{");
      const body = this.parseBlockBody();
      ctors.push({
        params: params.map((p) => p.type),
        paramNames: params.map((p) => p.name),
        body,
        line,
      });
      return;
    }
    const type = this.parseType();
    const name = this.eatIdent();
    if (this.isOp("(")) {
      const params = this.parseParams();
      const isAbstract = kind === "interface" || mods.ab || this.isOp(";");
      let body: Stmt[] | null = null;
      if (this.isOp(";")) {
        this.i++;
      } else {
        this.eatOp("{");
        body = this.parseBlockBody();
      }
      methods.push({
        name,
        access: mods.priv ? "private" : "public",
        isStatic: mods.stat,
        isAbstract: isAbstract || body === null,
        ret: type,
        params: params.map((p) => p.type),
        paramNames: params.map((p) => p.name),
        body,
        line,
      });
      return;
    }
    let init: Expr | null = null;
    if (this.isOp("=")) {
      this.i++;
      init = this.isOp("{") ? this.parseArrLit() : this.parseExpr();
    }
    this.eatOp(";");
    fields.push({
      name,
      type,
      access: mods.priv ? "private" : "public",
      isStatic: mods.stat,
      isFinal: mods.fin,
      init,
      line,
    });
  }

  private parseType(): TypeN {
    const c = this.cur();
    let name = "";
    if (c.kind === "kw" && ["int", "double", "boolean", "char", "void"].includes(c.v)) {
      name = c.v;
      this.i++;
    } else if (c.kind === "ident") {
      name = c.v;
      this.i++;
    } else throw new JavaError("Expected a type", c.line);
    if (this.isOp("<")) this.skipGenerics();
    let dims = 0;
    while (this.isOp("[") && this.t[this.i + 1]?.v === "]") {
      this.i += 2;
      dims++;
    }
    return { name, dims };
  }

  private skipGenerics(): void {
    let d = 0;
    const line = this.line();
    do {
      if (this.cur().kind === "eof") throw new JavaError("Unclosed generic", line);
      if (this.isOp("<")) d++;
      else if (this.isOp(">")) d--;
      this.i++;
    } while (d > 0);
  }

  private parseParams(): { type: TypeN; name: string }[] {
    this.eatOp("(");
    const ps: { type: TypeN; name: string }[] = [];
    if (!this.isOp(")")) {
      for (;;) {
        const type = this.parseType();
        const name = this.eatIdent();
        ps.push({ type, name });
        if (this.isOp(",")) {
          this.i++;
          continue;
        }
        break;
      }
    }
    this.eatOp(")");
    return ps;
  }

  private parseBlock(): Stmt {
    this.eatOp("{");
    return { k: "block", body: this.parseBlockBody() };
  }

  private parseBlockBody(): Stmt[] {
    const body: Stmt[] = [];
    while (!this.isOp("}") && this.cur().kind !== "eof") body.push(this.parseStmt());
    this.eatOp("}");
    return body;
  }

  private parseStmt(): Stmt {
    if (this.isOp(";")) {
      this.i++;
      return { k: "empty" };
    }
    if (this.isOp("{")) return this.parseBlock();
    if (this.isKw("if")) {
      const line = this.line();
      this.i++;
      this.eatOp("(");
      const cond = this.parseExpr();
      this.eatOp(")");
      const then = this.parseStmt();
      let elseB: Stmt | null = null;
      if (this.isKw("else")) {
        this.i++;
        elseB = this.parseStmt();
      }
      void line;
      return { k: "if", cond, then, elseB };
    }
    if (this.isKw("while")) {
      this.i++;
      this.eatOp("(");
      const cond = this.parseExpr();
      this.eatOp(")");
      return { k: "while", cond, body: this.parseStmt() };
    }
    if (this.isKw("for")) return this.parseFor();
    if (this.isKw("return")) {
      const line = this.line();
      this.i++;
      let e: Expr | null = null;
      if (!this.isOp(";")) e = this.parseExpr();
      this.eatOp(";");
      return { k: "return", e, line };
    }
    if (this.isKw("throw")) {
      const line = this.line();
      this.i++;
      const e = this.parseExpr();
      this.eatOp(";");
      return { k: "throw", e, line };
    }
    if (this.isKw("break")) {
      this.i++;
      this.eatOp(";");
      return { k: "break" };
    }
    if (this.isKw("continue")) {
      this.i++;
      this.eatOp(";");
      return { k: "continue" };
    }
    if (this.looksLikeDecl()) {
      const line = this.line();
      const type = this.parseType();
      const name = this.eatIdent();
      let init: Expr | null = null;
      if (this.isOp("=")) {
        this.i++;
        init = this.isOp("{") ? this.parseArrLit() : this.parseExpr();
      }
      this.eatOp(";");
      return { k: "var", type, name, init, line };
    }
    const e = this.parseExpr();
    this.eatOp(";");
    return { k: "expr", e };
  }

  private parseFor(): Stmt {
    this.eatKw("for");
    this.eatOp("(");
    if (this.peekForEach()) {
      const line = this.line();
      const type = this.parseType();
      const name = this.eatIdent();
      this.eatOp(":");
      const iter = this.parseExpr();
      this.eatOp(")");
      return { k: "foreach", type, name, iter, body: this.parseStmt(), line };
    }
    let init: Stmt | null = null;
    if (!this.isOp(";")) init = this.parseStmt();
    else this.eatOp(";");
    let cond: Expr | null = null;
    if (!this.isOp(";")) cond = this.parseExpr();
    this.eatOp(";");
    let update: Expr | null = null;
    if (!this.isOp(")")) update = this.parseExpr();
    this.eatOp(")");
    return { k: "for", init, cond, update, body: this.parseStmt() };
  }

  private peekForEach(): boolean {
    let i = this.i;
    const t0 = this.t[i];
    if (!t0) return false;
    if (t0.kind === "kw" && ["int", "double", "boolean", "char"].includes(t0.v)) i++;
    else if (t0.kind === "ident") i++;
    else return false;
    if (this.t[i]?.v === "<") {
      let d = 0;
      for (; i < this.t.length; i++) {
        if (this.t[i]?.v === "<") d++;
        else if (this.t[i]?.v === ">") {
          d--;
          if (d === 0) {
            i++;
            break;
          }
        }
      }
    }
    while (this.t[i]?.v === "[" && this.t[i + 1]?.v === "]") i += 2;
    if (this.t[i]?.kind !== "ident") return false;
    i++;
    return this.t[i]?.v === ":";
  }

  private looksLikeDecl(): boolean {
    const c = this.cur();
    if (c.kind === "kw" && ["int", "double", "boolean", "char"].includes(c.v)) return true;
    if (c.kind !== "ident") return false;
    let i = this.i + 1;
    if (this.t[i]?.v === "<") {
      let d = 0;
      for (; i < this.t.length; i++) {
        if (this.t[i]?.v === "<") d++;
        else if (this.t[i]?.v === ">") {
          d--;
          if (d === 0) {
            i++;
            break;
          }
        }
      }
    }
    while (this.t[i]?.v === "[" && this.t[i + 1]?.v === "]") i += 2;
    return this.t[i]?.kind === "ident";
  }

  private parseExpr(): Expr {
    return this.parseAssign();
  }

  private parseAssign(): Expr {
    const l = this.parseOr();
    const c = this.cur();
    if (c.kind === "op" && ["=", "+=", "-=", "*=", "/=", "%="].includes(c.v)) {
      this.i++;
      const r = this.parseAssign();
      return { k: "assign", op: c.v, l, r, line: l.line };
    }
    return l;
  }

  private parseOr(): Expr {
    let l = this.parseAnd();
    while (this.isOp("||")) {
      const line = this.line();
      this.i++;
      l = { k: "bin", op: "||", l, r: this.parseAnd(), line };
    }
    return l;
  }
  private parseAnd(): Expr {
    let l = this.parseEq();
    while (this.isOp("&&")) {
      const line = this.line();
      this.i++;
      l = { k: "bin", op: "&&", l, r: this.parseEq(), line };
    }
    return l;
  }
  private parseEq(): Expr {
    let l = this.parseRel();
    while (this.isOp("==") || this.isOp("!=")) {
      const op = this.cur().v;
      const line = this.line();
      this.i++;
      l = { k: "bin", op, l, r: this.parseRel(), line };
    }
    return l;
  }
  private parseRel(): Expr {
    let l = this.parseAdd();
    for (;;) {
      if (this.isKw("instanceof")) {
        const line = this.line();
        this.i++;
        const type = this.cur().kind === "ident" ? this.eatIdent() : this.eatKw();
        l = { k: "instanceof", e: l, type, line };
        continue;
      }
      if (this.isOp("<") || this.isOp(">") || this.isOp("<=") || this.isOp(">=")) {
        const op = this.cur().v;
        const line = this.line();
        this.i++;
        l = { k: "bin", op, l, r: this.parseAdd(), line };
        continue;
      }
      break;
    }
    return l;
  }
  private parseAdd(): Expr {
    let l = this.parseMul();
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.cur().v;
      const line = this.line();
      this.i++;
      l = { k: "bin", op, l, r: this.parseMul(), line };
    }
    return l;
  }
  private parseMul(): Expr {
    let l = this.parseUnary();
    while (this.isOp("*") || this.isOp("/") || this.isOp("%")) {
      const op = this.cur().v;
      const line = this.line();
      this.i++;
      l = { k: "bin", op, l, r: this.parseUnary(), line };
    }
    return l;
  }
  private parseUnary(): Expr {
    if (this.isOp("(") && this.looksLikeCast()) {
      const line = this.line();
      this.eatOp("(");
      const type = this.parseType();
      this.eatOp(")");
      return { k: "cast", type, e: this.parseUnary(), line };
    }
    if (this.isOp("!") || this.isOp("-") || this.isOp("++") || this.isOp("--")) {
      const op = this.cur().v;
      const line = this.line();
      this.i++;
      return { k: "unary", op, e: this.parseUnary(), line };
    }
    return this.parsePostfix();
  }

  private looksLikeCast(): boolean {
    let i = this.i + 1;
    const t0 = this.t[i];
    if (!t0) return false;
    if (t0.kind === "kw" && ["int", "double", "boolean", "char"].includes(t0.v)) i++;
    else if (t0.kind === "ident") i++;
    else return false;
    if (this.t[i]?.v === "<") {
      let d = 0;
      for (; i < this.t.length; i++) {
        if (this.t[i]?.v === "<") d++;
        else if (this.t[i]?.v === ">") {
          d--;
          if (d === 0) {
            i++;
            break;
          }
        }
      }
    }
    while (this.t[i]?.v === "[" && this.t[i + 1]?.v === "]") i += 2;
    if (this.t[i]?.v !== ")") return false;
    const n = this.t[i + 1];
    if (!n) return false;
    if (n.kind === "ident" || n.kind === "num" || n.kind === "str" || n.kind === "char") return true;
    if (["(", "!", "-", "++", "--"].includes(n.v)) return true;
    if (["new", "this", "super", "null", "true", "false"].includes(n.v)) return true;
    return false;
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      if (this.isOp("(")) {
        const line = e.line;
        const args = this.parseArgs();
        e = { k: "invoke", target: e, args, line };
      } else if (this.isOp("[")) {
        const line = this.line();
        this.i++;
        const index = this.parseExpr();
        this.eatOp("]");
        e = { k: "index", obj: e, index, line };
      } else if (this.isOp(".")) {
        const line = this.line();
        this.i++;
        const name = this.eatIdent();
        e = { k: "get", obj: e, name, line };
      } else if (this.isOp("++") || this.isOp("--")) {
        const op = this.cur().v;
        const line = this.line();
        this.i++;
        e = { k: "unary", op: "post" + op, e, line };
      } else break;
    }
    return e;
  }

  private parseArgs(): Expr[] {
    this.eatOp("(");
    const args: Expr[] = [];
    if (!this.isOp(")")) {
      for (;;) {
        args.push(this.parseExpr());
        if (this.isOp(",")) {
          this.i++;
          continue;
        }
        break;
      }
    }
    this.eatOp(")");
    return args;
  }

  private parsePrimary(): Expr {
    const c = this.cur();
    const line = c.line;
    if (c.kind === "num") {
      this.i++;
      return { k: "num", v: c.v, line };
    }
    if (c.kind === "str") {
      this.i++;
      return { k: "str", v: c.v, line };
    }
    if (c.kind === "char") {
      this.i++;
      return { k: "char", v: c.v, line };
    }
    if (c.kind === "ident") {
      this.i++;
      return { k: "name", v: c.v, line };
    }
    if (this.isKw("this")) {
      this.i++;
      return { k: "this", line };
    }
    if (this.isKw("super")) {
      this.i++;
      return { k: "super", line };
    }
    if (this.isKw("null")) {
      this.i++;
      return { k: "null", line };
    }
    if (this.isKw("true") || this.isKw("false")) {
      this.i++;
      return { k: "bool", v: c.v === "true", line };
    }
    if (this.isKw("new")) return this.parseNew();
    if (this.isOp("(")) {
      this.i++;
      const e = this.parseExpr();
      this.eatOp(")");
      return e;
    }
    throw new JavaError("Expected an expression", line);
  }

  private parseNew(): Expr {
    const line = this.line();
    this.eatKw("new");
    const c = this.cur();
    let base = "";
    if (c.kind === "kw" && ["int", "double", "boolean", "char"].includes(c.v)) {
      base = c.v;
      this.i++;
    } else if (c.kind === "ident") {
      base = this.eatIdent();
    } else throw new JavaError("Expected a type after new", line);
    if (this.isOp("<")) this.skipGenerics();
    if (this.isOp("(")) {
      const args = this.parseArgs();
      return { k: "newObj", name: base, args, line };
    }
    if (this.isOp("[") && this.t[this.i + 1]?.v === "]") {
      let dims = 0;
      while (this.isOp("[") && this.t[this.i + 1]?.v === "]") {
        this.i += 2;
        dims++;
      }
      if (!this.isOp("{")) throw new JavaError("Expected an array initializer", line);
      const lit = this.parseArrLit();
      return { k: "newInit", base, dims, elems: lit.elems, line };
    }
    const sizes: Expr[] = [];
    while (this.isOp("[") && this.t[this.i + 1]?.v !== "]") {
      this.eatOp("[");
      sizes.push(this.parseExpr());
      this.eatOp("]");
    }
    if (sizes.length === 0) throw new JavaError("Expected '(' or '[' after type", line);
    return { k: "newArr", base, sizes, line };
  }

  private parseArrLit(): Extract<Expr, { k: "arrLit" }> {
    const line = this.line();
    this.eatOp("{");
    const elems: Expr[] = [];
    if (!this.isOp("}")) {
      for (;;) {
        elems.push(this.isOp("{") ? this.parseArrLit() : this.parseExpr());
        if (this.isOp(",")) {
          this.i++;
          if (this.isOp("}")) break;
          continue;
        }
        break;
      }
    }
    this.eatOp("}");
    return { k: "arrLit", elems, line };
  }
}

type ParsedField = {
  name: string;
  type: TypeN;
  access: "public" | "private";
  isStatic: boolean;
  isFinal: boolean;
  init: Expr | null;
  line: number;
};
type ParsedMethod = {
  name: string;
  access: "public" | "private";
  isStatic: boolean;
  isAbstract: boolean;
  ret: TypeN;
  params: TypeN[];
  paramNames: string[];
  body: Stmt[] | null;
  line: number;
};
type ParsedCtor = { params: TypeN[]; paramNames: string[]; body: Stmt[]; line: number };
type ParsedClass = {
  name: string;
  kind: "class" | "interface";
  isAbstract: boolean;
  isFinal: boolean;
  superName: string | null;
  ifaces: string[];
  fields: ParsedField[];
  methods: ParsedMethod[];
  ctors: ParsedCtor[];
  line: number;
};

function iv(v: number): JV {
  return { t: "int", v: Math.trunc(v) };
}
function dv(v: number): JV {
  return { t: "double", v };
}
function bv(v: boolean): JV {
  return { t: "bool", v };
}

function makeCtx(world: Map<string, RTClass>): Ctx {
  return {
    world,
    frames: [],
    self: null,
    execClass: null,
    steps: 0,
    depth: 0,
    out: [],
    outLen: 0,
    strIds: new Map(),
    nextId: 1,
  };
}

function litStr(ctx: Ctx, v: string, ch = false): JV {
  let id = ctx.strIds.get(ch ? `\u0000${v}` : v);
  if (id === undefined) {
    id = ctx.nextId++;
    ctx.strIds.set(ch ? `\u0000${v}` : v, id);
  }
  return { t: "str", v, id, ch };
}
function freshStr(ctx: Ctx, v: string): JV {
  return { t: "str", v, id: ctx.nextId++, ch: false };
}

function tick(ctx: Ctx, line: number): void {
  ctx.steps++;
  if (ctx.steps > STEP_LIMIT) throw new JavaError("Stopped after too many steps. Look for an infinite loop.", line);
}

function zero(ctx: Ctx, type: TypeN): JV {
  if (type.dims > 0) return { t: "null" };
  if (type.name === "int") return iv(0);
  if (type.name === "double") return dv(0);
  if (type.name === "boolean") return bv(false);
  if (type.name === "char") return litStr(ctx, "\u0000", true);
  return { t: "null" };
}

function clsOf(ctx: Ctx, name: string): RTClass {
  const c = ctx.world.get(name);
  if (!c) throw new JavaError(`Unknown type ${name}`, 0);
  return c;
}

function superChain(ctx: Ctx, name: string): RTClass[] {
  const out: RTClass[] = [];
  const seen = new Set<string>();
  let cur: string | null = name;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const c = ctx.world.get(cur);
    if (!c) break;
    out.push(c);
    cur = c.superName;
  }
  return out;
}

function implementsIface(ctx: Ctx, className: string, iface: string): boolean {
  for (const c of superChain(ctx, className)) {
    if (c.name === iface) return true;
    if (c.ifaces.includes(iface)) return true;
  }
  return false;
}

function isAssignableClass(ctx: Ctx, from: string, to: string): boolean {
  if (from === to) return true;
  if (to === "Object") return true;
  return superChain(ctx, from).some((c) => c.name === to || c.ifaces.includes(to));
}

function typeAccepts(ctx: Ctx, param: TypeN, val: JV): number | null {
  if (param.name === "void") return null;
  if (param.dims > 0) {
    if (val.t === "null") return 3;
    if (val.t !== "arr" || val.dims !== param.dims) return null;
    if (param.name === "Object" || val.elem === param.name) return val.elem === param.name ? 0 : 1;
    if (!["int", "double", "boolean", "char", "String"].includes(param.name) && !["int", "double", "boolean", "char", "String"].includes(val.elem)) {
      return isAssignableClass(ctx, val.elem, param.name) ? 1 : null;
    }
    return null;
  }
  if (param.name === "int") return val.t === "int" ? 0 : null;
  if (param.name === "double") {
    if (val.t === "double") return 0;
    if (val.t === "int") return 1;
    return null;
  }
  if (param.name === "boolean") return val.t === "bool" ? 0 : null;
  if (param.name === "char") return val.t === "str" && val.ch ? 0 : null;
  if (param.name === "String") {
    if (val.t === "null") return 3;
    if (val.t === "str") return val.ch ? 1 : 0;
    return null;
  }
  if (param.name === "Object") {
    if (val.t === "void" || val.t === "class") return null;
    if (val.t === "null") return 4;
    if (val.t === "obj") return 2;
    return 1;
  }
  if (val.t === "null") return 3;
  if (val.t !== "obj") return null;
  if (!isAssignableClass(ctx, val.cls, param.name)) return null;
  return val.cls === param.name ? 0 : 1;
}

function findMethod(ctx: Ctx, start: string, name: string, args: JV[], allowPrivateFrom: string | null): RTMethod | null {
  for (const c of superChain(ctx, start)) {
    const level = c.methods.filter((m) => m.name === name && m.params.length === args.length && (m.access === "public" || c.name === allowPrivateFrom));
    let best: { m: RTMethod; s: number } | null = null;
    for (const m of level) {
      let s = 0;
      let ok = true;
      for (let i = 0; i < m.params.length; i++) {
        const sc = typeAccepts(ctx, m.params[i]!, args[i]!);
        if (sc === null) {
          ok = false;
          break;
        }
        s += sc;
      }
      if (ok && (!best || s < best.s)) best = { m, s };
    }
    if (best) return best.m;
  }
  return null;
}

function findCtor(cls: RTClass, args: JV[], ctx: Ctx): RTCtor | null {
  let best: { c: RTCtor; s: number } | null = null;
  for (const c of cls.ctors) {
    if (c.params.length !== args.length) continue;
    let s = 0;
    let ok = true;
    for (let i = 0; i < c.params.length; i++) {
      const sc = typeAccepts(ctx, c.params[i]!, args[i]!);
      if (sc === null) {
        ok = false;
        break;
      }
      s += sc;
    }
    if (ok && (!best || s < best.s)) best = { c, s };
  }
  return best?.c ?? null;
}

function show(v: JV): string {
  if (v.t === "int" || v.t === "double") return String(v.v);
  if (v.t === "bool") return v.v ? "true" : "false";
  if (v.t === "str") return v.v;
  if (v.t === "null") return "null";
  if (v.t === "void") return "void";
  if (v.t === "class") return v.name;
  if (v.t === "arr") return `[${v.v.map(show).join(", ")}]`;
  if (v.native?.kind === "list") return `[${v.native.items.map(show).join(", ")}]`;
  return `${v.cls}@${v.id}`;
}

function valuesEqual(a: JV, b: JV): boolean {
  if (a.t === "null" || b.t === "null") return a.t === "null" && b.t === "null";
  if ((a.t === "int" || a.t === "double") && (b.t === "int" || b.t === "double")) return a.v === b.v;
  if (a.t === "bool" && b.t === "bool") return a.v === b.v;
  if (a.t === "str" && b.t === "str") return a.v === b.v && a.ch === b.ch;
  if (a.t === "obj" && b.t === "obj") return a.id === b.id;
  if (a.t === "arr" && b.t === "arr") return a.id === b.id;
  return false;
}

function numOf(v: JV, line: number): number {
  if (v.t === "int" || v.t === "double") return v.v;
  throw new JavaError("Expected a number", line);
}
function boolOf(v: JV, line: number): boolean {
  if (v.t !== "bool") throw new JavaError("Condition must be a boolean", line);
  return v.v;
}

function writeOut(ctx: Ctx, s: string, line: number): void {
  ctx.outLen += s.length;
  if (ctx.outLen > 12_000) throw new JavaError("Output is too long. Are you printing inside an infinite loop?", line);
  ctx.out.push(s);
}

function declare(ctx: Ctx, name: string, val: JV, line: number): void {
  const top = ctx.frames[ctx.frames.length - 1];
  if (!top) throw new JavaError("No frame", line);
  if (top.has(name)) throw new JavaError(`${name} is already declared in this block`, line);
  top.set(name, val);
}

function findLocal(ctx: Ctx, name: string): Map<string, JV> | null {
  for (let i = ctx.frames.length - 1; i >= 0; i--) {
    const f = ctx.frames[i]!;
    if (f.has(name)) return f;
  }
  return null;
}

function fieldList(ctx: Ctx, className: string): RTField[] {
  const all: RTField[] = [];
  for (const c of superChain(ctx, className).reverse()) {
    for (const f of c.fields) if (!f.isStatic) all.push(f);
  }
  return all;
}

function lookupField(ctx: Ctx, start: string, name: string): RTField | null {
  for (const c of superChain(ctx, start)) {
    const f = c.fields.find((x) => x.name === name && !x.isStatic);
    if (f) return f;
  }
  return null;
}

function lookupStatic(ctx: Ctx, start: string, name: string): { cls: RTClass; field: RTField } | null {
  for (const c of superChain(ctx, start)) {
    const f = c.fields.find((x) => x.name === name && x.isStatic);
    if (f) return { cls: c, field: f };
  }
  return null;
}

function readField(ctx: Ctx, obj: Extract<JV, { t: "obj" }>, name: string, line: number): JV {
  const f = lookupField(ctx, obj.cls, name);
  if (!f) throw new JavaError(`${obj.cls} has no field ${name}`, line);
  if (f.access === "private" && ctx.execClass !== f.owner) throw new JavaError(`${name} is private`, line);
  return obj.fields[`${f.owner}.${f.name}`] ?? { t: "null" };
}

function writeField(ctx: Ctx, obj: Extract<JV, { t: "obj" }>, name: string, val: JV, line: number): void {
  const f = lookupField(ctx, obj.cls, name);
  if (!f) throw new JavaError(`${obj.cls} has no field ${name}`, line);
  if (f.access === "private" && ctx.execClass !== f.owner) throw new JavaError(`${name} is private`, line);
  const cost = typeAccepts(ctx, f.type, val);
  if (cost === null) throw new JavaError(`Cannot assign ${show(val)} to ${f.type.name}`, line);
  obj.fields[`${f.owner}.${f.name}`] = val;
}

function zeroFill(ctx: Ctx, obj: Extract<JV, { t: "obj" }>, className: string): void {
  for (const f of fieldList(ctx, className)) {
    obj.fields[`${f.owner}.${f.name}`] = zero(ctx, f.type);
  }
}

function needSelf(ctx: Ctx, line: number): Extract<JV, { t: "obj" }> {
  if (!ctx.self || ctx.self.t !== "obj") throw new JavaError("`this` is not available in a static method", line);
  return ctx.self;
}

function evalArgs(ctx: Ctx, args: Expr[]): JV[] {
  return args.map((a) => evalExpr(ctx, a));
}

function callMethod(ctx: Ctx, method: RTMethod, self: JV | null, args: JV[], line: number): JV {
  tick(ctx, line);
  ctx.depth++;
  if (ctx.depth > DEPTH_LIMIT) throw new JavaError("Recursion went too deep", line);
  try {
    if (method.isAbstract || (!method.body && !method.native)) {
      throw new JavaError(`Method ${method.name} is abstract`, line);
    }
    if (method.native) return method.native(ctx, self, args, line);
    const prevClass = ctx.execClass;
    const prevSelf = ctx.self;
    ctx.execClass = method.owner;
    ctx.self = method.isStatic ? null : self;
    const frame = new Map<string, JV>();
    method.paramNames.forEach((n, i) => frame.set(n, args[i]!));
    ctx.frames.push(frame);
    try {
      for (const s of method.body!) execStmt(ctx, s);
      if (method.ret.name !== "void" || method.ret.dims > 0) {
        throw new JavaError(`Missing return in ${method.owner}.${method.name}`, method.line);
      }
      return { t: "void" };
    } catch (e) {
      if (e instanceof ReturnSignal) {
        if (method.ret.name === "void" && method.ret.dims === 0) {
          if (e.value.t !== "void") throw new JavaError("Cannot return a value from a void method", line);
          return { t: "void" };
        }
        if (typeAccepts(ctx, method.ret, e.value) === null) {
          throw new JavaError(`Return value does not match ${method.ret.dims ? method.ret.name + "[]".repeat(method.ret.dims) : method.ret.name}`, line);
        }
        return e.value;
      }
      if (e instanceof BreakSignal) throw new JavaError("break is outside a loop", line);
      if (e instanceof ContinueSignal) throw new JavaError("continue is outside a loop", line);
      throw e;
    } finally {
      ctx.frames.pop();
      ctx.execClass = prevClass;
      ctx.self = prevSelf;
    }
  } finally {
    ctx.depth--;
  }
}

function callString(ctx: Ctx, s: Extract<JV, { t: "str" }>, name: string, args: JV[], line: number): JV {
  const strArg = () => {
    const a = args[0];
    if (!a || a.t !== "str") throw new JavaError(`${name} expects a string`, line);
    return a.v;
  };
  if (name === "length" && args.length === 0) return iv(s.v.length);
  if (name === "charAt" && args.length === 1) {
    const i = numOf(args[0]!, line);
    if (i < 0 || i >= s.v.length) throw new JavaError("charAt index out of range", line);
    return litStr(ctx, s.v[i]!, true);
  }
  if (name === "substring" && (args.length === 1 || args.length === 2)) {
    const a = Math.trunc(numOf(args[0]!, line));
    const b = args.length === 2 ? Math.trunc(numOf(args[1]!, line)) : s.v.length;
    if (a < 0 || b < a || b > s.v.length) throw new JavaError("substring range is invalid", line);
    return freshStr(ctx, s.v.slice(a, b));
  }
  if (name === "equals" && args.length === 1) {
    const a = args[0]!;
    return bv(a.t === "str" && a.v === s.v);
  }
  if (name === "equalsIgnoreCase" && args.length === 1) {
    const a = args[0]!;
    return bv(a.t === "str" && a.v.toLowerCase() === s.v.toLowerCase());
  }
  if (name === "indexOf" && args.length === 1) return iv(s.v.indexOf(strArg()));
  if (name === "contains" && args.length === 1) return bv(s.v.includes(strArg()));
  if (name === "startsWith" && args.length === 1) return bv(s.v.startsWith(strArg()));
  if (name === "endsWith" && args.length === 1) return bv(s.v.endsWith(strArg()));
  if (name === "toLowerCase" && args.length === 0) return freshStr(ctx, s.v.toLowerCase());
  if (name === "toUpperCase" && args.length === 0) return freshStr(ctx, s.v.toUpperCase());
  if (name === "trim" && args.length === 0) return freshStr(ctx, s.v.trim());
  throw new JavaError(`String has no method ${name} with ${args.length} argument(s)`, line);
}

function nativeList(ctx: Ctx, self: JV | null, name: string, args: JV[], line: number): JV | null {
  if (!self || self.t !== "obj" || self.native?.kind !== "list") throw new JavaError("Not a list", line);
  const items = self.native.items;
  if (name === "add" && args.length === 1) {
    items.push(args[0]!);
    return bv(true);
  }
  if (name === "get" && args.length === 1) {
    const i = Math.trunc(numOf(args[0]!, line));
    if (i < 0 || i >= items.length) throw new JavaError("List index out of range", line);
    return items[i]!;
  }
  if (name === "set" && args.length === 2) {
    const i = Math.trunc(numOf(args[0]!, line));
    if (i < 0 || i >= items.length) throw new JavaError("List index out of range", line);
    const old = items[i]!;
    items[i] = args[1]!;
    return old;
  }
  if (name === "size" && args.length === 0) return iv(items.length);
  if (name === "isEmpty" && args.length === 0) return bv(items.length === 0);
  if (name === "remove" && args.length === 1) {
    const i = Math.trunc(numOf(args[0]!, line));
    if (i < 0 || i >= items.length) throw new JavaError("List index out of range", line);
    return items.splice(i, 1)[0]!;
  }
  if (name === "contains" && args.length === 1) return bv(items.some((x) => valuesEqual(x, args[0]!)));
  return null;
}

function mapKey(v: JV): string {
  if (v.t === "str") return `s:${v.v}`;
  if (v.t === "int") return `i:${v.v}`;
  if (v.t === "bool") return `b:${v.v ? 1 : 0}`;
  if (v.t === "null") return "n";
  if (v.t === "obj") return `o:${v.id}`;
  if (v.t === "arr") return `a:${v.id}`;
  return "?";
}

function nativeMap(self: JV | null, name: string, args: JV[], line: number): JV | null {
  if (!self || self.t !== "obj" || self.native?.kind !== "map") throw new JavaError("Not a map", line);
  const items = self.native.items;
  const find = (k: JV) => items.findIndex((e) => mapKey(e.k) === mapKey(k));
  if (name === "put" && args.length === 2) {
    const i = find(args[0]!);
    if (i >= 0) {
      const old = items[i]!.v;
      items[i]!.v = args[1]!;
      return old;
    }
    items.push({ k: args[0]!, v: args[1]! });
    return { t: "null" };
  }
  if (name === "get" && args.length === 1) {
    const i = find(args[0]!);
    return i >= 0 ? items[i]!.v : { t: "null" };
  }
  if (name === "containsKey" && args.length === 1) return bv(find(args[0]!) >= 0);
  if (name === "size" && args.length === 0) return iv(items.length);
  if (name === "isEmpty" && args.length === 0) return bv(items.length === 0);
  if (name === "remove" && args.length === 1) {
    const i = find(args[0]!);
    if (i < 0) return { t: "null" };
    return items.splice(i, 1)[0]!.v;
  }
  return null;
}

function nativeStack(self: JV | null, name: string, args: JV[], line: number): JV | null {
  if (!self || self.t !== "obj" || self.native?.kind !== "stack") throw new JavaError("Not a stack", line);
  const items = self.native.items;
  if (name === "push" && args.length === 1) {
    items.push(args[0]!);
    return args[0]!;
  }
  if ((name === "pop" || name === "peek") && args.length === 0) {
    if (items.length === 0) throw new JavaError("Stack is empty", line);
    return name === "pop" ? items.pop()! : items[items.length - 1]!;
  }
  if (name === "isEmpty" && args.length === 0) return bv(items.length === 0);
  if (name === "size" && args.length === 0) return iv(items.length);
  return null;
}

function nativeQueue(self: JV | null, name: string, args: JV[], line: number): JV | null {
  if (!self || self.t !== "obj" || self.native?.kind !== "queue") throw new JavaError("Not a queue", line);
  const items = self.native.items;
  if ((name === "offer" || name === "add") && args.length === 1) {
    items.push(args[0]!);
    return bv(true);
  }
  if ((name === "poll" || name === "remove") && args.length === 0) {
    if (items.length === 0) throw new JavaError("Queue is empty", line);
    return items.shift()!;
  }
  if (name === "peek" && args.length === 0) {
    if (items.length === 0) throw new JavaError("Queue is empty", line);
    return items[0]!;
  }
  if (name === "isEmpty" && args.length === 0) return bv(items.length === 0);
  if (name === "size" && args.length === 0) return iv(items.length);
  return null;
}

function nativeDeque(self: JV | null, name: string, args: JV[], line: number): JV | null {
  if (!self || self.t !== "obj" || self.native?.kind !== "deque") throw new JavaError("Not a deque", line);
  const items = self.native.items;
  if (name === "addLast" && args.length === 1) {
    items.push(args[0]!);
    return { t: "void" };
  }
  if (name === "addFirst" && args.length === 1) {
    items.unshift(args[0]!);
    return { t: "void" };
  }
  if (name === "removeFirst" && args.length === 0) {
    if (!items.length) throw new JavaError("Deque is empty", line);
    return items.shift()!;
  }
  if (name === "removeLast" && args.length === 0) {
    if (!items.length) throw new JavaError("Deque is empty", line);
    return items.pop()!;
  }
  if (name === "peekFirst" && args.length === 0) return items.length ? items[0]! : { t: "null" };
  if (name === "peekLast" && args.length === 0) return items.length ? items[items.length - 1]! : { t: "null" };
  if (name === "isEmpty" && args.length === 0) return bv(items.length === 0);
  if (name === "size" && args.length === 0) return iv(items.length);
  return null;
}

function dispatchNative(ctx: Ctx, self: JV, name: string, args: JV[], line: number): JV | null {
  if (self.t !== "obj" || !self.native) return null;
  if (self.native.kind === "list") return nativeList(ctx, self, name, args, line);
  if (self.native.kind === "map") return nativeMap(self, name, args, line);
  if (self.native.kind === "stack") return nativeStack(self, name, args, line);
  if (self.native.kind === "queue") return nativeQueue(self, name, args, line);
  if (self.native.kind === "deque") return nativeDeque(self, name, args, line);
  return null;
}

function evalIndex(v: JV, idx: JV, line: number): JV {
  const i = Math.trunc(numOf(idx, line));
  if (v.t !== "arr") throw new JavaError("Value is not an array", line);
  if (i < 0 || i >= v.v.length) throw new JavaError("Array index out of range", line);
  return v.v[i]!;
}

function setIndex(v: JV, idx: JV, val: JV, line: number): void {
  const i = Math.trunc(numOf(idx, line));
  if (v.t !== "arr") throw new JavaError("Value is not an array", line);
  if (i < 0 || i >= v.v.length) throw new JavaError("Array index out of range", line);
  v.v[i] = val;
}

function makeArray(ctx: Ctx, base: string, sizes: number[], line: number): JV {
  const n = sizes[0] ?? 0;
  if (n < 0 || n > 100_000) throw new JavaError("Invalid array length", line);
  const dims = sizes.length;
  const arr: JV[] = [];
  for (let i = 0; i < n; i++) {
    if (sizes.length === 1) arr.push(zero(ctx, { name: base, dims: 0 }));
    else arr.push(makeArray(ctx, base, sizes.slice(1), line));
  }
  return { t: "arr", v: arr, elem: base, dims, id: ctx.nextId++ };
}

function evalArrLit(ctx: Ctx, elems: Expr[], expected: TypeN | undefined, line: number): JV {
  if (elems.length === 0) {
    const base = expected && expected.dims > 0 ? expected.name : "int";
    const dims = expected && expected.dims > 0 ? expected.dims : 1;
    return { t: "arr", v: [], elem: base, dims, id: ctx.nextId++ };
  }
  const innerExpected = expected && expected.dims > 1 ? { name: expected.name, dims: expected.dims - 1 } : undefined;
  const vals = elems.map((el) => {
    if (el.k === "arrLit") return evalArrLit(ctx, el.elems, innerExpected, el.line);
    return evalExpr(ctx, el);
  });
  const first = vals[0]!;
  if (first.t === "arr") {
    return { t: "arr", v: vals, elem: first.elem, dims: first.dims + 1, id: ctx.nextId++ };
  }
  let elem = "int";
  if (first.t === "double") elem = "double";
  else if (first.t === "bool") elem = "boolean";
  else if (first.t === "str") elem = first.ch ? "char" : "String";
  else if (first.t === "obj") elem = first.cls;
  return { t: "arr", v: vals, elem, dims: 1, id: ctx.nextId++ };
}

function binNum(op: string, l: number, r: number, bothInt: boolean): JV {
  if (op === "+") return bothInt ? iv(l + r) : dv(l + r);
  if (op === "-") return bothInt ? iv(l - r) : dv(l - r);
  if (op === "*") return bothInt ? iv(l * r) : dv(l * r);
  if (op === "/") {
    if (r === 0) throw new JavaError("Division by zero", 0);
    return bothInt ? iv(Math.trunc(l / r)) : dv(l / r);
  }
  if (r === 0) throw new JavaError("Division by zero", 0);
  return bothInt ? iv(l % r) : dv(l % r);
}

function evalExpr(ctx: Ctx, e: Expr): JV {
  switch (e.k) {
    case "num":
      return e.v.includes(".") ? dv(Number(e.v)) : iv(Number(e.v));
    case "str":
      return litStr(ctx, e.v, false);
    case "char":
      return litStr(ctx, e.v, true);
    case "bool":
      return bv(e.v);
    case "null":
      return { t: "null" };
    case "this":
      return needSelf(ctx, e.line);
    case "super":
      throw new JavaError("`super` must be used as super.method or super()", e.line);
    case "name":
      return evalName(ctx, e.v, e.line);
    case "unary":
      return evalUnary(ctx, e);
    case "bin":
      return evalBin(ctx, e);
    case "assign":
      return evalAssign(ctx, e);
    case "invoke":
      return evalInvoke(ctx, e);
    case "index":
      return evalIndex(evalExpr(ctx, e.obj), evalExpr(ctx, e.index), e.line);
    case "get":
      return evalGet(ctx, e);
    case "newObj":
      return construct(ctx, e.name, evalArgs(ctx, e.args), e.line);
    case "newArr": {
      const sizes = e.sizes.map((s) => Math.trunc(numOf(evalExpr(ctx, s), e.line)));
      return makeArray(ctx, e.base, sizes, e.line);
    }
    case "newInit":
      return evalArrLit(ctx, e.elems, { name: e.base, dims: e.dims }, e.line);
    case "arrLit":
      return evalArrLit(ctx, e.elems, undefined, e.line);
    case "cast":
      return evalCast(ctx, e.type, evalExpr(ctx, e.e), e.line);
    case "instanceof": {
      const v = evalExpr(ctx, e.e);
      if (v.t === "null") return bv(false);
      if (v.t !== "obj") return bv(false);
      return bv(isAssignableClass(ctx, v.cls, e.type));
    }
    default:
      throw new JavaError("Bad expression", 0);
  }
}

function evalName(ctx: Ctx, name: string, line: number): JV {
  const local = findLocal(ctx, name);
  if (local) return local.get(name)!;
  if (ctx.self && ctx.self.t === "obj" && ctx.execClass) {
    const f = lookupField(ctx, ctx.execClass, name);
    if (f) return readField(ctx, ctx.self, name, line);
  }
  if (ctx.execClass) {
    const st = lookupStatic(ctx, ctx.execClass, name);
    if (st) {
      if (st.field.access === "private" && ctx.execClass !== st.field.owner) throw new JavaError(`${name} is private`, line);
      return st.cls.statics[st.field.name] ?? { t: "null" };
    }
  }
  if (ctx.world.has(name)) return { t: "class", name };
  throw new JavaError(`Cannot find symbol ${name}`, line);
}

function evalUnary(ctx: Ctx, e: Extract<Expr, { k: "unary" }>): JV {
  if (e.op === "!") {
    return bv(!boolOf(evalExpr(ctx, e.e), e.line));
  }
  if (e.op === "-") {
    const v = evalExpr(ctx, e.e);
    if (v.t === "double") return dv(-v.v);
    return iv(-numOf(v, e.line));
  }
  const delta = e.op.endsWith("++") ? 1 : -1;
  const post = e.op.startsWith("post");
  const old = evalExpr(ctx, e.e);
  const n = numOf(old, e.line);
  const next = old.t === "double" ? dv(n + delta) : iv(n + delta);
  assignTo(ctx, e.e, next, e.line);
  return post ? old : next;
}

function evalBin(ctx: Ctx, e: Extract<Expr, { k: "bin" }>): JV {
  if (e.op === "&&") {
    const l = evalExpr(ctx, e.l);
    if (!boolOf(l, e.line)) return bv(false);
    return bv(boolOf(evalExpr(ctx, e.r), e.line));
  }
  if (e.op === "||") {
    const l = evalExpr(ctx, e.l);
    if (boolOf(l, e.line)) return bv(true);
    return bv(boolOf(evalExpr(ctx, e.r), e.line));
  }
  const l = evalExpr(ctx, e.l);
  const r = evalExpr(ctx, e.r);
  if (e.op === "+" && (l.t === "str" || r.t === "str")) {
    return freshStr(ctx, stringify(ctx, l) + stringify(ctx, r));
  }
  if (["+", "-", "*", "/", "%"].includes(e.op)) {
    const bothInt = l.t === "int" && r.t === "int";
    return binNum(e.op, numOf(l, e.line), numOf(r, e.line), bothInt);
  }
  if (e.op === "==" || e.op === "!=") {
    let eq = false;
    if (l.t === "null" || r.t === "null") eq = l.t === "null" && r.t === "null";
    else if ((l.t === "int" || l.t === "double") && (r.t === "int" || r.t === "double")) eq = l.v === r.v;
    else if (l.t === "bool" && r.t === "bool") eq = l.v === r.v;
    else if (l.t === "str" && r.t === "str") eq = l.ch || r.ch ? l.v === r.v && l.ch === r.ch : l.id === r.id;
    else if (l.t === "obj" && r.t === "obj") eq = l.id === r.id;
    else if (l.t === "arr" && r.t === "arr") eq = l.id === r.id;
    else throw new JavaError("Those values cannot be compared with ==", e.line);
    return bv(e.op === "==" ? eq : !eq);
  }
  const ln = numOf(l, e.line);
  const rn = numOf(r, e.line);
  if (e.op === "<") return bv(ln < rn);
  if (e.op === ">") return bv(ln > rn);
  if (e.op === "<=") return bv(ln <= rn);
  if (e.op === ">=") return bv(ln >= rn);
  throw new JavaError(`Unknown operator ${e.op}`, e.line);
}

function stringify(ctx: Ctx, v: JV): string {
  if (v.t === "obj") {
    const m = findMethod(ctx, v.cls, "toString", [], null);
    if (m && m.owner !== "Object") {
      const r = callMethod(ctx, m, v, [], 0);
      if (r.t === "str") return r.v;
    }
    return `${v.cls}@${v.id}`;
  }
  if (v.t === "str") return v.v;
  return show(v);
}

function evalAssign(ctx: Ctx, e: Extract<Expr, { k: "assign" }>): JV {
  if (e.op === "=") {
    const v = e.r.k === "arrLit" ? evalArrLit(ctx, e.r.elems, undefined, e.r.line) : evalExpr(ctx, e.r);
    assignTo(ctx, e.l, v, e.line);
    return v;
  }
  const cur = evalExpr(ctx, e.l);
  const rhs = evalExpr(ctx, e.r);
  let next: JV;
  if (e.op === "+=" && (cur.t === "str" || rhs.t === "str")) next = freshStr(ctx, stringify(ctx, cur) + stringify(ctx, rhs));
  else {
    const base = e.op.slice(0, -1);
    const bothInt = cur.t === "int" && rhs.t === "int";
    next = binNum(base, numOf(cur, e.line), numOf(rhs, e.line), bothInt);
  }
  assignTo(ctx, e.l, next, e.line);
  return next;
}

function assignTo(ctx: Ctx, target: Expr, val: JV, line: number): void {
  if (target.k === "name") {
    const local = findLocal(ctx, target.v);
    if (local) {
      local.set(target.v, val);
      return;
    }
    if (ctx.self && ctx.self.t === "obj" && ctx.execClass) {
      const inst = lookupField(ctx, ctx.execClass, target.v);
      if (inst) {
        writeField(ctx, ctx.self, target.v, val, line);
        return;
      }
    }
    if (ctx.execClass) {
      const st = lookupStatic(ctx, ctx.execClass, target.v);
      if (st) {
        if (st.field.access === "private" && ctx.execClass !== st.field.owner) {
          throw new JavaError(`${target.v} is private`, line);
        }
        st.cls.statics[st.field.name] = val;
        return;
      }
    }
    throw new JavaError(`Cannot find symbol ${target.v}`, line);
  }
  if (target.k === "get") {
    if (target.obj.k === "this") {
      writeField(ctx, needSelf(ctx, line), target.name, val, line);
      return;
    }
    const o = evalExpr(ctx, target.obj);
    if (o.t === "class") {
      const st = lookupStatic(ctx, o.name, target.name);
      if (!st) throw new JavaError(`${o.name} has no static field ${target.name}`, line);
      st.cls.statics[st.field.name] = val;
      return;
    }
    if (o.t !== "obj") throw new JavaError("Cannot assign a field here", line);
    writeField(ctx, o, target.name, val, line);
    return;
  }
  if (target.k === "index") {
    setIndex(evalExpr(ctx, target.obj), evalExpr(ctx, target.index), val, line);
    return;
  }
  throw new JavaError("The left side cannot be assigned to", line);
}

function evalGet(ctx: Ctx, e: Extract<Expr, { k: "get" }>): JV {
  if (e.obj.k === "super") {
    if (!ctx.execClass) throw new JavaError("super is not available here", e.line);
    const parent = clsOf(ctx, ctx.execClass).superName;
    if (!parent) throw new JavaError("No superclass", e.line);
    const self = needSelf(ctx, e.line);
    const f = lookupField(ctx, parent, e.name);
    if (!f) throw new JavaError(`No field ${e.name}`, e.line);
    return self.fields[`${f.owner}.${f.name}`] ?? { t: "null" };
  }
  if (e.obj.k === "this") {
    return readField(ctx, needSelf(ctx, e.line), e.name, e.line);
  }
  const o = evalExpr(ctx, e.obj);
  if (o.t === "class") {
    const st = lookupStatic(ctx, o.name, e.name);
    if (!st) throw new JavaError(`${o.name} has no static field ${e.name}`, e.line);
    if (st.field.access === "private" && ctx.execClass !== st.field.owner) throw new JavaError(`${e.name} is private`, e.line);
    return st.cls.statics[st.field.name] ?? { t: "null" };
  }
  if (o.t === "arr" && e.name === "length") return iv(o.v.length);
  if (o.t === "obj") return readField(ctx, o, e.name, e.line);
  if (o.t === "null") throw new JavaError("Cannot read a field of null", e.line);
  throw new JavaError(`Cannot read ${e.name} on this value`, e.line);
}

function evalCast(ctx: Ctx, type: TypeN, v: JV, line: number): JV {
  if (type.dims > 0) {
    if (v.t === "null") return v;
    if (v.t !== "arr") throw new JavaError("Cannot cast that to an array", line);
    return v;
  }
  if (type.name === "int") {
    if (v.t === "int") return v;
    if (v.t === "double") return iv(v.v);
    if (v.t === "str" && v.ch) return iv(v.v.charCodeAt(0));
    throw new JavaError("Cannot cast to int", line);
  }
  if (type.name === "double") {
    if (v.t === "double" || v.t === "int") return dv(v.v);
    throw new JavaError("Cannot cast to double", line);
  }
  if (type.name === "String") {
    if (v.t === "str" || v.t === "null") return v;
    throw new JavaError("Cannot cast to String", line);
  }
  if (v.t === "null") return v;
  if (v.t !== "obj") throw new JavaError("Cannot cast this value", line);
  if (!isAssignableClass(ctx, v.cls, type.name) && !isAssignableClass(ctx, type.name, v.cls)) {
    throw new JavaError(`Cannot cast ${v.cls} to ${type.name}`, line);
  }
  if (!isAssignableClass(ctx, v.cls, type.name)) throw new JavaError(`Cannot cast ${v.cls} to ${type.name}`, line);
  return v;
}

function evalInvoke(ctx: Ctx, e: Extract<Expr, { k: "invoke" }>): JV {
  const target = e.target;
  if (target.k === "this") return ctorDelegate(ctx, "this", evalArgs(ctx, e.args), e.line);
  if (target.k === "super") return ctorDelegate(ctx, "super", evalArgs(ctx, e.args), e.line);
  if (target.k === "name") return callUnqualified(ctx, target.v, evalArgs(ctx, e.args), e.line);
  if (target.k === "get") {
    if (target.obj.k === "super") {
      if (!ctx.execClass) throw new JavaError("super is not available", e.line);
      const parent = clsOf(ctx, ctx.execClass).superName;
      if (!parent) throw new JavaError("No superclass", e.line);
      const args = evalArgs(ctx, e.args);
      const m = findMethod(ctx, parent, target.name, args, ctx.execClass);
      if (!m) throw new JavaError(`No method ${target.name} on super`, e.line);
      return callMethod(ctx, m, needSelf(ctx, e.line), args, e.line);
    }
    const args = evalArgs(ctx, e.args);
    if (target.obj.k === "this") {
      const self = needSelf(ctx, e.line);
      const hit = dispatchNative(ctx, self, target.name, args, e.line);
      if (hit) return hit;
      const m = findMethod(ctx, self.cls, target.name, args, ctx.execClass);
      if (!m) throw new JavaError(`No method ${target.name}`, e.line);
      return callMethod(ctx, m, self, args, e.line);
    }
    const recv = evalExpr(ctx, target.obj);
    if (recv.t === "class") {
      const m = findMethod(ctx, recv.name, target.name, args, ctx.execClass);
      if (!m || !m.isStatic) throw new JavaError(`No static method ${recv.name}.${target.name}`, e.line);
      return callMethod(ctx, m, null, args, e.line);
    }
    if (recv.t === "str") return callString(ctx, recv, target.name, args, e.line);
    if (recv.t === "null") throw new JavaError("Cannot call a method on null", e.line);
    if (recv.t === "obj") {
      const hit = dispatchNative(ctx, recv, target.name, args, e.line);
      if (hit) return hit;
      const m = findMethod(ctx, recv.cls, target.name, args, ctx.execClass);
      if (!m || m.isStatic) throw new JavaError(`${recv.cls} has no method ${target.name} for these arguments`, e.line);
      return callMethod(ctx, m, recv, args, e.line);
    }
    throw new JavaError("Cannot call a method on this value", e.line);
  }
  throw new JavaError("That cannot be called", e.line);
}

function callUnqualified(ctx: Ctx, name: string, args: JV[], line: number): JV {
  if (ctx.self && ctx.self.t === "obj") {
    const hit = dispatchNative(ctx, ctx.self, name, args, line);
    if (hit) return hit;
    const m = findMethod(ctx, ctx.self.cls, name, args, ctx.execClass);
    if (m && !m.isStatic) return callMethod(ctx, m, ctx.self, args, line);
  }
  if (ctx.execClass) {
    const m = findMethod(ctx, ctx.execClass, name, args, ctx.execClass);
    if (m && m.isStatic) return callMethod(ctx, m, null, args, line);
    if (m && ctx.self) return callMethod(ctx, m, ctx.self, args, line);
  }
  throw new JavaError(`Cannot find method ${name}`, line);
}

function ctorDelegate(ctx: Ctx, which: "this" | "super", args: JV[], line: number): JV {
  if (!ctx.self || ctx.self.t !== "obj" || !ctx.execClass) throw new JavaError(`${which}() is only allowed in a constructor`, line);
  const current = clsOf(ctx, ctx.execClass);
  const targetName = which === "this" ? current.name : current.superName;
  if (!targetName) throw new JavaError("No superclass", line);
  runCtor(ctx, clsOf(ctx, targetName), ctx.self, args, line, which === "super");
  return { t: "void" };
}

function construct(ctx: Ctx, name: string, args: JV[], line: number): JV {
  if (name === "ArrayList") {
    if (args.length !== 0) throw new JavaError("Use new ArrayList()", line);
    return { t: "obj", cls: "ArrayList", id: ctx.nextId++, fields: {}, native: { kind: "list", items: [] } };
  }
  if (name === "HashMap") {
    if (args.length !== 0) throw new JavaError("Use new HashMap()", line);
    return { t: "obj", cls: "HashMap", id: ctx.nextId++, fields: {}, native: { kind: "map", items: [] } };
  }
  if (name === "Stack") {
    if (args.length !== 0) throw new JavaError("Use new Stack()", line);
    return { t: "obj", cls: "Stack", id: ctx.nextId++, fields: {}, native: { kind: "stack", items: [] } };
  }
  if (name === "Queue") {
    if (args.length !== 0) throw new JavaError("Use new Queue()", line);
    return { t: "obj", cls: "Queue", id: ctx.nextId++, fields: {}, native: { kind: "queue", items: [] } };
  }
  if (name === "ArrayDeque") {
    if (args.length !== 0) throw new JavaError("Use new ArrayDeque()", line);
    return { t: "obj", cls: "ArrayDeque", id: ctx.nextId++, fields: {}, native: { kind: "deque", items: [] } };
  }
  if (name === "RuntimeException") {
    const msg = args[0];
    const text = msg && msg.t === "str" ? msg.v : msg ? stringify(ctx, msg) : "error";
    const obj: Extract<JV, { t: "obj" }> = {
      t: "obj",
      cls: "RuntimeException",
      id: ctx.nextId++,
      fields: {},
    };
    obj.fields["RuntimeException.message"] = litStr(ctx, text);
    return obj;
  }
  const cls = ctx.world.get(name);
  if (!cls) throw new JavaError(`Unknown type ${name}`, line);
  if (cls.kind === "interface" || cls.isAbstract) throw new JavaError(`Cannot instantiate ${name}`, line);
  const obj: Extract<JV, { t: "obj" }> = { t: "obj", cls: name, id: ctx.nextId++, fields: {} };
  zeroFill(ctx, obj, name);
  runCtor(ctx, cls, obj, args, line, true);
  return obj;
}

function runCtor(ctx: Ctx, cls: RTClass, obj: Extract<JV, { t: "obj" }>, args: JV[], line: number, initFieldsAfterSuper: boolean): void {
  if (cls.name === "Object") return;
  const ctor = findCtor(cls, args, ctx);
  if (!ctor) throw new JavaError(`No matching constructor for ${cls.name}`, line);
  const prevClass = ctx.execClass;
  const prevSelf = ctx.self;
  ctx.execClass = cls.name;
  ctx.self = obj;
  const frame = new Map<string, JV>();
  ctor.paramNames.forEach((n, i) => frame.set(n, args[i]!));
  ctx.frames.push(frame);
  try {
    let body = ctor.body;
    const first = body[0];
    let didSuper = false;
    if (first && first.k === "expr" && first.e.k === "invoke" && (first.e.target.k === "this" || first.e.target.k === "super")) {
      const which = first.e.target.k;
      const dargs = evalArgs(ctx, first.e.args);
      if (which === "this") {
        const delegated = findCtor(cls, dargs, ctx);
        if (!delegated || delegated === ctor) throw new JavaError("No matching this() constructor", line);
        runCtor(ctx, cls, obj, dargs, line, true);
      } else {
        const parent = cls.superName ? clsOf(ctx, cls.superName) : null;
        if (parent) runCtor(ctx, parent, obj, dargs, line, true);
        didSuper = true;
      }
      body = body.slice(1);
      if (which === "super") initInstanceFields(ctx, cls, obj);
    } else if (initFieldsAfterSuper) {
      if (cls.superName && cls.superName !== "Object") {
        runCtor(ctx, clsOf(ctx, cls.superName), obj, [], line, true);
      }
      didSuper = true;
      initInstanceFields(ctx, cls, obj);
    }
    void didSuper;
    try {
      for (const s of body) execStmt(ctx, s);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        if (e.value.t !== "void") throw new JavaError("A constructor cannot return a value", line);
      } else throw e;
    }
  } finally {
    ctx.frames.pop();
    ctx.execClass = prevClass;
    ctx.self = prevSelf;
  }
}

function initInstanceFields(ctx: Ctx, cls: RTClass, obj: Extract<JV, { t: "obj" }>): void {
  for (const f of cls.fields) {
    if (f.isStatic) continue;
    if (f.init) obj.fields[`${f.owner}.${f.name}`] = evalExpr(ctx, f.init);
  }
}

function execStmt(ctx: Ctx, s: Stmt): void {
  tick(ctx, 0);
  switch (s.k) {
    case "empty":
      return;
    case "block": {
      ctx.frames.push(new Map());
      try {
        for (const st of s.body) execStmt(ctx, st);
      } finally {
        ctx.frames.pop();
      }
      return;
    }
    case "var": {
      const val = s.init ? (s.init.k === "arrLit" ? evalArrLit(ctx, s.init.elems, s.type, s.line) : evalExpr(ctx, s.init)) : zero(ctx, s.type);
      if (s.init && typeAccepts(ctx, s.type, val) === null) {
        throw new JavaError(`Cannot assign this value to ${s.type.name}`, s.line);
      }
      declare(ctx, s.name, val, s.line);
      return;
    }
    case "expr":
      evalExpr(ctx, s.e);
      return;
    case "if":
      if (boolOf(evalExpr(ctx, s.cond), 0)) execStmt(ctx, s.then);
      else if (s.elseB) execStmt(ctx, s.elseB);
      return;
    case "while":
      while (boolOf(evalExpr(ctx, s.cond), 0)) {
        try {
          execStmt(ctx, s.body);
        } catch (e) {
          if (e instanceof ContinueSignal) continue;
          if (e instanceof BreakSignal) break;
          throw e;
        }
      }
      return;
    case "for": {
      ctx.frames.push(new Map());
      try {
        if (s.init) execStmt(ctx, s.init);
        while (!s.cond || boolOf(evalExpr(ctx, s.cond), 0)) {
          try {
            execStmt(ctx, s.body);
          } catch (e) {
            if (e instanceof ContinueSignal) {
              if (s.update) evalExpr(ctx, s.update);
              continue;
            }
            if (e instanceof BreakSignal) break;
            throw e;
          }
          if (s.update) evalExpr(ctx, s.update);
        }
      } finally {
        ctx.frames.pop();
      }
      return;
    }
    case "foreach": {
      const iter = evalExpr(ctx, s.iter);
      const items: JV[] = [];
      if (iter.t === "arr") items.push(...iter.v);
      else if (iter.t === "obj" && iter.native?.kind === "list") items.push(...iter.native.items);
      else throw new JavaError("for-each needs an array or ArrayList", s.line);
      ctx.frames.push(new Map());
      try {
        for (const item of items) {
          const frame = ctx.frames[ctx.frames.length - 1]!;
          frame.set(s.name, item);
          try {
            execStmt(ctx, s.body);
          } catch (e) {
            if (e instanceof ContinueSignal) continue;
            if (e instanceof BreakSignal) break;
            throw e;
          }
        }
      } finally {
        ctx.frames.pop();
      }
      return;
    }
    case "return":
      throw new ReturnSignal(s.e ? evalExpr(ctx, s.e) : { t: "void" });
    case "throw": {
      const v = evalExpr(ctx, s.e);
      if (v.t === "obj" && v.cls === "RuntimeException") {
        const msg = v.fields["RuntimeException.message"];
        throw new Thrown(msg && msg.t === "str" ? msg.v : "error");
      }
      throw new JavaError("Only throw new RuntimeException(\"message\") is supported", s.line);
    }
    case "break":
      throw new BreakSignal();
    case "continue":
      throw new ContinueSignal();
    default:
      return;
  }
}

function methodFromParsed(m: ParsedMethod, owner: string): RTMethod {
  return { ...m, owner };
}

function verifyHierarchy(world: Map<string, RTClass>): void {
  for (const cls of world.values()) {
    if (cls.builtin) continue;
    if (cls.superName && !world.has(cls.superName)) throw new JavaError(`Unknown superclass ${cls.superName}`, 0);
    if (cls.superName) {
      const sup = world.get(cls.superName)!;
      if (sup.isFinal) throw new JavaError(`Cannot extend final class ${sup.name}`, 0);
      if (sup.kind === "interface") throw new JavaError("Use implements for interfaces", 0);
    }
    for (const i of cls.ifaces) {
      const iface = world.get(i);
      if (!iface || iface.kind !== "interface") throw new JavaError(`${i} is not an interface`, 0);
    }
    if (cls.kind === "class" && !cls.isAbstract) {
      const missing = abstractHoles(world, cls);
      if (missing) throw new JavaError(`${cls.name} must implement ${missing}`, 0);
    }
  }
}

function abstractHoles(world: Map<string, RTClass>, cls: RTClass): string | null {
  const needed: { name: string; n: number }[] = [];
  const consider = (c: RTClass) => {
    for (const m of c.methods) if (m.isAbstract) needed.push({ name: m.name, n: m.params.length });
    for (const i of c.ifaces) {
      const iface = world.get(i);
      if (iface) for (const m of iface.methods) needed.push({ name: m.name, n: m.params.length });
    }
  };
  for (const c of superChain({ world } as Ctx, cls.name)) consider(c);
  const has = (name: string, n: number) => {
    for (const c of superChain({ world } as Ctx, cls.name)) {
      if (c.methods.some((m) => m.name === name && m.params.length === n && !m.isAbstract)) return true;
    }
    return false;
  };
  for (const m of needed) if (!has(m.name, m.n)) return `${m.name}()`;
  return null;
}

function builtins(ctxSeed: { nextId: number }): Map<string, RTClass> {
  const world = new Map<string, RTClass>();
  const obj: RTClass = {
    name: "Object",
    kind: "class",
    isAbstract: false,
    isFinal: false,
    superName: null,
    ifaces: [],
    fields: [],
    methods: [
      {
        name: "equals",
        access: "public",
        isStatic: false,
        isAbstract: false,
        ret: { name: "boolean", dims: 0 },
        params: [{ name: "Object", dims: 0 }],
        paramNames: ["other"],
        body: null,
        owner: "Object",
        line: 0,
        native: (_c, self, args) => {
          const o = args[0];
          return bv(!!self && self.t === "obj" && !!o && o.t === "obj" && self.id === o.id);
        },
      },
      {
        name: "hashCode",
        access: "public",
        isStatic: false,
        isAbstract: false,
        ret: { name: "int", dims: 0 },
        params: [],
        paramNames: [],
        body: null,
        owner: "Object",
        line: 0,
        native: (_c, self) => iv(self && self.t === "obj" ? self.id : 0),
      },
      {
        name: "toString",
        access: "public",
        isStatic: false,
        isAbstract: false,
        ret: { name: "String", dims: 0 },
        params: [],
        paramNames: [],
        body: null,
        owner: "Object",
        line: 0,
        native: (c, self) => freshStr(c, self && self.t === "obj" ? `${self.cls}@${self.id}` : "null"),
      },
    ],
    ctors: [],
    statics: {},
    builtin: "core",
  };
  const math: RTClass = {
    name: "Math",
    kind: "class",
    isAbstract: false,
    isFinal: true,
    superName: "Object",
    ifaces: [],
    fields: [],
    methods: ["max", "min", "abs"].map((name) => ({
      name,
      access: "public" as const,
      isStatic: true,
      isAbstract: false,
      ret: { name: "int", dims: 0 },
      params: [
        { name: "int", dims: 0 },
        { name: "int", dims: 0 },
      ].slice(0, name === "abs" ? 1 : 2),
      paramNames: name === "abs" ? ["a"] : ["a", "b"],
      body: null,
      owner: "Math",
      line: 0,
      native: (_c: Ctx, _s: JV | null, args: JV[], line: number) => {
        const a = numOf(args[0]!, line);
        if (name === "abs") return args[0]!.t === "double" ? dv(Math.abs(a)) : iv(Math.abs(a));
        const b = numOf(args[1]!, line);
        const bothInt = args[0]!.t === "int" && args[1]!.t === "int";
        const v = name === "max" ? Math.max(a, b) : Math.min(a, b);
        return bothInt ? iv(v) : dv(v);
      },
    })),
    ctors: [],
    statics: {},
    builtin: "core",
  };
  const integer: RTClass = {
    name: "Integer",
    kind: "class",
    isAbstract: false,
    isFinal: true,
    superName: "Object",
    ifaces: [],
    fields: [
      {
        name: "MAX_VALUE",
        type: { name: "int", dims: 0 },
        access: "public",
        isStatic: true,
        isFinal: true,
        init: null,
        owner: "Integer",
      },
      {
        name: "MIN_VALUE",
        type: { name: "int", dims: 0 },
        access: "public",
        isStatic: true,
        isFinal: true,
        init: null,
        owner: "Integer",
      },
    ],
    methods: [],
    ctors: [],
    statics: { MAX_VALUE: iv(2147483647), MIN_VALUE: iv(-2147483648) },
    builtin: "core",
  };
  const outObj: Extract<JV, { t: "obj" }> = { t: "obj", cls: "PrintStream", id: ctxSeed.nextId++, fields: {} };
  const print: RTClass = {
    name: "PrintStream",
    kind: "class",
    isAbstract: false,
    isFinal: true,
    superName: "Object",
    ifaces: [],
    fields: [],
    methods: [
      nativePrint("println", true, true),
      nativePrint("print", false, true),
      nativePrint("println", true, false),
    ],
    ctors: [],
    statics: {},
    builtin: "core",
  };
  const system: RTClass = {
    name: "System",
    kind: "class",
    isAbstract: false,
    isFinal: true,
    superName: "Object",
    ifaces: [],
    fields: [
      {
        name: "out",
        type: { name: "PrintStream", dims: 0 },
        access: "public",
        isStatic: true,
        isFinal: true,
        init: null,
        owner: "System",
      },
    ],
    methods: [],
    ctors: [],
    statics: { out: outObj },
    builtin: "core",
  };
  const rex: RTClass = {
    name: "RuntimeException",
    kind: "class",
    isAbstract: false,
    isFinal: false,
    superName: "Object",
    ifaces: [],
    fields: [
      {
        name: "message",
        type: { name: "String", dims: 0 },
        access: "public",
        isStatic: false,
        isFinal: false,
        init: null,
        owner: "RuntimeException",
      },
    ],
    methods: [],
    ctors: [{ params: [{ name: "String", dims: 0 }], paramNames: ["message"], body: [], line: 0 }],
    statics: {},
    builtin: "core",
  };
  for (const c of [obj, math, integer, print, system, rex, shell("ArrayList"), shell("HashMap"), shell("Stack"), shell("Queue"), shell("ArrayDeque")]) {
    world.set(c.name, c);
  }
  return world;
}

function shell(name: string): RTClass {
  const kind = name === "ArrayList" ? "list" : name === "HashMap" ? "map" : name === "Stack" ? "stack" : name === "Queue" ? "queue" : "deque";
  return {
    name,
    kind: "class",
    isAbstract: false,
    isFinal: false,
    superName: "Object",
    ifaces: [],
    fields: [],
    methods: [],
    ctors: [],
    statics: {},
    builtin: kind,
  };
}

function nativePrint(name: string, nl: boolean, withArg: boolean): RTMethod {
  return {
    name,
    access: "public",
    isStatic: false,
    isAbstract: false,
    ret: { name: "void", dims: 0 },
    params: withArg ? [{ name: "Object", dims: 0 }] : [],
    paramNames: withArg ? ["x"] : [],
    body: null,
    owner: "PrintStream",
    line: 0,
    native: (ctx, _s, args, line) => {
      const text = args.length ? stringify(ctx, args[0]!) : "";
      writeOut(ctx, text + (nl ? "\n" : ""), line);
      return { t: "void" };
    },
  };
}

function load(source: string): Map<string, RTClass> {
  if (source.length > 40_000) throw new JavaError("That file is too long for this course runner.", 0);
  const parsed = new Parser(lex(source)).parseFile();
  const world = builtins({ nextId: 1 });
  for (const p of parsed) {
    if (world.has(p.name)) throw new JavaError(`${p.name} is already defined`, p.line);
    if (p.name === "__Check" && parsed.length === 1) {
      /* harness only — still allowed when combined */
    }
    const rt: RTClass = {
      name: p.name,
      kind: p.kind,
      isAbstract: p.isAbstract,
      isFinal: p.isFinal,
      superName: p.kind === "interface" ? null : (p.superName ?? "Object"),
      ifaces: p.ifaces,
      fields: p.fields.map((f) => ({ ...f, owner: p.name })),
      methods: p.methods.map((m) => methodFromParsed(m, p.name)),
      ctors:
        p.kind === "interface"
          ? []
          : p.ctors.length > 0
            ? p.ctors
            : [{ params: [], paramNames: [], body: [], line: p.line }],
      statics: {},
    };
    world.set(p.name, rt);
  }
  verifyHierarchy(world);
  const ctx = makeCtx(world);
  for (const cls of world.values()) {
    if (cls.builtin) continue;
    for (const f of cls.fields) if (f.isStatic) cls.statics[f.name] = zero(ctx, f.type);
  }
  for (const cls of world.values()) {
    if (cls.builtin) continue;
    ctx.execClass = cls.name;
    ctx.self = null;
    ctx.frames = [new Map()];
    for (const f of cls.fields) {
      if (f.isStatic && f.init) cls.statics[f.name] = evalExpr(ctx, f.init);
    }
  }
  return world;
}

function errText(e: unknown): string {
  if (e instanceof JavaError) return e.message;
  if (e instanceof Thrown) return e.text;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}

export function grade(source: string, checks: Check[]): GradeResult {
  const trimmed = source.trim();
  if (!trimmed) return { compileError: "Write some Java first.", results: [] };
  try {
    load(source);
  } catch (e) {
    return { compileError: errText(e), results: [] };
  }
  if (/\bclass\s+__Check\b/.test(source)) {
    return { compileError: "The name __Check is reserved.", results: [] };
  }
  const results: TestRow[] = [];
  for (const check of checks) {
    const program = `${source}\nclass __Check {\n  public static void run() {\n${check.code}\n  }\n}\n`;
    try {
      const world = load(program);
      const ctx = makeCtx(world);
      const method = findMethod(ctx, "__Check", "run", [], "__Check");
      if (!method) throw new JavaError("Internal test error", 0);
      callMethod(ctx, method, null, [], 0);
      results.push({ label: check.label, ok: true, message: "Passed", output: ctx.out.join("") });
    } catch (e) {
      const output = "";
      if (e instanceof Thrown) results.push({ label: check.label, ok: false, message: e.text, output });
      else results.push({ label: check.label, ok: false, message: errText(e), output });
    }
  }
  return { compileError: null, results };
}

export function runMain(source: string): MainResult {
  const trimmed = source.trim();
  if (!trimmed) return { error: "Write some Java first.", output: "" };
  try {
    const world = load(source);
    const ctx = makeCtx(world);
    let found: RTMethod | null = null;
    let owner = "";
    for (const cls of world.values()) {
      if (cls.builtin) continue;
      const m = cls.methods.find((x) => x.isStatic && x.name === "main" && (x.params.length === 0 || (x.params.length === 1 && x.params[0]!.name === "String" && x.params[0]!.dims === 1)));
      if (m) {
        found = m;
        owner = cls.name;
        break;
      }
    }
    if (!found) {
      return {
        error: "No main method to run. Press Check to grade the exercise, or add public static void main(String[] args).",
        output: "",
      };
    }
    const args: JV[] =
      found.params.length === 1
        ? [{ t: "arr", v: [], elem: "String", dims: 1, id: ctx.nextId++ }]
        : [];
    void owner;
    callMethod(ctx, found, null, args, found.line);
    return { error: null, output: ctx.out.join("") || "(no output)" };
  } catch (e) {
    if (e instanceof Thrown) return { error: e.text, output: "" };
    return { error: errText(e), output: "" };
  }
}
