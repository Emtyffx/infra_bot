declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string | null;
    }
  }
}
export {};
