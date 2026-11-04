/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default admin PIN (basic access barrier only – NOT secure). */
  readonly VITE_ADMIN_PIN?: string;
  /** Deployment base path, e.g. "/solluz-synergy/" for GitHub Pages project sites. */
  readonly VITE_BASE?: string;
  /** "hash" to use hash-based routing on hosts without SPA rewrites. */
  readonly VITE_ROUTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
