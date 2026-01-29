'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { 
  Bold, Italic, Code, List, ListOrdered, Quote, 
  Heading1, Heading2, Heading3, Minus, Undo, Redo,
  Link as LinkIcon
} from 'lucide-react'
import { useEffect, useCallback } from 'react'

interface WysiwygEditorProps {
  content: string
  onChange: (markdown: string) => void
  placeholder?: string
}

// Convert markdown to HTML for TipTap
function markdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines in non-list context
    .replace(/\n/g, '<br>')
  
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`)
  
  // Wrap in paragraph if not starting with block element
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<blockquote')) {
    html = `<p>${html}</p>`
  }
  
  return html
}

// Convert HTML back to Markdown
function htmlToMarkdown(html: string): string {
  let markdown = html
    // Remove wrapper tags
    .replace(/<\/?p>/g, '\n')
    // Headers
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    // Bold
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    // Italic
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    // Code
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    // Links
    .replace(/<a href="([^"]+)">(.*?)<\/a>/g, '[$2]($1)')
    // Blockquotes
    .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
    // Horizontal rule
    .replace(/<hr\s*\/?>/g, '---\n')
    // List items
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    // Remove ul/ol wrappers
    .replace(/<\/?[uo]l>/g, '')
    // Line breaks
    .replace(/<br\s*\/?>/g, '\n')
    // Clean up extra newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return markdown
}

export default function WysiwygEditor({ content, onChange, placeholder }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(content))
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return <div className="p-6 text-white/40">Loading editor...</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-white/10 bg-black/20 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        
        <div className="flex-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}

function ToolbarButton({ 
  children, 
  onClick, 
  active, 
  disabled,
  title 
}: { 
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-md transition-colors
        ${active 
          ? 'bg-[#4169E1]/20 text-[#4169E1]' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  )
}
