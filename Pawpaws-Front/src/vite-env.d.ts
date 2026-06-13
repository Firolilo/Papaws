/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ANIMALES?: string;
  readonly VITE_API_CONSULTA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
