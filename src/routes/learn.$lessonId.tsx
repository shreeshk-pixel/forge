import { createFileRoute } from "@tanstack/react-router";
import { LessonScreen } from "@/components/forge/lesson-screen";
import { lessonById } from "@/lib/curriculum";

export const Route = createFileRoute("/learn/$lessonId")({
  ssr: false,
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: OpeningLesson,
  component: LessonRoute,
});

function OpeningLesson() {
  return (
    <main className="flex h-dvh flex-col bg-bg text-fg">
      <div className="h-1 bg-copper" role="progressbar" aria-label="Opening the lesson" />
      <p className="px-4 py-6 text-sm text-muted">Opening the lesson…</p>
    </main>
  );
}

function LessonRoute() {
  const { lessonId } = Route.useParams();
  const lesson = lessonById(lessonId);
  if (!lesson) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">That lesson is not on the path.</h1>
        <a href="/" className="mt-4 inline-flex min-h-11 items-center text-copper">
          Back to Forge
        </a>
      </main>
    );
  }
  return <LessonScreen lesson={lesson} />;
}
