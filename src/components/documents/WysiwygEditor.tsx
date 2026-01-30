'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
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
  onEditorReady?: (editor: Editor) => void
}

// Convert markdown to HTML for TipTap
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const htmlLines: string[] = []
  let inList = false
  let listType = ''
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    
    // Check for list items
    const unorderedMatch = line.match(/^- (.*)$/)
    const orderedMatch = line.match(/^\d+\. (.*)$/)
    
    if (unorderedMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) htmlLines.push(`</${listType}>`)
        htmlLines.push('<ul>')
        inList = true
        listType = 'ul'
      }
      htmlLines.push(`<li>${processInline(unorderedMatch[1])}</li>`)
      continue
    }
    
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) htmlLines.push(`</${listType}>`)
        htmlLines.push('<ol>')
        inList = true
        listType = 'ol'
      }
      htmlLines.push(`<li>${processInline(orderedMatch[1])}</li>`)
      continue
    }
    
    // Close list if we were in one
    if (inList) {
      htmlLines.push(`</${listType}>`)
      inList = false
      listType = ''
    }
    
    // Headers
    if (line.startsWith('### ')) {
      htmlLines.push(`<h3>${processInline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      htmlLines.push(`<h2>${processInline(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      htmlLines.push(`<h1>${processInline(line.slice(2))}</h1>`)
      continue
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      htmlLines.push(`<blockquote>${processInline(line.slice(2))}</blockquote>`)
      continue
    }
    
    // Horizontal rule
    if (line === '---') {
      htmlLines.push('<hr>')
      continue
    }
    
    // Empty line - skip (paragraph spacing handled by CSS, not empty tags)
    if (line.trim() === '') {
      continue
    }
    
    // Regular paragraph
    htmlLines.push(`<p>${processInline(line)}</p>`)
  }
  
  // Close any open list
  if (inList) {
    htmlLines.push(`</${listType}>`)
  }
  
  return htmlLines.join('')
}

// Process inline markdown (bold, italic, code, links)
function processInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

// Convert HTML back to Markdown
function htmlToMarkdown(html: string): string {
  // Create a temporary element to parse HTML
  const div = document.createElement('div')
  div.innerHTML = html
  
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }
    
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map(processNode).join('')
    
    switch (tag) {
      case 'h1':
        return `# ${children}\n\n`
      case 'h2':
        return `## ${children}\n\n`
      case 'h3':
        return `### ${children}\n\n`
      case 'p':
        return children ? `${children}\n\n` : '\n'
      case 'strong':
      case 'b':
        return `**${children}**`
      case 'em':
      case 'i':
        return `*${children}*`
      case 'code':
        return `\`${children}\``
      case 'a':
        const href = el.getAttribute('href') || ''
        return `[${children}](${href})`
      case 'blockquote':
        return `> ${children.trim()}\n\n`
      case 'hr':
        return '---\n\n'
      case 'ul':
      case 'ol':
        return children + '\n'
      case 'li':
        return `- ${children.trim()}\n`
      case 'br':
        return '\n'
      default:
        return children
    }
  }
  
  let markdown = processNode(div)
  
  // Clean up extra newlines
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return markdown
}

export default function WysiwygEditor({ content, onChange, placeholder, onEditorReady }: WysiwygEditorProps) {
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
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none prose-headings:font-semibold prose-headings:text-white prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2 prose-p:text-white/70 prose-p:leading-relaxed prose-p:my-3 prose-strong:text-white prose-em:text-white/80 prose-ul:text-white/70 prose-ul:my-3 prose-ol:text-white/70 prose-ol:my-3 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:text-white/60 prose-blockquote:my-4 prose-hr:border-white/10 prose-hr:my-6',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)
    },
  })

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(content))
    }
  }, [content, editor])

  if (!editor) {
    return <div className="text-white/40">Loading editor...</div>
  }

  // Just return the editor content - page controls layout
  return <EditorContent editor={editor} />
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

// Exported toolbar component for use outside the editor
export function EditorToolbar({ editor }: { editor: Editor | null }) {
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

  if (!editor) return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
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
      
      <div className="w-px h-6 bg-white/10 mx-1" />
      
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
  )
}
