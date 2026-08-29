import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";

import "./monaco-editor-features";
import { registerCoursePythonLanguage } from "./course-python-language";

type MonacoWorkerEnvironment = typeof globalThis & {
  MonacoEnvironment: {
    getWorker(moduleId: string, label: string): Worker;
  };
};

export function configureLocalMonaco() {
  (globalThis as MonacoWorkerEnvironment).MonacoEnvironment = {
    getWorker(_moduleId, label) {
      return label === "json" ? new JsonWorker() : new EditorWorker();
    },
  };
  loader.config({ monaco });
  registerCoursePythonLanguage(monaco);
}
