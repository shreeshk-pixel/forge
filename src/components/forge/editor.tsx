import { useEffect, useState, type ComponentType } from "react";

type Props = { value: string; onChange: (next: string) => void };

export function JavaEditor(props: Props) {
  const [Impl, setImpl] = useState<ComponentType<Props> | null>(null);
  useEffect(() => {
    let live = true;
    void import("./editor-impl").then((mod) => {
      if (live) setImpl(() => mod.JavaEditorImpl);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!Impl) {
    return (
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        spellCheck={false}
        aria-label="Java editor"
        className="h-full min-h-96 w-full resize-none bg-bg p-4 font-mono text-sm leading-relaxed text-fg outline-none"
      />
    );
  }
  return (
    <div className="forge-editor h-full min-h-96">
      <Impl {...props} />
    </div>
  );
}
