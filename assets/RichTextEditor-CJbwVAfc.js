import{e as h,R as d,j as e,E as u}from"./vendor-react-BhR5jwqz.js";import{bM as g,bN as x,bO as b,bP as m,bQ as f,bR as p,bS as j,bT as w,bU as k,bV as v,bW as A,bX as C,bY as N,bZ as T,b_ as L,b$ as H,c0 as R,c1 as y,c2 as I,c3 as B,bl as z,c4 as E,c5 as M,c6 as U,c7 as Y,c8 as $,b6 as S,c9 as F,ca as O,cb as q}from"./vendor-BikAq8Xc.js";function i({onClick:t,active:s,disabled:c,label:n,children:l}){return e.jsx("button",{type:"button",onClick:t,disabled:c,title:n,"aria-label":n,className:`inline-flex items-center justify-center h-8 w-8 rounded transition-colors ${s?"bg-blue-500/30 text-blue-300 border border-blue-500/40":"text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"} disabled:opacity-40 disabled:cursor-not-allowed`,children:l})}function a(){return e.jsx("div",{className:"w-px h-6 bg-white/10 mx-1"})}function P({editor:t}){if(!t)return null;const s=()=>{const r=t.getAttributes("link").href||"",o=window.prompt("Enter URL:",r);if(o!==null){if(o===""){t.chain().focus().extendMarkRange("link").unsetLink().run();return}t.chain().focus().extendMarkRange("link").setLink({href:o}).run()}},c=()=>{const r=window.prompt("Image URL:");r&&t.chain().focus().setImage({src:r}).run()},n=()=>{const r=window.prompt("YouTube URL:");r&&t.commands.setYoutubeVideo({src:r,width:640,height:360})},l=()=>{t.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:!0}).run()};return e.jsxs("div",{className:"flex flex-wrap items-center gap-1 p-2 bg-gray-900/60 border-b border-white/10 rounded-t-lg",children:[e.jsx(i,{onClick:()=>t.chain().focus().toggleHeading({level:1}).run(),active:t.isActive("heading",{level:1}),label:"Heading 1",children:e.jsx(A,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleHeading({level:2}).run(),active:t.isActive("heading",{level:2}),label:"Heading 2",children:e.jsx(C,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleHeading({level:3}).run(),active:t.isActive("heading",{level:3}),label:"Heading 3",children:e.jsx(N,{className:"h-4 w-4"})}),e.jsx(a,{}),e.jsx(i,{onClick:()=>t.chain().focus().toggleBold().run(),active:t.isActive("bold"),label:"Bold",children:e.jsx(T,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleItalic().run(),active:t.isActive("italic"),label:"Italic",children:e.jsx(L,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleStrike().run(),active:t.isActive("strike"),label:"Strikethrough",children:e.jsx(H,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleCode().run(),active:t.isActive("code"),label:"Inline code",children:e.jsx(R,{className:"h-4 w-4"})}),e.jsx(a,{}),e.jsx(i,{onClick:()=>t.chain().focus().toggleBulletList().run(),active:t.isActive("bulletList"),label:"Bullet list",children:e.jsx(y,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleOrderedList().run(),active:t.isActive("orderedList"),label:"Numbered list",children:e.jsx(I,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().toggleBlockquote().run(),active:t.isActive("blockquote"),label:"Quote",children:e.jsx(B,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().setHorizontalRule().run(),label:"Horizontal rule",children:e.jsx(z,{className:"h-4 w-4"})}),e.jsx(a,{}),e.jsx(i,{onClick:()=>t.chain().focus().setTextAlign("left").run(),active:t.isActive({textAlign:"left"}),label:"Align left",children:e.jsx(E,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().setTextAlign("center").run(),active:t.isActive({textAlign:"center"}),label:"Align center",children:e.jsx(M,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().setTextAlign("right").run(),active:t.isActive({textAlign:"right"}),label:"Align right",children:e.jsx(U,{className:"h-4 w-4"})}),e.jsx(a,{}),e.jsx(i,{onClick:s,active:t.isActive("link"),label:"Link",children:e.jsx(Y,{className:"h-4 w-4"})}),e.jsx(i,{onClick:c,label:"Insert image",children:e.jsx($,{className:"h-4 w-4"})}),e.jsx(i,{onClick:n,label:"Embed YouTube",children:e.jsx(S,{className:"h-4 w-4"})}),e.jsx(i,{onClick:l,label:"Insert table",children:e.jsx(F,{className:"h-4 w-4"})}),e.jsx(a,{}),e.jsx(i,{onClick:()=>t.chain().focus().undo().run(),disabled:!t.can().undo(),label:"Undo",children:e.jsx(O,{className:"h-4 w-4"})}),e.jsx(i,{onClick:()=>t.chain().focus().redo().run(),disabled:!t.can().redo(),label:"Redo",children:e.jsx(q,{className:"h-4 w-4"})})]})}function V({value:t,onChange:s,placeholder:c="Start typing..."}){const n=h({extensions:[g.configure({heading:{levels:[1,2,3]},codeBlock:!1}),x.configure({placeholder:c}),b.configure({openOnClick:!1,autolink:!0,HTMLAttributes:{rel:"noopener noreferrer nofollow",target:"_blank"}}),m.configure({HTMLAttributes:{class:"rte-image"},allowBase64:!0,inline:!1}),f.configure({types:["heading","paragraph"]}),p.configure({controls:!0,nocookie:!0,width:640,height:360}),j.configure({resizable:!0}),w,k,v],content:t||"",onUpdate:({editor:l})=>{const r=l.getHTML();s&&s(r==="<p></p>"?"":r)},editorProps:{attributes:{class:"rich-text-editor-content prose prose-invert max-w-none focus:outline-none min-h-[240px] px-4 py-3"}}});return d.useEffect(()=>{if(!n)return;const l=n.getHTML();(t||"")!==l&&(t||"")!==(l==="<p></p>"?"":l)&&n.commands.setContent(t||"",{emitUpdate:!1})},[t,n]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"rich-text-editor-shell",children:[e.jsx(P,{editor:n}),e.jsx(u,{editor:n})]})]})}export{V as R};
