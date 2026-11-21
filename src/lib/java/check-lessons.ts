import { assess, lessons } from "../curriculum.ts";

let failed = 0;
for (const lesson of lessons) {
  const solved = assess(lesson.solution, lesson);
  const solOk = !solved.compileError && solved.results.length > 0 && solved.results.every((r) => r.ok);
  if (!solOk) {
    failed++;
    console.error("SOLUTION FAIL", lesson.id, JSON.stringify(solved, null, 2));
  }
  const start = assess(lesson.starter, lesson);
  const startOk = !start.compileError && start.results.length > 0 && start.results.every((r) => r.ok);
  if (startOk) {
    failed++;
    console.error("STARTER ALREADY PASSES", lesson.id);
  }
  if (solOk && !startOk) console.log("ok", lesson.id);
}
if (failed) {
  console.error("failed", failed);
  process.exit(1);
}
console.log("lessons", lessons.length);
