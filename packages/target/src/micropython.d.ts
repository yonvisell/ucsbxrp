declare module "@micropython/micropython-webassembly-pyscript" {
  export interface MicroPythonFileSystem {
    mkdir(path: string): void;
    writeFile(path: string, data: string): void;
  }

  export interface MicroPythonRuntime {
    FS: MicroPythonFileSystem;
    globals: {
      set(key: string, value: unknown): void;
      delete(key: string): void;
    };
    registerJsModule(name: string, module: object): void;
    runPython(code: string): unknown;
  }

  export function loadMicroPython(options?: {
    heapsize?: number;
    url?: string;
    stdout?: (line: string) => void;
    stderr?: (line: string) => void;
  }): Promise<MicroPythonRuntime>;
}

declare module "*micropython.wasm?url" {
  const url: string;
  export default url;
}
