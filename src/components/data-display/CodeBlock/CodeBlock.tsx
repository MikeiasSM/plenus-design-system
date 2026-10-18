import { useEffect, useState, type ComponentPropsWithRef } from 'react';
import { Button } from '../../actions/Button';
import styles from './CodeBlock.module.css';

const COPY_FEEDBACK_MS = 2000;

export interface CodeBlockProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  code: string;
  copyable?: boolean;
  fileName?: string;
  /** Linhas destacadas, contadas a partir de 1. */
  highlightedLines?: readonly number[];
  /** Como deve ser lido no cabecalho: `Java`, e nao `java`. */
  language?: string;
  lineNumbers?: boolean;
  wrap?: boolean;
}

export function CodeBlock({
  className,
  code,
  copyable = true,
  fileName,
  highlightedLines = [],
  language,
  lineNumbers = false,
  wrap = false,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  const highlighted = new Set(highlightedLines);
  const hasHeader = Boolean(fileName || language) || copyable;

  return (
    <div {...props} className={[styles.codeBlock, className].filter(Boolean).join(' ')}>
      {hasHeader && (
        <div className={styles.header}>
          <span className={styles.meta}>
            {fileName && <span className={styles.fileName}>{fileName}</span>}
            {language && <span className={styles.language}>{language}</span>}
          </span>
          {copyable && (
            <Button
              onClick={() => void navigator.clipboard?.writeText(code).then(() => setCopied(true))}
              size="sm"
              variant="ghost"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          )}
          <span className={styles.status} role="status">
            {copied ? 'Código copiado' : ''}
          </span>
        </div>
      )}
      {/* Sem quebra, a linha longa rola de lado, e quem usa teclado so a alcanca se o bloco receber foco. */}
      <pre
        className={[styles.body, wrap && styles.wrap, lineNumbers && styles.numbered].filter(Boolean).join(' ')}
        tabIndex={wrap ? undefined : 0}
      >
        <code className={styles.code}>
          {code.split('\n').map((line, index) => {
            const Line = highlighted.has(index + 1) ? 'mark' : 'span';

            return (
              <Line className={styles.line} key={index}>
                {line}
              </Line>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
