// Minimal Cloudflare HTMLRewriter types for typecheck (the runtime provides the class).
interface HTMLRewriterElement {
  setAttribute(name: string, value: string): HTMLRewriterElement;
}

interface HTMLRewriterHandlers {
  element?(element: HTMLRewriterElement): void | Promise<void>;
}

declare class HTMLRewriter {
  on(selector: string, handlers: HTMLRewriterHandlers): HTMLRewriter;
  transform(response: Response): Response;
}
