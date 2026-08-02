/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_TOC_CRM_ORIGIN?: string;
  readonly VITE_TOC_CRM_EMBED_REMOTE?: string;
  readonly VITE_TOC_CRM_GATE_PIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
