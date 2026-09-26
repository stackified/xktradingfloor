import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Youtube } from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { looksLikeHtmlSource, extractBodyHtml } from "../../utils/richText.js";
import { isDesignedHtml, buildDesignedHtml } from "../../utils/designedHtml.js";
import DesignedHtml from "./DesignedHtml.jsx";
import {
  FileCode,
  LayoutTemplate,
  Eye,
  Code2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Minus,
} from "lucide-react";

// Pasted HTML source is interpreted rather than escaped; the helpers live in
// utils/richText.js so the pages that render stored content share them
// without pulling the editor (and Tiptap) into their chunk.
function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center h-8 w-8 rounded transition-colors ${
        active
          ? "bg-blue-500/30 text-blue-300 border border-blue-500/40"
          : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

function Toolbar({ editor, sourceMode, onToggleSource, onDesign }) {
  if (!editor) return null;

  const promptForLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const promptForImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const promptForYoutube = () => {
    const url = window.prompt("YouTube URL:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-900/60 border-b border-white/10 rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        label="Inline code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        label="Horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={promptForLink} active={editor.isActive("link")} label="Link">
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={promptForImage} label="Insert image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={promptForYoutube} label="Embed YouTube">
        <YoutubeIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addTable} label="Insert table">
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={onToggleSource}
        active={sourceMode}
        label={sourceMode ? "Back to visual editor" : "Edit HTML source"}
      >
        <FileCode className="h-4 w-4" />
      </ToolbarButton>
      {onDesign && (
        <ToolbarButton onClick={onDesign} label="Paste a designed HTML page (keeps its styling)">
          <LayoutTemplate className="h-4 w-4" />
        </ToolbarButton>
      )}
    </div>
  );
}

// Designed-HTML mode: the pasted page is kept verbatim (styles included) and
// shown in a live preview instead of being flattened by the visual editor.
function DesignPanel({ source, onSourceChange, onLeave }) {
  const [tab, setTab] = React.useState(source.trim() ? "preview" : "code");
  const stored = React.useMemo(() => buildDesignedHtml(source), [source]);
  const tabClass = (active) =>
    `inline-flex items-center gap-1.5 px-3 h-8 rounded text-xs font-medium transition-colors ${
      active
        ? "bg-blue-500/30 text-blue-200 border border-blue-500/40"
        : "text-gray-300 hover:bg-white/10 border border-transparent"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-900/60 border-b border-white/10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 px-2">
          <LayoutTemplate className="h-4 w-4" /> Designed HTML
        </span>
        <button type="button" className={tabClass(tab === "preview")} onClick={() => setTab("preview")}>
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button type="button" className={tabClass(tab === "code")} onClick={() => setTab("code")}>
          <Code2 className="h-3.5 w-3.5" /> Code
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="ml-auto text-xs text-gray-400 hover:text-white px-2 h-8"
          title="Convert to the normal editor (the page's own styling will be removed)"
        >
          Switch to normal editor
        </button>
      </div>
      {tab === "code" ? (
        <div>
          <textarea
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            spellCheck={false}
            aria-label="Designed HTML source"
            placeholder="Paste the full HTML page here, including its <style> block."
            className="w-full min-h-[360px] bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-gray-200 focus:outline-none resize-y"
          />
          <p className="px-4 pb-2 text-xs text-gray-500">
            The page is shown exactly as designed. Scripts, forms and embedded frames are removed for
            safety; links, images, tables and FAQ dropdowns (&lt;details&gt;) keep working.
          </p>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto bg-black/40">
          {stored ? (
            <DesignedHtml content={stored} />
          ) : (
            <p className="p-6 text-sm text-gray-500">
              Nothing to preview yet — paste the HTML in the Code tab.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const HAS_STYLE_RE = /<style[\s>]/i;

function RichTextEditor({ value, onChange, placeholder = "Start typing...", allowDesign = false }) {
  const [sourceMode, setSourceMode] = React.useState(false);
  const [sourceText, setSourceText] = React.useState("");
  // Designed-HTML mode, offered only where the public page can render it
  // (company descriptions, blog posts).
  const startsDesigned = allowDesign && isDesignedHtml(value);
  const [designMode, setDesignMode] = React.useState(startsDesigned);
  const [designSource, setDesignSource] = React.useState(startsDesigned ? value : "");
  const enterDesignRef = React.useRef(null);

  const editor = useEditor({    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rte-image" },
        allowBase64: true,
        inline: false,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      if (onChange) onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-editor-content prose prose-invert max-w-none focus:outline-none min-h-[240px] px-4 py-3",
      },
      // Pasted HTML source arrives as text/plain (a code editor may add a
      // text/html flavour, but that is just the same source wrapped in
      // <span>s). Real rich content pasted from a web page or Word has no
      // tags in its text/plain flavour, so it is left to the default path.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        // A whole designed page (it carries its own <style>): keep it as designed.
        if (allowDesign && text && HAS_STYLE_RE.test(text) && enterDesignRef.current) {
          enterDesignRef.current(text);
          return true;
        }
        if (!looksLikeHtmlSource(text)) return false;
        const html = extractBodyHtml(text);
        if (!html) return false;
        view.pasteHTML(html);
        return true;
      },
    },
  });

  // Source mode shows the HTML in a textarea. Leaving it feeds the (cleaned)
  // markup back through the editor, which also normalises it and fires
  // onChange with the canonical HTML.
  const enterDesign = (text) => {
    setDesignSource(text || "");
    setDesignMode(true);
    setSourceMode(false);
    if (onChange) onChange(buildDesignedHtml(text || ""));
  };
  enterDesignRef.current = enterDesign;

  const handleDesignChange = (text) => {
    setDesignSource(text);
    if (onChange) onChange(buildDesignedHtml(text));
  };

  const leaveDesign = () => {
    if (
      designSource.trim() &&
      !window.confirm(
        "Switch to the normal editor? The page's own design (colours, cards, layout) will be removed and only the text kept."
      )
    ) {
      return;
    }
    setDesignMode(false);
    if (editor) editor.commands.setContent(extractBodyHtml(designSource), { emitUpdate: true });
  };

  const toggleSource = () => {
    if (!editor) return;
    if (sourceMode) {
      if (allowDesign && HAS_STYLE_RE.test(sourceText)) {
        enterDesign(sourceText);
        return;
      }
      editor.commands.setContent(extractBodyHtml(sourceText), { emitUpdate: true });
      setSourceMode(false);
      return;
    }
    const html = editor.getHTML();
    setSourceText(html === "<p></p>" ? "" : html);
    setSourceMode(true);
  };

  // Keep the parent's value current while typing in source mode, so saving
  // the form without toggling back still persists what is on screen.
  const handleSourceChange = (e) => {
    const text = e.target.value;
    setSourceText(text);
    if (!onChange) return;
    onChange(allowDesign && HAS_STYLE_RE.test(text) ? buildDesignedHtml(text) : extractBodyHtml(text));
  };

  React.useEffect(() => {
    // Stored designed content (e.g. opening an existing company to edit) must
    // never go through the visual editor, which would strip its styling.
    if (allowDesign && isDesignedHtml(value)) {
      if (!designMode) {
        setDesignSource(value);
        setDesignMode(true);
      }
      return;
    }
    if (!editor || designMode) return;
    const current = editor.getHTML();
    if ((value || "") !== current && (value || "") !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor, allowDesign]);

  return (
    <>
      <style>{`
        .rich-text-editor-shell {
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 0.5rem;
          background: rgba(17,24,39,0.4);
          overflow: hidden;
        }
        .rich-text-editor-content {
          color: white;
          font-size: 14px;
        }
        .rich-text-editor-content:focus { outline: none; }
        .rich-text-editor-content h1 { font-size: 1.75rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
        .rich-text-editor-content h2 { font-size: 1.4rem;  font-weight: 700; margin: 0.7rem 0 0.4rem; }
        .rich-text-editor-content h3 { font-size: 1.15rem; font-weight: 600; margin: 0.6rem 0 0.35rem; }
        .rich-text-editor-content p { margin: 0.35rem 0; line-height: 1.65; }
        .rich-text-editor-content ul, .rich-text-editor-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-text-editor-content ul { list-style: disc; }
        .rich-text-editor-content ol { list-style: decimal; }
        .rich-text-editor-content blockquote {
          border-left: 3px solid rgba(59,130,246,0.5);
          padding-left: 1rem;
          color: #cbd5e1;
          margin: 0.5rem 0;
          font-style: italic;
        }
        .rich-text-editor-content a { color: #60a5fa; text-decoration: underline; }
        .rich-text-editor-content code {
          background: rgba(255,255,255,0.08);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .rich-text-editor-content hr {
          border: 0;
          border-top: 1px solid rgba(255,255,255,0.12);
          margin: 1rem 0;
        }
        .rich-text-editor-content .rte-image,
        .rich-text-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.75rem 0;
          display: block;
        }
        .rich-text-editor-content iframe {
          max-width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.5rem;
          margin: 0.75rem 0;
        }
        .rich-text-editor-content table {
          border-collapse: collapse;
          margin: 0.75rem 0;
          overflow: hidden;
          width: 100%;
        }
        .rich-text-editor-content th, .rich-text-editor-content td {
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.4rem 0.6rem;
          vertical-align: top;
        }
        .rich-text-editor-content th {
          background: rgba(255,255,255,0.06);
          font-weight: 600;
          text-align: left;
        }
        .rich-text-editor-content .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(156,163,175,0.5);
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <div className="rich-text-editor-shell">
        {designMode ? (
          <DesignPanel source={designSource} onSourceChange={handleDesignChange} onLeave={leaveDesign} />
        ) : (
        <>
        <Toolbar
          editor={editor}
          sourceMode={sourceMode}
          onToggleSource={toggleSource}
          onDesign={allowDesign ? () => enterDesign("") : undefined}
        />
        {sourceMode ? (
          <div>
            <textarea
              value={sourceText}
              onChange={handleSourceChange}
              spellCheck={false}
              aria-label="HTML source"
              className="w-full min-h-[240px] bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-gray-200 focus:outline-none resize-y"
            />
            <p className="px-4 pb-2 text-xs text-gray-500">
              Paste or edit HTML here. Only the page content is kept &mdash; document tags such as
              <code className="mx-1">&lt;head&gt;</code>and<code className="mx-1">&lt;meta&gt;</code>are dropped.
            </p>
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
        </>
        )}
      </div>
    </>
  );
}

export default RichTextEditor;
