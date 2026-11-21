import { createFileRoute } from "@tanstack/react-router";
import { LessonScreen } from "@/components/forge/lesson-screen";
import { lessonById } from "@/lib/curriculum";

export const Route = createFileRoute("/learn/$lessonId")({
  component: LessonRoute,
});

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
