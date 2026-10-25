export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={`lesson-code${className ? ` ${className}` : ''}`}>
      <code>{code}</code>
    </pre>
  )
}
