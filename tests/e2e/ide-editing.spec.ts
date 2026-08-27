import { expect, test, type Page } from "@playwright/test";

const recoveryKey = "ucsb-xrp-course-project-v2";

async function replaceVisibleEditorSource(page: Page, source: string) {
  const editor = page.getByRole("textbox", { name: "main.py editor" });
  await expect(page.getByTestId("python-editor")).toBeVisible();
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await page.keyboard.insertText(source);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = localStorage.getItem(key);
        return saved
          ? (JSON.parse(saved) as { files?: Record<string, string> }).files?.[
              "main.py"
            ]
          : undefined;
      }, recoveryKey),
    )
    .toBe(source);
}

test("edits, validates, runs, and recovers main.py through Monaco", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, source }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(
          key,
          JSON.stringify({
            name: "Editor regression",
            entrypoint: "main.py",
            files: {
              "main.py": source,
              "README.md": "# Editor regression\n",
            },
          }),
        );
      }
    },
    { key: recoveryKey, source: 'print("Original program output")\n' },
  );

  await page.goto("/ide/");
  await expect(page.getByRole("tab", { name: "main.py" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const invalidSource = "def broken:";
  await replaceVisibleEditorSource(page, invalidSource);
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByRole("log")).toContainText("Validation failed");
  await page.getByRole("tab", { name: "Status" }).click();
  await expect(page.getByTestId("check-result")).toContainText(/main\.py/i);
  await expect(page.getByTestId("check-result")).toContainText(
    /syntax|line\s*1/i,
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const editedSource = 'print("Edited source ran")';
  await replaceVisibleEditorSource(page, editedSource);
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByRole("log")).toContainText("Edited source ran");
  await expect(page.getByRole("log")).not.toContainText(
    "Original program output",
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await page.reload();
  await expect(page.getByRole("tab", { name: "main.py" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByTestId("python-editor").locator(".view-lines"),
  ).toContainText("Edited source ran");
});

test("Monitor Run executes an IDE edit without waiting for stale publication", async ({
  context,
  page: ide,
}) => {
  await ide.addInitScript(
    ({ key }) => {
      localStorage.clear();
      localStorage.setItem(
        key,
        JSON.stringify({
          name: "Immediate Monitor run",
          entrypoint: "main.py",
          files: { "main.py": 'print("old source")\n' },
        }),
      );

      // A former implementation published edits after 160 ms. Stretching that
      // exact delay makes this test fail if Run correctness ever depends on it.
      const originalSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((
        handler: TimerHandler,
        timeout: number = 0,
        ...arguments_: any[]
      ) =>
        originalSetTimeout(
          handler,
          timeout === 160 ? 10_000 : timeout,
          ...arguments_,
        )) as typeof window.setTimeout;
    },
    { key: recoveryKey },
  );
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const editor = ide.getByRole("textbox", { name: "main.py editor" });
  await editor.focus();
  await editor.press("ControlOrMeta+A");
  await ide.keyboard.insertText('print("exact current source")\n');
  const monitorRun = monitor
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toHaveAttribute(
    "title",
    /Validate and run the current IDE project/,
  );
  await monitorRun.click();

  await ide.getByRole("tab", { name: "Program output" }).click();
  await expect(ide.getByRole("log")).toContainText("exact current source");
  await expect(ide.getByRole("log")).not.toContainText("old source");
});

test("opens an oversized folder but prevents validation and virtual execution", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const files: Record<string, string> = { "main.py": "print('not run')\n" };
    for (let index = 0; index < 48; index += 1) {
      files[`notes_${index}.txt`] = "";
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        name: "Oversized folder",
        entrypoint: "main.py",
        files,
      }),
    );
  }, recoveryKey);

  await page.goto("/ide/");
  await expect(
    page.getByRole("button", { name: "Open notes_47.txt" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    "This project has 49 files",
  );
  await expect(page.getByTestId("check-result")).toContainText("at most 48");

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Validation failed");
  await expect(page.getByRole("log")).not.toContainText("not run");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});
