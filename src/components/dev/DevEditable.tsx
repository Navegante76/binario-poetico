import { useCallback, useRef } from "react";
import { useContent } from "@/lib/dev-auth";

interface DevEditableProps {
  /** Dot-notation path in the SiteContent object, e.g. "hero.subtitle" */
  path: string;
  /** The text to display (from content store) */
  value: string;
  /** HTML element tag, defaults to "span" */
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div" | "li";
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** If true, editing is disabled even in dev mode */
  locked?: boolean;
}

/**
 * DevEditable renders text normally for visitors, but in developer mode
 * makes it editable with contentEditable. Changes are persisted immediately
 * on blur via the content context.
 *
 * Inline styles + data attributes guarantee:
 *  - the editable span wraps correctly (inline-block, max-width: 100%),
 *  - long words break instead of overflowing the parent (word-break),
 *  - whitespace is preserved (white-space: pre-wrap),
 *  - browser extensions (Grammarly, LanguageTool) cannot inject their UI
 *    into the contenteditable surface (data-gramm="false", spellCheck=false).
 */
export function DevEditable({
  path,
  value,
  as: Tag = "span",
  className,
  style,
  locked = false,
}: DevEditableProps) {
  const { isDevMode, updateContent } = useContent();
  const ref = useRef<HTMLElement>(null);
  const originalRef = useRef(value);

  const editable = isDevMode && !locked;

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const newText = ref.current.textContent ?? "";
    const trimmed = newText.trim();
    if (trimmed && trimmed !== originalRef.current) {
      originalRef.current = trimmed;
      updateContent(path, trimmed);
    } else if (!trimmed) {
      ref.current.textContent = originalRef.current;
    }
  }, [path, updateContent]);

  const handleFocus = useCallback(() => {
    originalRef.current = ref.current?.textContent ?? value;
  }, [value]);

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={`${className ?? ""} dev-editable`.trim()}
      style={{
        display: "inline-block",
        maxWidth: "100%",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        outline: "2px dashed rgba(220, 38, 38, 0.35)",
        outlineOffset: 2,
        borderRadius: 4,
        cursor: "text",
        transition: "outline-color 0.2s",
        ...style,
      }}
      title={`Editar: ${path}`}
    >
      {value}
    </Tag>
  );
}

export function EditDot() {
  return null;
}
