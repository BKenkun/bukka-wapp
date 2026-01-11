interface CmsContentProps {
  content: string
}

export function CmsContent({ content }: CmsContentProps) {
  return (
    <div
      className="cms-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
