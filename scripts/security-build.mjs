import { loadEnv } from "vite";

export function securityBuildPlugin() {
  let endpoint;
  return {
    name: "production-security-policy",
    apply: "build",
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, "VITE_");
      endpoint = new URL(env.VITE_ARTICLE_SUBMISSION_ENDPOINT || "https://design-daily-article-intake.rare-design-daily.workers.dev");
      if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) throw new Error("Production article intake must use HTTPS without credentials.");
    },
    transformIndexHtml: {
      order: "post",
      handler() {
        const policy = [
          "default-src 'self'",
          "script-src 'self' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data:",
          `connect-src 'self' ${endpoint.origin} https://challenges.cloudflare.com`,
          "frame-src https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join("; ");
        return [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: policy }, injectTo: "head-prepend" }];
      },
    },
  };
}
