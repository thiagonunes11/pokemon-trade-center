import { toPng } from "html-to-image";

export async function downloadSetBinderPng(
  node: HTMLElement,
  fileName: string,
): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg")
      .trim() || "#F7F4EF",
  });

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
