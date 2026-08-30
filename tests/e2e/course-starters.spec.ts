import { expect, test, type Page } from "@playwright/test";

import {
  readWorkspaceManifest,
  seedWorkingFolder,
  type TestProject,
} from "./working-folder";

const starters = [
  { option: "challenge_2", completion: "Challenge 2 complete" },
  { option: "challenge_3", completion: "Challenge 3 complete" },
  { option: "challenge_4", completion: "Challenge 4 complete" },
  { option: "challenge_5", completion: "Challenge 5 result: delivered" },
];

async function createTemplateProject(page: Page, templateId: string) {
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption(templateId);
  await expect(
    page.getByRole("heading", { name: "New project" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("heading", { name: "New project" })).toHaveCount(
    0,
  );
}

test("opens the spiral demo by default in a new browser", async ({ page }) => {
  await page.goto("/ide/");

  await expect(
    page.getByRole("button", { name: "New project…", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText("Not selected");
  await expect(page.getByTestId("project-save-state")).toHaveText(
    "Working folder required",
  );
  await expect(
    page.getByRole("button", { name: "Open main.py (main file)" }),
  ).toBeVisible();
});

test("reveals complete challenge demonstrations only when requested on Home", async ({
  page,
}) => {
  await page.goto("/");
  const completeChallenges = page.getByLabel("complete challenges");
  await expect(completeChallenges).not.toBeChecked();

  await page.goto("/ide/");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await expect(
    page.locator('option[value="complete_challenge_1"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  await page.goto("/");
  await page.getByLabel("complete challenges").check();
  await page.goto("/ide/");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await expect(
    page.locator('optgroup[label="Complete challenge demonstrations"]'),
  ).toHaveCount(1);
  await page
    .getByLabel("Project template")
    .selectOption("complete_challenge_1");
  await expect(page.locator(".template-guidance")).toContainText(
    "uses a reference-only",
  );
  await expect(page.locator(".template-guidance")).toContainText(
    "Student component files and component checks are intentionally absent",
  );
});

test("imports every generated complete challenge without student files", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seedWorkingFolder(page, { folderName: "Complete-Challenge-Smoke" });
  await page.goto("/");
  await page.getByLabel("complete challenges").check();
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const requiredCourseSetupNames = [
    ["make_robot"],
    ["make_robot"],
    ["make_navigation_controller", "make_robot"],
    ["make_grid_planner", "make_navigation_controller", "make_robot"],
    ["make_grid_planner", "make_navigation_controller", "make_robot"],
    ["make_range_safety_controller", "make_robot"],
    ["make_navigation_controller", "make_pose_corrector", "make_robot"],
    [
      "make_navigation_controller",
      "make_robot",
      "make_route_cost_grid_planner",
      "make_visit_order_planner",
    ],
    ["make_line_follower", "make_robot"],
  ] as const;

  for (let number = 1; number <= 9; number += 1) {
    await createTemplateProject(page, `complete_challenge_${number}`);
    await expect(
      page.getByRole("button", { name: "Test components" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Open main.py (main file)" })
      .click();
    const editor = page.locator(".monaco-editor").first();
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    const importedNames = requiredCourseSetupNames[number - 1]!;
    await page.keyboard.insertText(
      `from course_setup import ${importedNames.join(", ")}\nprint("complete ${number} imports")\n`,
    );
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByTestId("check-result")).toContainText(
      "compiled successfully",
    );
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("log")).toContainText(
      `complete ${number} imports`,
    );
    await expect(page.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
  }
});

test("creates the selected Project when its Working folder is chosen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory();
        try {
          await root.removeEntry("Fresh-New-Project", { recursive: true });
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NotFoundError"
          ) {
            throw error;
          }
        }
        return root.getDirectoryHandle("Fresh-New-Project", { create: true });
      },
    });
  });
  await page.goto("/ide/");

  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  await page
    .getByRole("button", { name: "Choose Working folder and create" })
    .click();

  await expect(page.getByRole("heading", { name: "New project" })).toHaveCount(
    0,
  );
  await expect(page.getByTestId("project-name")).toHaveText("Expanding spiral");
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-spiral",
  );
  await expect
    .poll(() => readWorkspaceManifest(page, "Fresh-New-Project"))
    .toMatchObject({ activeProject: "Expanding-spiral" });
});

test("opens a newly created tutorial on the Virtual XRP", async ({ page }) => {
  await seedWorkingFolder(page, {
    folderName: "Tutorial-Target-Test",
    robot: {
      id: "tutorial-test-xrp",
      name: "ucsb-xrp-tutorial-test",
      networkMode: "station",
      ssid: "COURSE-NETWORK",
      address: "127.0.0.1:9",
    },
    target: "physical",
  });
  await page.goto("/ide/");
  await expect(page.getByLabel("Run on")).toHaveValue("physical");

  await createTemplateProject(page, "micropython_tutorial");

  await expect(page.getByLabel("Run on")).toHaveValue("virtual");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect
    .poll(() =>
      readWorkspaceManifest<{ settings?: { target?: string } }>(
        page,
        "Tutorial-Target-Test",
      ),
    )
    .toMatchObject({ settings: { target: "virtual" } });
});

test("renders project README files and keeps their Markdown editable", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Readme-Rendering-Test" });
  await page.goto("/ide/");
  await createTemplateProject(page, "challenge_4");

  const preview = page.getByLabel("Rendered Markdown preview");
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "Challenge 4: Mapped Route" }),
  ).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "How the program runs" }),
  ).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "The challenge", exact: true }),
  ).toBeVisible();
  await expect(preview.locator("pre")).toHaveCount(1);
  await expect(preview.getByText(/Implement GridPlanner/)).toBeVisible();
  const typography = await preview.evaluate((element) => {
    const inlineCode = element.querySelector("code");
    return {
      body: getComputedStyle(element).fontSize,
      code: inlineCode ? getComputedStyle(inlineCode).fontSize : null,
    };
  });
  expect(typography).toEqual({ body: "12px", code: "11px" });
  await expect(preview.getByText("## Objective", { exact: true })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".monaco-editor")).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(preview).toBeVisible();
});

test("keeps the former dashboard address as a Monitor redirect", async ({
  page,
}) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/\/monitor\/$/);
  await expect(page).toHaveTitle("UCSBXRP Monitor");
});

test("runs the default project directly from a fresh Monitor", async ({
  context,
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Fresh-Monitor-Test" });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const run = page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(run).toBeEnabled();
  await expect(run).toHaveAttribute("title", /Expanding spiral/);
  await run.click();

  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const ide = await context.newPage();
  await ide.goto("/ide/");
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Starting Expanding spiral (main.py) on the virtual XRP",
  );
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

test("holds Virtual Run during the first isolated production refresh", async ({
  context,
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Isolation-Hold-Test" });
  await context.addInitScript(() => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: false,
    });
  });

  await page.goto("/monitor/");
  const monitorRun = page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(monitorRun).toBeDisabled();
  await expect(monitorRun).toHaveAttribute(
    "title",
    /preparing the Virtual XRP.*refreshes once automatically/i,
  );

  const ide = await context.newPage();
  await ide.goto("/ide/");
  const ideRun = ide
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true });
  await expect(ideRun).toBeDisabled();
  await expect(ideRun).toHaveAttribute(
    "title",
    /preparing the Virtual XRP.*refreshes once automatically/i,
  );
});

test("runs with declared live defaults if isolation disappears", async ({
  context,
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Isolation-Disappear-Test" });
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect
    .poll(() => page.locator("html").getAttribute("data-offline-shell-state"))
    .toMatch(/^(ready|development)$/);
  await page.evaluate(() => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: false,
    });
  });

  await page
    .locator(".app-header")
    .getByRole("button", { name: "Run", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await expect(page.getByText("Forward speed", { exact: true })).toBeVisible();
  await page.waitForTimeout(1_000);
  const ide = await context.newPage();
  await ide.goto("/ide/");
  await ide.getByRole("tab", { name: /System log/ }).click();
  await expect(ide.getByRole("log")).not.toContainText("MicroPython exception");
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(ide.getByRole("log")).toContainText(
    "Run stopped; drive command set to zero",
  );
});

test("Run reports a compilation error before starting invalid code", async ({
  page,
}) => {
  const invalidProject: TestProject = {
    name: "Invalid project",
    entrypoint: "main.py",
    files: { "main.py": "def broken(:\n    pass\n" },
  };
  await seedWorkingFolder(page, {
    folderName: "Invalid-Project-Test",
    project: invalidProject,
    projectFolderName: "Invalid-Project",
  });
  await page.goto("/ide/");

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Problems (1)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("button", {
      name: /main\.py · line 1.*Syntax error/i,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Compiler output" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    'File "/project/main.py", line 1',
  );
  await expect(page.getByRole("tabpanel")).toContainText("<stdin>");
  await page.getByRole("tab", { name: "Status" }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    "1 problem found",
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

test("runs hardware-free student component checks without changing the target", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Component-Checks-Test" });
  await page.goto("/ide/");
  await createTemplateProject(page, "challenge_1");

  await expect(
    page.getByRole("button", { name: "Open README.md" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test components" }).click();
  await expect(page.getByRole("log")).toContainText(
    "INPUT · two wheel geometries and encoder-sign conventions",
  );
  await expect(page.getByRole("log")).toContainText(
    "EXPECT · device timestamps set dt",
  );
  await expect(page.getByRole("log")).toContainText(
    "NOT IMPLEMENTED · SensorModel",
  );
  await expect(page.getByRole("log")).toContainText(
    "NOT IMPLEMENTED · WheelSpeedController",
  );
  await expect(page.getByRole("log")).toContainText(
    "0 passed · 2 not implemented · 0 failed",
  );
  await expect(page.getByRole("log")).toContainText(
    "Component checks finished · implement the listed methods, then test again.",
  );
  await expect(page.getByRole("log")).not.toContainText("Traceback");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

test("previews and preserves student files when starting another challenge", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Challenge-Transition-Test" });
  await page.goto("/ide/");
  await createTemplateProject(page, "challenge_1");
  for (const path of ["helpers.py", "notes.txt"]) {
    await page.getByRole("button", { name: "New file…", exact: true }).click();
    await page.getByLabel("Project-relative path").fill(path);
    await page.getByRole("button", { name: "Create file" }).click();
  }

  await page.getByRole("button", { name: "Start another challenge…" }).click();
  await expect(
    page.getByRole("heading", { name: "Start another challenge" }),
  ).toBeVisible();
  await page
    .getByLabel("Challenge", { exact: true })
    .selectOption("challenge_2");
  const preview = page.getByRole("group", {
    name: "Challenge project file changes",
  });
  await expect(preview).toContainText("Preserve");
  await expect(preview).toContainText("helpers.py");
  await expect(preview).toContainText("notes.txt");
  await expect(preview).toContainText("Merge robot calibration");
  await expect(preview).toContainText("robot_config.py");
  await expect(preview).toContainText("Replace for the new task");
  await expect(preview).toContainText("main.py");
  await expect(preview).toContainText("Add");
  await expect(preview).toContainText("differential_drive.py");

  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByTestId("project-name")).toHaveText(
    "2 · Turn and Return",
  );
  await expect(
    page.getByRole("button", { name: "Open helpers.py" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open notes.txt" }),
  ).toBeVisible();
});

test("challenge_9 follows the visible circuit for one virtual lap", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await seedWorkingFolder(page, { folderName: "Starter-challenge_9" });
  await page.goto("/ide/");
  await createTemplateProject(page, "challenge_9");

  await page.getByRole("button", { name: "Compile" }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    "compiled successfully",
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Challenge 9 complete: one circuit with the line retained",
    { timeout: 50_000 },
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  expect(errors).toEqual([]);
});

for (const starter of starters) {
  test(`${starter.option} compiles and completes on the virtual XRP`, async ({
    page,
  }) => {
    test.setTimeout(50_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await seedWorkingFolder(page, {
      folderName: `Starter-${starter.option}`,
    });
    await page.goto("/ide/");
    await expect(page.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await createTemplateProject(page, starter.option);
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(page.getByTestId("check-result")).toContainText(
      "compiled successfully",
    );
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("log")).toContainText(starter.completion, {
      timeout: 40_000,
    });
    if (starter.option === "challenge_2") {
      const output = await page.getByRole("log").textContent();
      const finalPose = output?.match(
        /final_pose: Pose\(x_mm=[^,]+, y_mm=[^,]+, heading_rad=([^)]+)\)/,
      );
      expect(
        finalPose,
        "Challenge 2 should report its final pose",
      ).not.toBeNull();
      expect(Math.abs(Number(finalPose?.[1]))).toBeLessThanOrEqual(0.08);
    }
    await expect(page.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    expect(errors).toEqual([]);
  });
}

test("keeps the IDE project workspace flat, compact, and free of clipped controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1382, height: 752 });
  await seedWorkingFolder(page, { folderName: "IDE-Layout-Test" });
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  const layout = await page.evaluate(() => {
    const dimensions = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        throw new Error(`Missing ${selector}`);
      }
      const style = getComputedStyle(element);
      return {
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        background: style.backgroundColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
      };
    };
    return {
      header: dimensions(".app-header"),
      rail: dimensions(".project-rail"),
      openFolder: dimensions(".open-folder-button"),
    };
  });

  expect(layout.header.height).toBeLessThanOrEqual(36);
  expect(layout.header.scrollWidth).toBeLessThanOrEqual(
    layout.header.clientWidth + 1,
  );
  expect(layout.rail.width).toBeLessThanOrEqual(190);
  expect(layout.rail.background).toBe("rgb(255, 255, 255)");
  expect(layout.rail.borderRadius).toBe("0px");
  expect(layout.rail.boxShadow).toBe("none");
  expect(layout.openFolder.scrollWidth).toBeLessThanOrEqual(
    layout.openFolder.clientWidth + 1,
  );
  await expect(page.locator(".file-type-icon")).toHaveCount(0);

  await createTemplateProject(page, "micropython_tutorial");
  await expect(
    page.getByRole("button", { name: "Open student_work.py" }),
  ).toBeVisible();
  await expect(page.locator(".file-type-icon")).toHaveCount(0);
});

test("compiles all five active tutorials and runs their examples to completion", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(90_000);
  await seedWorkingFolder(ide, { folderName: "Tutorial-Suite-Test" });
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  const tutorials = [
    {
      id: "micropython_tutorial",
      title: "Tutorial 1: Python essentials",
      compiled: 3,
      summary: "Tutorial 1: 4 passed · 0 not completed · 0 incorrect",
      helpLabel: "Tutorial path",
      helpHref: "../guide/#virtual-run",
      completion: "Tutorial 1 complete",
    },
    {
      id: "tutorial_virtual_drawing",
      title: "Tutorial 2: Virtual XRP drawing",
      compiled: 5,
      summary: "Tutorial 2: 3 passed · 0 not completed · 0 incorrect",
      helpLabel: "Data types",
      helpHref: "../reference/#records",
      completion: "Tutorial 2 drawing complete",
    },
    {
      id: "tutorial_robot_programs",
      title: "Tutorial 3: sampled robot programs",
      compiled: 5,
      summary: "Tutorial 3: 2 passed · 0 not completed · 0 incorrect",
      helpLabel: "Robot service API",
      helpHref: "../reference/#robot",
      completion: "Tutorial 3 run complete",
    },
    {
      id: "tutorial_behavior_telemetry",
      title: "Tutorial 4: behavior, controls, and telemetry",
      compiled: 5,
      summary: "Tutorial 4: 3 passed · 0 not completed · 0 incorrect",
      helpLabel: "Live controls and telemetry",
      helpHref: "../reference/#live",
      completion: "Tutorial 4 behavior complete",
    },
    {
      id: "tutorial_physical_preflight",
      title: "Tutorial 5: Physical XRP deployment",
      compiled: 5,
      summary: "Tutorial 5: 6 passed · 0 not completed · 0 incorrect",
      helpLabel: "Physical XRP setup",
      helpHref: "../guide/#physical-xrp",
      completion: "Stationary preflight complete",
    },
  ] as const;

  for (const tutorial of tutorials) {
    await createTemplateProject(ide, tutorial.id);
    await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
    await expect(monitor.getByTestId("x-mm")).toHaveText("0.0 mm");
    const preview = ide.getByLabel("Rendered Markdown preview");
    await expect(preview).toBeVisible();
    await expect(
      preview.getByRole("heading", { name: tutorial.title }),
    ).toBeVisible();
    await expect(
      ide.getByRole("button", { name: "Open student_work.py" }),
    ).toBeVisible();
    await ide.getByRole("button", { name: "Open student_work.py" }).click();
    await expect(
      ide.getByRole("link", { name: tutorial.helpLabel }),
    ).toHaveAttribute("href", tutorial.helpHref);
    await ide.getByRole("button", { name: "Compile" }).click();
    await expect(ide.getByTestId("check-result")).toContainText(
      "compiled successfully",
    );
    await expect(
      ide.getByRole("button", { name: "Check examples" }),
    ).toHaveCount(0);
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(tutorial.summary, {
      timeout: 15_000,
    });
    await expect(ide.getByRole("log")).toContainText(tutorial.completion, {
      timeout: 15_000,
    });
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  }
});

test("keeps the Roomba demo active at full configured drive until Stop", async ({
  context,
  page: ide,
}) => {
  await seedWorkingFolder(ide, { folderName: "Roomba-Demo-Test" });
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await ide.goto("/ide/");
  await createTemplateProject(ide, "demo_roomba");
  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled successfully",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText(
    /0\.[1-9]\d \/ 0\.[1-9]\d/,
  );
  await ide.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
});

test("runs the obstacle-left-obstacle demo on the virtual XRP", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(50_000);
  await seedWorkingFolder(ide, { folderName: "Obstacle-Demo-Test" });
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await createTemplateProject(ide, "demo_obstacle_turn");
  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled successfully",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const liveProgram = monitor.locator(".live-controls-panel");
  await expect(liveProgram).toBeVisible();
  await expect(liveProgram.locator("summary")).toHaveCount(0);
  await expect(liveProgram).toContainText("5 controls");
  const secondApproach = liveProgram.getByRole("checkbox", {
    name: "Drive after turn",
  });
  const secondApproachControl = liveProgram.locator(
    '[data-runtime-parameter="second_approach"]',
  );
  await secondApproach.click();
  await expect(secondApproachControl).toHaveAttribute(
    "data-runtime-value",
    "false",
    { timeout: 5_000 },
  );
  await expect(secondApproachControl).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  await secondApproach.click();
  await expect(secondApproachControl).toHaveAttribute(
    "data-runtime-value",
    "true",
    { timeout: 5_000 },
  );
  await expect(secondApproachControl).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  const speed = liveProgram.getByRole("slider", { name: "Forward speed" });
  await speed.fill("150");
  const speedControl = liveProgram.locator(
    '[data-runtime-parameter="forward_speed_mm_s"]',
  );
  await expect(speedControl).toContainText("150 mm/s");
  await expect(speedControl).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  await expect(speedControl).toHaveAttribute("data-runtime-value", "150");
  const direction = liveProgram.locator(
    '[data-runtime-parameter="turn_direction"]',
  );
  await direction.getByLabel("right", { exact: true }).click();
  await expect(direction).toHaveAttribute("data-runtime-value", "right", {
    timeout: 5_000,
  });
  await expect(direction).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  await direction.getByLabel("left", { exact: true }).click();
  await expect(direction).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  await expect(direction).toHaveAttribute("data-runtime-value", "left");
  await expect(liveProgram.getByText("Phase")).toHaveCount(0);
  await expect(
    monitor.getByLabel("Program watch values").getByText("Phase"),
  ).toBeVisible();
  await expect(ide.getByRole("log")).toContainText(
    "Obstacle-turn demo complete",
    { timeout: 40_000 },
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
});

test("runs the expanding spiral with two live controls and obstacle stopping", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(60_000);
  await seedWorkingFolder(ide, { folderName: "Spiral-Demo-Test" });
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await createTemplateProject(ide, "demo_spiral");
  await ide.getByRole("button", { name: "Compile" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "compiled successfully",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();

  // Opening the Monitor after Run is the natural path from the IDE link.
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const liveControls = monitor.locator(".live-controls-panel");
  await expect(liveControls).toContainText("2 controls");
  const openMonitorControls = monitor.getByRole("button", {
    name: "Open monitor controls",
  });
  if (await openMonitorControls.isVisible()) {
    await openMonitorControls.click();
  }
  const programPlot = monitor.getByRole("checkbox", {
    name: "Spiral travel mm",
  });
  await expect(programPlot).toBeVisible();
  await expect(programPlot).not.toBeChecked();

  const speed = liveControls.getByRole("slider", { name: "Forward speed" });
  await speed.fill("100");
  const speedControl = liveControls.locator(
    '[data-runtime-parameter="forward_speed_mm_s"]',
  );
  await expect(speedControl).toHaveAttribute("data-runtime-value", "100", {
    timeout: 5_000,
  });
  await expect(speedControl).toHaveAttribute("data-pending", "false");

  const winding = liveControls.getByRole("slider", {
    name: "Spiral winding rate",
  });
  await expect(winding).toHaveValue("0.8");
  await expect(winding).toHaveAttribute("max", "1");
  await expect(ide.getByRole("log")).not.toContainText(
    "Press and release USER",
  );
  await winding.fill("0.6");
  const windingControl = liveControls.locator(
    '[data-runtime-parameter="spiral_winding_turns_per_m"]',
  );
  await expect(windingControl).toHaveAttribute("data-runtime-value", "0.6", {
    timeout: 5_000,
  });
  await expect(windingControl).toHaveAttribute("data-pending", "false");

  await monitor.getByTitle("Stop the running program.").click();
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
  await expect(programPlot).toBeVisible();

  await monitor
    .getByLabel("World configuration")
    .selectOption("obstacle-ahead");
  await expect(monitor.getByTestId("range-mm")).toContainText("180.0 mm");
  await ide.getByRole("button", { name: "Run", exact: true }).click();

  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("world-view")).toHaveAttribute(
    "data-pose-state",
    "published",
  );
  await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
});

test("Challenge 5 observes a blocked gate and routes around it", async ({
  context,
}) => {
  test.setTimeout(60_000);
  const monitor = await context.newPage();
  const ide = await context.newPage();
  await seedWorkingFolder(ide, { folderName: "Challenge-Five-Test" });
  const errors: string[] = [];
  for (const page of [monitor, ide]) {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
  }

  await monitor.goto("/monitor/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await monitor
    .getByLabel("World configuration")
    .selectOption("delivery-gate-blocked");
  await expect(monitor.getByTestId("range-mm")).toContainText("280.0 mm");

  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await createTemplateProject(ide, "challenge_5");
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Challenge 5 result: delivered",
    { timeout: 50_000 },
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  expect(errors).toEqual([]);
});
