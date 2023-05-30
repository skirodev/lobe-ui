import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  inner,
  offset,
  shift,
  SideObject,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInnerOffset,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import { CSSProperties, memo, ReactNode, useEffect, useRef, useState } from 'react';
import useControlledState from 'use-merge-value';

import SelectItem from './SelectItem';
import { useStyles } from './style';

interface OptionType {
  icon?: ReactNode;
  label: ReactNode;
  value: string | number | null;
}
export interface NativeSelectProps {
  onChange?: (index: number) => void;
  options?: OptionType[];
  prefixCls?: string;
  renderItem?: (item: OptionType, index: number) => ReactNode;
  renderValue?: (index: number) => ReactNode;
  style?: CSSProperties;
  value?: number;
}

const NativeSelect = memo<NativeSelectProps>(
  ({ options = [], value, prefixCls, onChange, renderValue, renderItem, style }) => {
    const cls = prefixCls ?? 'native-select';
    const [selectedIndex, setSelectedIndex] = useControlledState<number>(0, { value, onChange });

    const { styles } = useStyles(cls);
    const listRef = useRef<Array<HTMLElement | null>>([]);
    const listContentRef = useRef<Array<string | null>>([]);
    const overflowRef = useRef<SideObject>(null);
    const allowSelectRef = useRef(false);
    const allowMouseUpRef = useRef(true);
    const selectTimeoutRef = useRef<any>();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [fallback, setFallback] = useState(false);
    const [innerOffset, setInnerOffset] = useState(0);
    const [touch, setTouch] = useState(false);
    const [blockSelection, setBlockSelection] = useState(false);

    if (!open) {
      if (innerOffset !== 0) setInnerOffset(0);
      if (fallback) setFallback(false);
      if (blockSelection) setBlockSelection(false);
    }

    const { x, y, strategy, refs, context } = useFloating({
      placement: 'bottom-start',
      open,
      onOpenChange: setOpen,
      whileElementsMounted: autoUpdate,
      middleware: fallback
        ? [
            offset(5),
            touch ? shift({ crossAxis: true, padding: 10 }) : flip({ padding: 10 }),
            size({
              apply({ availableHeight }) {
                Object.assign(scrollRef.current?.style ?? {}, {
                  maxHeight: `${availableHeight}px`,
                });
              },
              padding: 10,
            }),
          ]
        : [
            inner({
              listRef,
              overflowRef,
              scrollRef,
              index: selectedIndex,
              offset: innerOffset,
              onFallbackChange: setFallback,
              padding: 10,
              minItemsVisible: touch ? 8 : 4,
              referenceOverflowThreshold: 20,
            }),
            offset({ crossAxis: -4 }),
          ],
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
      useClick(context, { event: 'mousedown' }),
      useDismiss(context),
      useRole(context, { role: 'listbox' }),
      useInnerOffset(context, {
        enabled: !fallback,
        onChange: setInnerOffset,
        overflowRef,
        scrollRef,
      }),
      useListNavigation(context, {
        listRef,
        activeIndex,
        selectedIndex,
        onNavigate: setActiveIndex,
      }),
      useTypeahead(context, {
        listRef: listContentRef,
        activeIndex,
        onMatch: open ? setActiveIndex : setSelectedIndex,
      }),
    ]);

    useEffect(() => {
      if (open) {
        selectTimeoutRef.current = setTimeout(() => {
          allowSelectRef.current = true;
        }, 300);

        return () => {
          clearTimeout(selectTimeoutRef.current);
        };
      } else {
        allowSelectRef.current = false;
        allowMouseUpRef.current = true;
      }
    }, [open]);

    const { label } = options[selectedIndex] || {};

    return (
      <>
        <button
          aria-label={'selected-item'}
          className={styles.button}
          ref={refs.setReference}
          style={style}
          type={'button'}
          {...getReferenceProps({
            onTouchStart() {
              setTouch(true);
            },
            onPointerMove({ pointerType }) {
              if (pointerType === 'mouse') {
                setTouch(false);
              }
            },
          })}
        >
          {renderValue ? renderValue(selectedIndex) : label}
        </button>

        <FloatingPortal>
          {open && (
            <FloatingOverlay lockScroll={!touch} style={{ zIndex: 3000 }}>
              <FloatingFocusManager context={context} initialFocus={-1} modal={false}>
                <div
                  ref={refs.setFloating}
                  style={{
                    position: strategy,
                    top: y ?? 0,
                    left: x ?? 0,
                  }}
                >
                  <div
                    className={styles.container}
                    ref={scrollRef}
                    style={{ overflowY: 'auto' }}
                    {...getFloatingProps({
                      onContextMenu(e) {
                        e.preventDefault();
                      },
                    })}
                  >
                    {options.map((item, i) => {
                      return (
                        <SelectItem
                          disabled={blockSelection}
                          isActive={i === activeIndex}
                          isSelected={i === selectedIndex}
                          key={item.value}
                          label={renderItem ? renderItem(item, i) : item.label}
                          prefixCls={cls}
                          ref={(node) => {
                            listRef.current[i] = node;
                            listContentRef.current[i] = item.label as string;
                          }}
                          value={item.value}
                          {...getItemProps({
                            onTouchStart() {
                              allowSelectRef.current = true;
                              allowMouseUpRef.current = false;
                            },
                            onKeyDown() {
                              allowSelectRef.current = true;
                            },
                            onClick() {
                              if (allowSelectRef.current) {
                                setSelectedIndex(i);
                                setOpen(false);
                              }
                            },
                            onMouseUp() {
                              if (!allowMouseUpRef.current) {
                                return;
                              }

                              if (allowSelectRef.current) {
                                setSelectedIndex(i);
                                setOpen(false);
                              }

                              // On touch devices, prevent the element from
                              // immediately closing `onClick` by deferring it
                              clearTimeout(selectTimeoutRef.current);
                              selectTimeoutRef.current = setTimeout(() => {
                                allowSelectRef.current = true;
                              });
                            },
                          })}
                        />
                      );
                    })}
                  </div>
                </div>
              </FloatingFocusManager>
            </FloatingOverlay>
          )}
        </FloatingPortal>
      </>
    );
  },
);

export default NativeSelect;
