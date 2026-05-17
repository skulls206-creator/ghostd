/// <reference types="vite/client" />

  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_BASE?: string;
    readonly VITE_BUILD_SHA?: string;
    readonly VITE_BUILD_TIME?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  