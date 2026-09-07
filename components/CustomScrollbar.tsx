"use client";

import { useEffect, type RefObject } from "react";
import { OverlayScrollbars } from "overlayscrollbars";

type CustomScrollbarProps = {
  targetRef: RefObject<HTMLElement | null>;
  onReady?: (viewport: HTMLElement) => void;
  onDragEnd?: () => void;
};

export function CustomScrollbar({ targetRef, onReady, onDragEnd }: CustomScrollbarProps) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const instance = OverlayScrollbars(target, {
      scrollbars: {
        theme: "squishy-scrollbar",
        visibility: "visible",
        autoHide: "never",
        dragScroll: true,
        clickScroll: "instant",
        pointers: ["mouse", "touch", "pen"],
      },
    });
    const viewport = instance.elements().viewport;
    const scrollbar = instance.elements().scrollbarVertical.scrollbar;

    onReady?.(viewport);

    let previousScrollTop = viewport.scrollTop;
    let pickerStopTimer = 0;
    let pickerNudgeFrame = 0;
    let dragging = false;

    const activatePicker = () => {
      scrollbar.classList.add("picker-is-active");
      window.clearTimeout(pickerStopTimer);
    };
    const deactivatePicker = () => {
      window.clearTimeout(pickerStopTimer);
      pickerStopTimer = window.setTimeout(() => scrollbar.classList.remove("picker-is-active"), 520);
    };

    const press = (event: PointerEvent) => {
      dragging = event.target instanceof Element && Boolean(event.target.closest(".os-scrollbar-handle"));
      activatePicker();
    };

    const release = () => {
      const wasDragging = dragging;
      dragging = false;
      deactivatePicker();
      if (wasDragging) onDragEnd?.();
    };

    const onScroll = () => {
      const delta = viewport.scrollTop - previousScrollTop;
      previousScrollTop = viewport.scrollTop;
      if (delta !== 0) {
        scrollbar.style.setProperty("--picker-nudge-y", `${Math.sign(delta) * 12}px`);
        window.cancelAnimationFrame(pickerNudgeFrame);
        pickerNudgeFrame = window.requestAnimationFrame(() => {
          scrollbar.style.setProperty("--picker-nudge-y", "0px");
        });
        activatePicker();
        window.clearTimeout(pickerStopTimer);
        pickerStopTimer = window.setTimeout(() => scrollbar.classList.remove("picker-is-active"), 520);
      }
    };
    const removeScrollListener = instance.on("scroll", onScroll);

    scrollbar.addEventListener("pointerdown", press, true);
    document.addEventListener("pointerup", release, true);
    document.addEventListener("pointercancel", release, true);
    window.addEventListener("blur", release);

    return () => {
      window.clearTimeout(pickerStopTimer);
      window.cancelAnimationFrame(pickerNudgeFrame);
      scrollbar.removeEventListener("pointerdown", press, true);
      document.removeEventListener("pointerup", release, true);
      document.removeEventListener("pointercancel", release, true);
      window.removeEventListener("blur", release);
      removeScrollListener();
      scrollbar.style.removeProperty("--picker-nudge-y");
      scrollbar.classList.remove("picker-is-active");
      instance.destroy();
    };
  }, [onDragEnd, onReady, targetRef]);

  return null;
}
