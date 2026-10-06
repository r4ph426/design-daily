import { useEffect, useRef } from 'react';
import './design-cursor.css';

// One pointer across all routes. Image inspection retains its action and drag cursors.
export function DesignCursor() {
  const dot = useRef();
  useEffect(() => {
    const node = dot.current, root = document.body;
    const hasPopover = typeof node.showPopover === 'function';
    const media = matchMedia('(hover:hover) and (pointer:fine)');
    let pointer = null;
    function hide() {
      root.classList.remove('has-design-dot-cursor');
      node.classList.remove('is-visible', 'is-over-reference');
      if (hasPopover && node.matches(':popover-open')) node.hidePopover();
    }
    function leave() { pointer = null; hide(); }
    function paint() {
      if (!media.matches || !pointer || document.hidden) { hide(); return; }
      const target = document.elementFromPoint(pointer.x, pointer.y);
      if (!target || target.closest('input,textarea,select,[contenteditable]:not([contenteditable=false]),.image-focus-stage,.is-dragging,[data-native-cursor],button:disabled,[aria-disabled=true]')) { hide(); return; }
      node.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
      node.classList.toggle('is-over-reference', !!target.closest('a,button,[role=button],.weekly-reference,.weekly-visual'));
      if (hasPopover && !node.matches(':popover-open')) node.showPopover();
      node.classList.add('is-visible');
      root.classList.add('has-design-dot-cursor');
    }
    function move(event) {
      if (event.pointerType !== 'mouse' || event.buttons) { leave(); return; }
      pointer = { x: event.clientX, y: event.clientY }; paint();
    }
    const observer = new MutationObserver(() => { if (pointer) paint(); });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', leave, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('keydown', leave);
    document.addEventListener('visibilitychange', leave);
    window.addEventListener('scroll', paint, { capture: true, passive: true });
    window.addEventListener('blur', leave);
    window.addEventListener('hashchange', leave);
    media.addEventListener('change', leave);
    return () => {
      leave(); observer.disconnect();
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerdown', leave);
      document.removeEventListener('pointerleave', leave); document.removeEventListener('keydown', leave);
      document.removeEventListener('visibilitychange', leave); window.removeEventListener('scroll', paint, true);
      window.removeEventListener('blur', leave); window.removeEventListener('hashchange', leave);
      media.removeEventListener('change', leave);
    };
  }, []);
  return <div ref={dot} className="design-dot-cursor" popover="manual" aria-hidden="true"><span /></div>;
}
