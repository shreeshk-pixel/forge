import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";

const theme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-bg)",
      color: "var(--color-fg)",
      height: "100%",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
      caretColor: "var(--color-copper)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-copper)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--color-copper) 28%, transparent)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-muted)",
      borderRight: "1px solid var(--color-line)",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--color-raised) 70%, transparent)",
    },
  },
  { dark: true },
);

export function JavaEditorImpl({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme}
      extensions={[java()]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        autocompletion: false,
      }}
    />
  );
}
