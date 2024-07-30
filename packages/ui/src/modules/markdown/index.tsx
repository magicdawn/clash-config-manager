import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'

export function MarkdownView({ children, ...otherProps }: ComponentProps<typeof Markdown>) {
  return (
    <Markdown
      {...otherProps}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeExternalLinks, { target: '_blank' }]]}
    >
      {children}
    </Markdown>
  )
}
