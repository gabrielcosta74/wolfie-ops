"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Mathematics from "@tiptap/extension-mathematics";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import "katex/dist/katex.min.css";

type SectionBlock = {
  label: string;
  html: string;
};

const SECTION_BLOCKS: SectionBlock[] = [
  {
    label: "Definição",
    html: "<h2>Definição</h2><p>Escreve aqui a definição do conceito.</p>",
  },
  {
    label: "Exemplo Resolvido",
    html: "<h2>Exemplo Resolvido</h2><h3>Enunciado</h3><p>Escreve o enunciado aqui.</p><h3>Resolução</h3><p>Explica a resolução passo a passo.</p>",
  },
  {
    label: "Passos",
    html: "<h2>Passos</h2><ol><li>Passo 1</li><li>Passo 2</li><li>Passo 3</li></ol>",
  },
  {
    label: "Ideias-chave",
    html: "<h2>Ideias-chave</h2><ul><li>Ideia 1</li><li>Ideia 2</li><li>Ideia 3</li></ul>",
  },
  {
    label: "Erros Comuns",
    html: "<h2>Erros Comuns</h2><p><strong>Erro 1:</strong> Descrição do erro e como evitá-lo.</p><p><strong>Erro 2:</strong> Descrição do erro e como evitá-lo.</p>",
  },
  {
    label: "Fórmulas-chave",
    html: "<h2>Fórmulas-chave</h2><p>Equação principal: <code>escreve aqui</code></p><p>Notas: </p>",
  },
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`tiptap-toolbar-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ value, onChange, placeholder }: Props) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Mathematics,
      Placeholder.configure({ placeholder: placeholder ?? "Começa a escrever aqui..." }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. template applied)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  const insertBlock = (block: SectionBlock) => {
    if (!editor) return;
    editor.chain().focus().insertContent(block.html).run();
    setShowBlockMenu(false);
  };

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="tiptap-toolbar">
        {/* Group 1: Bold, Italic, Underline */}
        <div className="tiptap-toolbar-group">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Sublinhado (Ctrl+U)"
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarButton>
        </div>

        <div className="tiptap-toolbar-sep" />

        {/* Group 2: Headings */}
        <div className="tiptap-toolbar-group">
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título (H1)"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Subtítulo (H2)"
          >
            H2
          </ToolbarButton>
        </div>

        <div className="tiptap-toolbar-sep" />

        {/* Group 3: Lists */}
        <div className="tiptap-toolbar-group">
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com marcadores"
          >
            •—
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            1.
          </ToolbarButton>
        </div>

        <div className="tiptap-toolbar-sep" />

        {/* Group 4: Section blocks */}
        <div className="tiptap-toolbar-group tiptap-block-group">
          <ToolbarButton
            active={showBlockMenu}
            onClick={() => setShowBlockMenu((v) => !v)}
            title="Inserir secção pré-definida"
          >
            + Secção
          </ToolbarButton>

          {showBlockMenu && (
            <div className="tiptap-block-menu">
              {SECTION_BLOCKS.map((block) => (
                <button
                  key={block.label}
                  type="button"
                  className="tiptap-block-item"
                  onClick={() => insertBlock(block)}
                >
                  {block.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditorContent editor={editor} className="ac-tiptap-content" />
    </div>
  );
}
