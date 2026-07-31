/// <reference lib="webworker" />

import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";
import micropythonWasmUrl from "@micropython/micropython-webassembly-pyscript/micropython.wasm?url";

import { COURSE_PACKAGE_FILES } from "./course-python";
import { prepareProject } from "./project-validation";
import { SIMULATED_XRPLIB_FILES } from "./simulated-python";
import type {
  RuntimeWorkerMessage,
  RuntimeWorkerRequest,
} from "./worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

function post(message: RuntimeWorkerMessage): void {
  self.postMessage(message);
}

function createDirectories(
  fs: { mkdir(path: string): void },
  filePath: string,
  created: Set<string>,
): void {
  const parts = filePath.split("/").slice(0, -1);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    if (!created.has(current)) {
      fs.mkdir(current);
      created.add(current);
    }
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

self.onmessage = async (event: MessageEvent<RuntimeWorkerRequest>) => {
  try {
    let runtimeVersion = "unknown";
    const runtime = await loadMicroPython({
      heapsize: 2 * 1024 * 1024,
      url: micropythonWasmUrl,
      stdout: (line) => post({ type: "console", stream: "stdout", line }),
      stderr: (line) => post({ type: "console", stream: "stderr", line }),
    });
    runtime.registerJsModule("xrp_sim_bridge", {
      set_motor_effort(side: "left" | "right", effort: number) {
        post({ type: "effort", side, effort });
      },
      set_runtime_version(version: string) {
        runtimeVersion = String(version);
      },
    });

    const createdDirectories = new Set<string>(["/"]);
    const runtimeFiles = {
      ...SIMULATED_XRPLIB_FILES,
      ...COURSE_PACKAGE_FILES,
    };
    for (const [unsafePath, content] of Object.entries(runtimeFiles)) {
      const path = unsafePath;
      createDirectories(runtime.FS, path, createdDirectories);
      runtime.FS.writeFile(`/${path}`, content);
    }

    runtime.runPython(`
import xrp_sim_bridge
xrp_sim_bridge.set_runtime_version(
    ".".join(
        str(part)
        for part in __import__("sys").implementation.version[:3]
    )
)
`);
    post({ type: "runtime-ready", version: runtimeVersion });

    const project = prepareProject(event.data.project);
    const projectPaths = project.pythonPaths.map((path) => `/project/${path}`);
    runtime.FS.mkdir("/project");
    createdDirectories.add("/project");
    for (const [path, content] of project.files) {
      createDirectories(runtime.FS, `project/${path}`, createdDirectories);
      runtime.FS.writeFile(`/project/${path}`, content);
    }

    runtime.globals.set("__ucsb_check_paths", projectPaths);
    runtime.runPython(`
for __ucsb_path in __ucsb_check_paths:
    compile(open(__ucsb_path).read(), __ucsb_path, "exec")
`);
    runtime.globals.delete("__ucsb_check_paths");

    if (event.data.mode === "check") {
      post({
        type: "check-complete",
        detail: `${projectPaths.length} Python file${projectPaths.length === 1 ? "" : "s"} compiled with MicroPython ${runtimeVersion}`,
      });
      return;
    }

    const entrypoint = project.entrypoint;
    runtime.runPython(`
import sys
sys.path.insert(0, "/project")
__ucsb_entrypoint = "/project/${entrypoint}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`);
    post({ type: "run-complete" });
  } catch (error) {
    post({ type: "error", detail: errorDetail(error) });
  }
};

export {};
