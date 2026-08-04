import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const sourceExtensions = new Set([".ts", ".tsx"]);
const lowContrastText = /text-(?:muted-foreground\/\d+|foreground\/(?:[0-5]\d|60))(?!\d)/g;

type Rgb = [number, number, number];

function readHslToken(block: string, token: string): Rgb {
  const match = block.match(new RegExp(`--${token}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
  if (!match) throw new Error(`Token --${token} não encontrado`);
  const [hue, saturation, lightness] = match.slice(1).map(Number);
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [red, green, blue] = hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
      : hue < 180 ? [0, chroma, x]
        : hue < 240 ? [0, x, chroma]
          : hue < 300 ? [x, 0, chroma]
            : [chroma, 0, x];
  return [red + m, green + m, blue + m];
}

function relativeLuminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    if (!sourceExtensions.has(extname(entry.name)) || entry.name === "contrastPolicy.test.ts") return [];
    return [path];
  });
}

describe("política de contraste visual", () => {
  it("mantém texto principal e secundário com contraste AA nos dois temas", () => {
    const css = readFileSync(join(sourceRoot, "index.css"), "utf8");
    const themes = [css.match(/:root\s*\{([\s\S]*?)\n\s*\}/)?.[1], css.match(/\.dark\s*\{([\s\S]*?)\n\s*\}/)?.[1]];

    for (const theme of themes) {
      expect(theme).toBeTruthy();
      const background = readHslToken(theme!, "background");
      expect(contrastRatio(readHslToken(theme!, "foreground"), background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(readHslToken(theme!, "muted-foreground"), background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("não reduz novamente a opacidade de textos e ícones semânticos", () => {
    const violations = collectSourceFiles(sourceRoot).flatMap((path) => {
      const matches = readFileSync(path, "utf8").match(lowContrastText) ?? [];
      return matches.map((className) => `${path.replace(sourceRoot, "src")}: ${className}`);
    });

    expect(violations).toEqual([]);
  });
});
