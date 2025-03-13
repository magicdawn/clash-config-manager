import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'

export function MarkdownView({
  className,
  children,
  ...restProps
}: ComponentProps<typeof Markdown> & { className?: string }) {
  return (
    <div className={className}>
      <Markdown
        {...restProps}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
      >
        {children}
      </Markdown>
    </div>
  )
}
