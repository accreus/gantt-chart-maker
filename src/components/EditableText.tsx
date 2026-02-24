import React, { useState, useRef } from "react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, className = "", style }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    setEditing(false);
    onChange(draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className={`bg-transparent border-none outline-none ${className}`}
        style={{ ...style, width: `${Math.max(draft.length, 3)}ch` }}
      />
    );
  }

  return (
    <span
      onDoubleClick={startEdit}
      className={`cursor-pointer hover:opacity-70 ${className}`}
      style={style}
      title="Double-click to edit"
    >
      {value || "\u00A0"}
    </span>
  );
};

export default EditableText;
