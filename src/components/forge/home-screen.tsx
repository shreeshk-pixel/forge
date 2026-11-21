import { Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { isUnlocked, lessons, modules } from "@/lib/curriculum";
import { useForge } from "@/lib/progress";
import { ShardMeter } from "@/components/forge/shards";

export function HomeScreen() {
  const done = useForge((s) => s.done);
  const cleared = lessons.filter((l) => done[l.id] != null).length;
  const next = lessons.find((l) => done[l.id] == null && isUnlocked(l.id, done)) ?? lessons[0]!;
  const pct = Math.round((cleared / lessons.length) * 100);
  const router = useRouter();

  useEffect(() => {
    void router.preloadRoute({ to: "/learn/$lessonId", params: { lessonId: next.id } });
    void import("@/components/forge/editor-impl");
  }, [router, next.id]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex items-center justify-between border-b border-line px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          <span className="size-2.5 bg-copper" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide">Forge</span>
        </div>
        <ShardMeter />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <p className="font-mono text-xs tracking-widest text-copper uppercase">Java, written by hand</p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
          The next lesson opens when this one passes.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Thirty-eight exercises from variables through Dijkstra. You write the Java. Hidden tests decide.
          Hints spend shards, which come back on their own. Nothing here is a quiz.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            to="/learn/$lessonId"
            params={{ lessonId: next.id }}
            preload="render"
            className="inline-flex min-h-11 items-center bg-copper px-4 text-sm font-medium text-copper-ink"
          >
            {cleared === 0 ? "Start with variables" : `Continue · ${next.title}`}
          </Link>
          <p className="font-mono text-sm text-muted">
            {cleared}/{lessons.length} cleared
          </p>
        </div>
        <div className="mt-4 h-1 overflow-hidden bg-raised" aria-hidden="true">
          <div className="h-full bg-copper" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-12 flex flex-col gap-10">
          {modules.map((mod) => {
            const rows = lessons.filter((l) => l.module === mod.id);
            return (
              <section key={mod.id}>
                <h2 className="text-lg font-semibold">{mod.id}</h2>
                <p className="mt-1 max-w-xl text-sm text-muted">{mod.summary}</p>
                <ol className="mt-4 divide-y divide-line border-y border-line">
                  {rows.map((lesson, index) => {
                    const open = isUnlocked(lesson.id, done);
                    const stars = done[lesson.id];
                    const label = (
                      <span className="flex min-h-12 items-center gap-3 py-2">
                        <span className="w-6 font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">{lesson.title}</span>
                          <span className="block truncate text-xs text-muted">{lesson.blurb}</span>
                        </span>
                        <span className="font-mono text-xs text-copper">
                          {stars != null ? `${stars}★` : open ? "Open" : "Locked"}
                        </span>
                      </span>
                    );
                    return (
                      <li key={lesson.id}>
                        {open ? (
                          <Link to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="block hover:bg-surface">
                            {label}
                          </Link>
                        ) : (
                          <div className="opacity-60">{label}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
