import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Lightbulb, Play, RotateCcw } from "lucide-react";
import { assess, isUnlocked, lessonIndex, lessons, type Lesson } from "@/lib/curriculum";
import type { GradeResult } from "@/lib/java/engine";
import { runMain } from "@/lib/java/engine";
import { useForge, type Stars } from "@/lib/progress";
import { JavaEditor } from "@/components/forge/editor";
import { PathList } from "@/components/forge/path-list";
import { ShardMeter } from "@/components/forge/shards";

export function LessonScreen({ lesson }: { lesson: Lesson }) {
  const done = useForge((s) => s.done);
  const hinted = useForge((s) => s.hinted[lesson.id] === true);
  const revealed = useForge((s) => s.revealed[lesson.id] === true);
  const shards = useForge((s) => s.shards);
  const open = isUnlocked(lesson.id, done);
  const [pathOpen, setPathOpen] = useState(false);
  const [code, setCode] = useState(lesson.starter);
  const [booted, setBooted] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [runNote, setRunNote] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const draft = useForge.getState().drafts[lesson.id];
    setCode(draft ?? lesson.starter);
    setGrade(null);
    setRunNote(null);
    setNotice(null);
    setBooted(true);
  }, [lesson.id]);

  useEffect(() => {
    if (!booted) return;
    const handle = window.setTimeout(() => useForge.getState().saveDraft(lesson.id, code), 300);
    return () => window.clearTimeout(handle);
  }, [booted, code, lesson.id]);

  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        gradeNow(codeRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson.id]);

  const index = lessonIndex(lesson.id);
  const stars = done[lesson.id];
  const passed = grade != null && grade.compileError == null && grade.results.length > 0 && grade.results.every((row) => row.ok);
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;

  function gradeNow(source: string) {
    const result = assess(source, lesson);
    setGrade(result);
    setRunNote(null);
    const ok = result.compileError == null && result.results.length > 0 && result.results.every((row) => row.ok);
    if (!ok) return;
    const state = useForge.getState();
    const earned: Stars = state.revealed[lesson.id] ? 1 : state.hinted[lesson.id] ? 2 : 3;
    state.mark(lesson.id, earned);
  }

  function check() {
    gradeNow(code);
  }

  function run() {
    const result = runMain(code);
    setRunNote(result.error ?? result.output);
    setGrade(null);
  }

  function onHint() {
    const ok = useForge.getState().spendHint(lesson.id);
    setNotice(ok ? null : "No shards left. They return, one every four hours.");
  }

  function onSolution() {
    const state = useForge.getState();
    if (!state.hinted[lesson.id]) {
      setNotice("Read the hint first. The solution costs two shards after that.");
      return;
    }
    const ok = state.spendSolution(lesson.id);
    if (!ok) {
      setNotice("A solution costs 2 shards.");
      return;
    }
    setCode(lesson.solution);
    setNotice("Solution loaded. A clean solve is worth more, but you can still move on.");
  }

  function reset() {
    useForge.getState().clearDraft(lesson.id);
    setCode(lesson.starter);
    setGrade(null);
    setRunNote(null);
  }

  if (!open) {
    const prev = lessons[index - 1];
    return (
      <Shell lesson={lesson} pathOpen={pathOpen} setPathOpen={setPathOpen}>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="text-2xl font-semibold">{lesson.title} is locked</h1>
          <p className="mt-3 text-muted">
            Finish {prev ? prev.title : "the previous lesson"} first. The order is the point.
          </p>
          {prev ? (
            <Link
              to="/learn/$lessonId"
              params={{ lessonId: prev.id }}
              className="mt-6 inline-flex min-h-11 items-center bg-copper px-4 text-sm font-medium text-copper-ink"
            >
              Go to {prev.title}
            </Link>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell lesson={lesson} pathOpen={pathOpen} setPathOpen={setPathOpen}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <article className="border-b border-line px-4 py-4 lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <p className="font-mono text-xs tracking-widest text-copper uppercase">
            {lesson.module} · {index + 1}/{lessons.length}
            {stars != null ? ` · ${stars} stars` : ""}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
          <div className="mt-4 flex flex-col gap-3 text-sm text-fg">
            {lesson.concept.map((paragraph) => (
              <p key={paragraph} className="text-muted">
                <InlineCode text={paragraph} />
              </p>
            ))}
          </div>
          <h2 className="mt-6 text-sm font-medium">Your job</h2>
          <p className="mt-2 text-sm">
            <InlineCode text={lesson.task} />
          </p>
          {hinted ? (
            <div className="mt-4 border border-line bg-surface p-3 text-sm">
              <p className="font-mono text-xs tracking-wide text-copper uppercase">Hint</p>
              <p className="mt-2 text-muted">{lesson.hint}</p>
            </div>
          ) : null}
          {notice ? <p className="mt-4 text-sm text-bad">{notice}</p> : null}
        </article>

        <section className="flex min-h-[36rem] min-w-0 flex-1 flex-col lg:min-h-0">
          <div className="min-h-96 flex-1 border-b border-line">
            <JavaEditor value={code} onChange={setCode} />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <button type="button" onClick={check} className="inline-flex min-h-11 items-center bg-copper px-4 text-sm font-medium text-copper-ink">
              Check
            </button>
            <button type="button" onClick={run} className="inline-flex min-h-11 items-center gap-2 border border-line px-3 text-sm">
              <Play className="size-4" aria-hidden="true" />
              Run main
            </button>
            <button type="button" onClick={onHint} className="inline-flex min-h-11 items-center gap-2 border border-line px-3 text-sm">
              <Lightbulb className="size-4" aria-hidden="true" />
              Hint · 1
            </button>
            <button
              type="button"
              onClick={onSolution}
              disabled={!hinted || (shards < 2 && !revealed)}
              className="inline-flex min-h-11 items-center border border-line px-3 text-sm disabled:opacity-40"
            >
              Solution · 2
            </button>
            <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-muted">
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </button>
            <span className="ml-auto hidden font-mono text-xs text-muted sm:inline">Ctrl+Enter checks</span>
          </div>
          <div className="max-h-64 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed lg:max-h-52">
            <Console grade={grade} runNote={runNote} passed={passed} stars={stars} next={next} />
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Shell({
  lesson,
  pathOpen,
  setPathOpen,
  children,
}: {
  lesson: Lesson;
  pathOpen: boolean;
  setPathOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:h-dvh lg:overflow-hidden">
      <header className="flex items-center gap-3 border-b border-line px-3 py-2">
        <Link to="/" className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted" aria-label="Back to path">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lesson.title}</p>
          <p className="text-xs text-muted">{lesson.blurb}</p>
        </div>
        <button type="button" className="min-h-11 border border-line px-3 text-sm lg:hidden" onClick={() => setPathOpen(true)}>
          Path
        </button>
        <ShardMeter />
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-line lg:block">
          <PathList current={lesson.id} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      {pathOpen ? (
        <div className="fixed inset-0 z-20 flex flex-col bg-bg lg:hidden">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-medium">Path</p>
            <button type="button" className="min-h-11 px-3 text-sm" onClick={() => setPathOpen(false)}>
              Close
            </button>
          </div>
          <div className="overflow-y-auto">
            <PathList current={lesson.id} onPick={() => setPathOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Console({
  grade,
  runNote,
  passed,
  stars,
  next,
}: {
  grade: GradeResult | null;
  runNote: string | null;
  passed: boolean;
  stars: Stars | undefined;
  next: Lesson | undefined;
}) {
  if (runNote != null && grade == null) {
    return <pre className="whitespace-pre-wrap text-muted">{runNote}</pre>;
  }
  if (grade == null) {
    return <p className="text-muted">Check runs the hidden tests. Run main only prints if you wrote a main method.</p>;
  }
  if (grade.compileError) {
    return <p className="whitespace-pre-wrap text-bad">{grade.compileError}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {passed ? (
        <p className="text-ok">
          Cleared{stars != null ? ` · ${stars} star${stars === 1 ? "" : "s"}` : ""}.
          {next ? " The next lesson is open." : " That was the last one."}
        </p>
      ) : (
        <p className="text-bad">Not yet. Fix the failing tests and check again.</p>
      )}
      <ul className="flex flex-col gap-1">
        {grade.results.map((row) => (
          <li key={row.label} className={row.ok ? "text-ok" : "text-bad"}>
            {row.ok ? "pass" : "fail"} {row.label}
            {row.ok ? "" : ` — ${row.message}`}
          </li>
        ))}
      </ul>
      {passed && next ? (
        <Link to="/learn/$lessonId" params={{ lessonId: next.id }} className="mt-2 inline-flex min-h-11 w-fit items-center bg-copper px-4 text-sm font-medium text-copper-ink">
          Next · {next.title}
        </Link>
      ) : null}
      {passed && !next ? (
        <Link to="/" className="mt-2 inline-flex min-h-11 w-fit items-center border border-line px-4 text-sm">
          Back to the path
        </Link>
      ) : null}
    </div>
  );
}

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={index} className="font-mono text-sm text-copper">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
