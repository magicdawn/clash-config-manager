export function firstLine(text) {
  return (text || '').split('\n')[0] || ''
}

export function limitLines(text = '', count = 100) {
  const lines = text.split('\n')

  if (lines.length <= count) {
    return text
  }

  return [...lines.slice(0, count), '......'].join('\n')
}
