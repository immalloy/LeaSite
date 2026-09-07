"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { CustomScrollbar } from "./CustomScrollbar";

gsap.registerPlugin(Observer);

type LevelData = {
  title: string;
  description: string;
  image: string;
  imageSide: "left" | "right";
  imageScale: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
};

const LEVELS: LevelData[] = [
  {
    title: "PLACEHOLDER TITLE",
    description: "This is placeholder copy. Final text will be added later.",
    image: "/character-placeholder.png",
    imageSide: "right",
    imageScale: 1,
  },
  {
    title: "PLACEHOLDER TITLE",
    description: "This is placeholder copy. Final text will be added later.",
    image: "/character-placeholder.png",
    imageSide: "left",
    imageScale: 0.88,
    imageOffsetY: -8,
  },
  {
    title: "PLACEHOLDER TITLE",
    description: "This is placeholder copy. Final text will be added later.",
    image: "/character-placeholder.png",
    imageSide: "right",
    imageScale: 0.92,
    imageOffsetX: -12,
  },
];

export function LevelScroller() {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const levelSurfaceRef = useRef<HTMLDivElement>(null);
  const levelRefs = useRef<Array<HTMLElement | null>>([]);
  const viewportRef = useRef<HTMLElement | null>(null);
  const currentLevelRef = useRef(0);
  const transitionRef = useRef<gsap.core.Timeline | null>(null);
  const edgeNudgeRef = useRef(false);
  const transitioningRef = useRef(false);
  const gestureArmedRef = useRef(true);
  const [ready, setReady] = useState(false);

  const onScrollbarReady = useCallback((viewport: HTMLElement) => {
    viewportRef.current = viewport;
    setReady(true);
  }, []);

  const goToLevel = useCallback((nextLevel: number, force = false) => {
    const viewport = viewportRef.current;
    const surface = levelSurfaceRef.current;
    if (!viewport || !surface || transitioningRef.current || (!force && !gestureArmedRef.current)) return;
    if (nextLevel < 0 || nextLevel >= LEVELS.length) {
      if (edgeNudgeRef.current) return;
      edgeNudgeRef.current = true;
      const direction = nextLevel < 0 ? 1 : -1;
      gsap.timeline({
        onComplete: () => {
          edgeNudgeRef.current = false;
        },
      })
        .to(surface, { y: direction * 16, duration: 0.22, ease: "power2.out", overwrite: "auto" })
        .to(surface, { y: 0, duration: 0.38, ease: "power3.out", overwrite: "auto" });
      return;
    }
    const target = levelRefs.current[nextLevel];
    if (!target || nextLevel === currentLevelRef.current) return;

    gestureArmedRef.current = false;
    transitioningRef.current = true;
    const previousLevel = currentLevelRef.current;
    currentLevelRef.current = nextLevel;
    transitionRef.current?.kill();
    edgeNudgeRef.current = false;
    gsap.killTweensOf(surface);
    gsap.set(surface, { y: 0 });
    transitionRef.current = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        transitioningRef.current = false;
        transitionRef.current = null;
        if (force) gestureArmedRef.current = true;
      },
    });
    transitionRef.current.to(viewport, {
      scrollTop: target.offsetTop,
      duration: 0.9,
      ease: "power3.inOut",
    }, 0);
    const direction = nextLevel > previousLevel ? -1 : 1;
    const atEdge = nextLevel === 0 || nextLevel === LEVELS.length - 1;
    const edgeDirection = nextLevel === 0 ? 1 : -1;
    transitionRef.current
      .to(surface, { y: direction * 8, duration: 0.72, ease: "power3.out" }, 0)
      .to(surface, {
        y: atEdge ? edgeDirection * 16 : 0,
        duration: atEdge ? 0.12 : 0.18,
        ease: "power2.out",
      }, 0.72)
      .to(surface, { y: 0, duration: atEdge ? 0.36 : 0.18, ease: "power3.out" }, atEdge ? 0.84 : 0.72);
  }, []);

  const settleToNearestLevel = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || transitioningRef.current) return;
    const nearestLevel = levelRefs.current.reduce((closest, level, index) => {
      if (!level) return closest;
      const closestDistance = Math.abs((levelRefs.current[closest]?.offsetTop ?? 0) - viewport.scrollTop);
      const levelDistance = Math.abs(level.offsetTop - viewport.scrollTop);
      return levelDistance < closestDistance ? index : closest;
    }, 0);
    if (nearestLevel === currentLevelRef.current) {
      gsap.to(viewport, { scrollTop: levelRefs.current[nearestLevel]?.offsetTop ?? 0, duration: 0.52, ease: "power3.out", overwrite: "auto" });
      gestureArmedRef.current = true;
    } else {
      goToLevel(nearestLevel, true);
    }
  }, [goToLevel]);

  useEffect(() => {
    if (!ready || !viewportRef.current || !levelSurfaceRef.current) return;
    const viewport = viewportRef.current;
    let resizeFrame = 0;
    const observer = Observer.create({
      target: viewport,
      type: "wheel,touch",
      tolerance: 24,
      preventDefault: true,
      onUp: () => goToLevel(currentLevelRef.current - 1),
      onDown: () => goToLevel(currentLevelRef.current + 1),
      onStop: () => {
        gestureArmedRef.current = true;
      },
    });
    const onKeyDown = (event: KeyboardEvent) => {
      const nextLevel = event.key === "ArrowDown" || event.key === "PageDown"
        ? currentLevelRef.current + 1
        : event.key === "ArrowUp" || event.key === "PageUp"
          ? currentLevelRef.current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? LEVELS.length - 1
              : null;
      if (nextLevel === null) return;
      event.preventDefault();
      goToLevel(nextLevel, true);
    };
    const onResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        const level = levelRefs.current[currentLevelRef.current];
        if (level && !transitioningRef.current) viewport.scrollTop = level.offsetTop;
      });
    };

    viewport.tabIndex = 0;
    viewport.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      observer.kill();
      window.cancelAnimationFrame(resizeFrame);
      viewport.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      transitionRef.current?.kill();
      if (levelSurfaceRef.current) gsap.set(levelSurfaceRef.current, { y: 0 });
    };
  }, [goToLevel, ready]);

  return (
    <main ref={scrollRootRef} className="level-scroll-root">
      <div ref={levelSurfaceRef} className="level-scroll-surface">
        {LEVELS.map((level, index) => (
          <section
            key={`${level.title}-${index}`}
            ref={(element) => {
              levelRefs.current[index] = element;
            }}
            className={`level level--image-${level.imageSide}`}
            aria-label={`Level ${index + 1}`}
          >
            <div className="level__inner">
              <div className="level__copy">
                <h1>{level.title}</h1>
                <p>{level.description}</p>
              </div>
              <div className="level__visual">
                <div
                  className="character"
                  style={{
                    "--character-scale": level.imageScale,
                    "--character-offset-x": `${level.imageOffsetX ?? 0}px`,
                    "--character-offset-y": `${level.imageOffsetY ?? 0}px`,
                  } as CSSProperties}
                >
                  <img className="character__image" src={level.image} alt="Character placeholder" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
      <CustomScrollbar targetRef={scrollRootRef} onReady={onScrollbarReady} onDragEnd={settleToNearestLevel} />
    </main>
  );
}
