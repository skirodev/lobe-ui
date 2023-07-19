import { useScroll, useSize } from 'ahooks';
import { memo, useEffect, useRef } from 'react';

import { SyntaxHighlighter } from '@/Highlighter';

import { useStyles } from './style';

interface InputHighlightProps {
  target: string;
  value: string;
}

const InputHighlight = memo<InputHighlightProps>(({ value, target }) => {
  const ref: any = useRef(null);

  const { styles } = useStyles();

  const nativeTextarea = document.querySelector(`#${target}`);

  const size = useSize(nativeTextarea);
  const scroll = useScroll(nativeTextarea);

  useEffect(() => {
    ref.current.scroll(0, scroll?.top || 0);
  }, [scroll?.top]);

  return (
    <div
      className={styles.highlight}
      data-code-type="highlighter"
      ref={ref}
      style={{ height: size?.height, width: size?.width }}
    >
      <SyntaxHighlighter language="markdown">{value.trim()}</SyntaxHighlighter>
    </div>
  );
});

export default InputHighlight;
