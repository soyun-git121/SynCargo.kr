import { cn } from "cn";

/**
 * Figma에서 내려받은 SVG 아이콘(public/figma)을 CSS mask로 그린다.
 * 파일은 그대로 두고 색은 currentColor(텍스트 색)를 따른다 → 활성/비활성 색 전환에 사용.
 */
export function FigmaIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const url = `url(/figma/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: size,
        height: size,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}
