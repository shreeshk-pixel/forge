import { Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { isUnlocked, lessons, modules } from "@/lib/curriculum";
import { useForge } from "@/lib/progress";

export function PathList({
  current,
  onPick,
}: {
  current?: string;
  onPick?: () => void;
}) {
  const done = useForge((s) => s.done);
  return (
    <nav aria-label="Lessons" className="px-3 py-4">
      {modules.map((mod) => {
        const rows = lessons.filter((l) => l.module === mod.id);
        const cleared = rows.filter((l) => done[l.id] != null).length;
        return (
          <section key={mod.id} className="mb-6">
            <header className="mb-2 flex items-baseline justify-between px-2">
              <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{mod.id}</h2>
              <span className="font-mono text-xs text-muted">
                {cleared}/{rows.length}
              </span>
            </header>
            <ol className="flex flex-col gap-0.5">
              {rows.map((lesson) => {
                const open = isUnlocked(lesson.id, done);
                const stars = done[lesson.id];
                const active = lesson.id === current;
                const cls = `flex min-h-11 items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                  active ? "bg-raised text-fg" : open ? "text-fg hover:bg-surface" : "text-muted"
                }`;
                const inner = (
                  <>
                    <span className="w-4 shrink-0 text-copper" aria-hidden="true">
                      {stars != null ? <Check className="size-4" /> : open ? null : <Lock className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    {stars != null ? (
                      <span className="font-mono text-xs text-copper">{stars}</span>
                    ) : null}
                  </>
                );
                if (!open) {
                  return (
                    <li key={lesson.id}>
                      <div className={cls}>{inner}</div>
                    </li>
                  );
                }
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$lessonId"
                      params={{ lessonId: lesson.id }}
                      className={cls}
                      onClick={onPick}
                    >
                      {inner}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}
