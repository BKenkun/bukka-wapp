"use client"

import * as React from "react"
import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconQuote,
  IconSeparator,
  IconLink,
  IconPhoto,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconCode,
  IconClearFormatting,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconSourceCode,
} from "@tabler/icons-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

function MenuButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "size-8 p-0",
        isActive && "bg-muted text-foreground"
      )}
    >
      {children}
    </Button>
  )
}

function MenuBar({
  editor,
  isHtmlMode,
  onToggleHtmlMode
}: {
  editor: Editor | null
  isHtmlMode: boolean
  onToggleHtmlMode: () => void
}) {
  const [linkUrl, setLinkUrl] = React.useState("")
  const [imageUrl, setImageUrl] = React.useState("")

  if (!editor) return null

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run()
      setLinkUrl("")
    }
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl("")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-2 bg-muted/30">
      {/* History */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={isHtmlMode || !editor.can().undo()}
        title="Deshacer"
      >
        <IconArrowBackUp className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={isHtmlMode || !editor.can().redo()}
        title="Rehacer"
      >
        <IconArrowForwardUp className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={!isHtmlMode && editor.isActive("bold")}
        disabled={isHtmlMode}
        title="Negrita"
      >
        <IconBold className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={!isHtmlMode && editor.isActive("italic")}
        disabled={isHtmlMode}
        title="Cursiva"
      >
        <IconItalic className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={!isHtmlMode && editor.isActive("underline")}
        disabled={isHtmlMode}
        title="Subrayado"
      >
        <IconUnderline className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={!isHtmlMode && editor.isActive("strike")}
        disabled={isHtmlMode}
        title="Tachado"
      >
        <IconStrikethrough className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={!isHtmlMode && editor.isActive("code")}
        disabled={isHtmlMode}
        title="Código"
      >
        <IconCode className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={!isHtmlMode && editor.isActive("heading", { level: 1 })}
        disabled={isHtmlMode}
        title="Título 1"
      >
        <IconH1 className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={!isHtmlMode && editor.isActive("heading", { level: 2 })}
        disabled={isHtmlMode}
        title="Título 2"
      >
        <IconH2 className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={!isHtmlMode && editor.isActive("heading", { level: 3 })}
        disabled={isHtmlMode}
        title="Título 3"
      >
        <IconH3 className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={!isHtmlMode && editor.isActive({ textAlign: "left" })}
        disabled={isHtmlMode}
        title="Alinear izquierda"
      >
        <IconAlignLeft className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={!isHtmlMode && editor.isActive({ textAlign: "center" })}
        disabled={isHtmlMode}
        title="Centrar"
      >
        <IconAlignCenter className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={!isHtmlMode && editor.isActive({ textAlign: "right" })}
        disabled={isHtmlMode}
        title="Alinear derecha"
      >
        <IconAlignRight className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={!isHtmlMode && editor.isActive("bulletList")}
        disabled={isHtmlMode}
        title="Lista con viñetas"
      >
        <IconList className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={!isHtmlMode && editor.isActive("orderedList")}
        disabled={isHtmlMode}
        title="Lista numerada"
      >
        <IconListNumbers className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={!isHtmlMode && editor.isActive("blockquote")}
        disabled={isHtmlMode}
        title="Cita"
      >
        <IconQuote className="size-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={isHtmlMode}
        title="Línea horizontal"
      >
        <IconSeparator className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isHtmlMode}
            className={cn(
              "size-8 p-0",
              !isHtmlMode && editor.isActive("link") && "bg-muted text-foreground"
            )}
            title="Enlace"
          >
            <IconLink className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <Button type="button" size="sm" onClick={addLink}>
              Añadir
            </Button>
          </div>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              Quitar enlace
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isHtmlMode}
            className="size-8 p-0"
            title="Imagen"
          >
            <IconPhoto className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="URL de la imagen..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <Button type="button" size="sm" onClick={addImage}>
              Añadir
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Clear formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Limpiar formato"
        disabled={isHtmlMode}
      >
        <IconClearFormatting className="size-4" />
      </MenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* HTML Source */}
      <MenuButton
        onClick={onToggleHtmlMode}
        isActive={isHtmlMode}
        title={isHtmlMode ? "Vista visual" : "Editar HTML"}
      >
        <IconSourceCode className="size-4" />
      </MenuButton>
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escribe aquí...",
  className,
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = React.useState(false)
  const [htmlContent, setHtmlContent] = React.useState(content)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setHtmlContent(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  })

  const handleToggleHtmlMode = () => {
    if (isHtmlMode && editor) {
      // Switching from HTML to visual mode - update editor with HTML content
      editor.commands.setContent(htmlContent)
    } else if (editor) {
      // Switching to HTML mode - update HTML content from editor
      setHtmlContent(editor.getHTML())
    }
    setIsHtmlMode(!isHtmlMode)
  }

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value
    setHtmlContent(newHtml)
    onChange(newHtml)
  }

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <MenuBar
        editor={editor}
        isHtmlMode={isHtmlMode}
        onToggleHtmlMode={handleToggleHtmlMode}
      />
      {isHtmlMode ? (
        <Textarea
          value={htmlContent}
          onChange={handleHtmlChange}
          placeholder="<p>Escribe HTML aquí...</p>"
          className="min-h-[300px] font-mono text-sm rounded-none border-0 focus-visible:ring-0 resize-y"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
