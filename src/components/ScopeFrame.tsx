import { useEffect, useRef, useState } from "react";

// Escopos em HTML (versão de apresentação) gerados por scripts/build-escopos.py.
export const SCOPE_HTML_KEYS = new Set([
  "bpo",
  "cfo",
  "oxy",
  "assessoria",
  "coordenador",
  "estrategico",
  "tributario",
  "turnaround",
]);

const SITE_HEADER_OFFSET = 72;

/**
 * Embute o escopo com o layout original do HTML. O iframe cresce até a altura
 * do conteúdo (sem rolagem interna) e os links de seção rolam a página.
 */
export function ScopeFrame({ serviceKey, title }: { serviceKey: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;

    const setup = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      const fit = () => setHeight(doc.documentElement.scrollHeight);
      fit();
      observer?.disconnect();
      observer = new ResizeObserver(fit);
      observer.observe(doc.body);

      doc.addEventListener("click", (e) => {
        const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
        if (!link) return;
        const target = doc.querySelector(link.getAttribute("href") ?? "");
        if (!target) return;
        e.preventDefault();
        const top =
          frame.getBoundingClientRect().top +
          target.getBoundingClientRect().top +
          window.scrollY -
          SITE_HEADER_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
      });
    };

    frame.addEventListener("load", setup);
    if (frame.contentDocument?.readyState === "complete") setup();
    return () => {
      frame.removeEventListener("load", setup);
      observer?.disconnect();
    };
  }, [serviceKey]);

  return (
    <iframe
      ref={ref}
      src={`/escopos/${serviceKey}.html`}
      title={`Escopo do serviço: ${title}`}
      scrolling="no"
      className="block w-full rounded-2xl border border-border overflow-hidden"
      style={{ height }}
    />
  );
}
