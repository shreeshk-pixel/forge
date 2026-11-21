import { useEffect, useState, type ComponentType } from "react";

type Props = { value: string; onChange: (next: string) => void };

const editorLoad = typeof window === "undefined" ? null : import("./editor-impl");

export function JavaEditor(props: Props) {
  const [Impl, setImpl] = useState<ComponentType<Props> | null>(null);
  useEffect(() => {
    let live = true;
    const pending = editorLoad ?? import("./editor-impl");
    void pending.then((mod) => {
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
        className="h-full min-h-0 w-full resize-none bg-bg p-4 font-mono text-sm leading-relaxed text-fg outline-none"
      />
    );
  }
  return (
    <div className="forge-editor h-full min-h-0">
      <Impl {...props} />
    </div>
  );
}
