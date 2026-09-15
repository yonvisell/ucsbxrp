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
  const theme = getComputedStyle(document.documentElement);
  monaco.editor.defineTheme("ucsb-xrp", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editorGutter.background": theme
        .getPropertyValue("--panel-raised")
        .trim(),
      "editorLineNumber.foreground": theme.getPropertyValue("--quiet").trim(),
      "editorLineNumber.activeForeground": theme
        .getPropertyValue("--ink")
        .trim(),
    },
  });
  registerCoursePythonLanguage(monaco);
}
