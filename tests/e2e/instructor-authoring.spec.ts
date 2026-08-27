import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

function projectFiles(directory: string): Record<string, string> {
  const files: Record<string, string> = {};
  const visit = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) {
        visit(path);
      } else {
        files[relative(directory, path).replaceAll("\\", "/")] = readFileSync(
          path,
          "utf8",
        );
      }
    }
  };
  visit(directory);
  return files;
}

test("landing page exposes the instructor tools as compact text links", async ({
  page,
}) => {
  await page.goto("/");
  const authorLink = page.getByRole("link", {
    name: "challenge creation wizard",
  });
  await expect(authorLink).toHaveAttribute("href", "./author/");
  await expect(authorLink.locator("xpath=..")).toContainText(
    "Instructor resources: challenge creation wizard",
  );
});

test("specification editor validates and downloads the complete curriculum example", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/author/");

  await expect(
    page.getByRole("heading", {
      name: "Challenge creation",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Starting challenge")).toHaveValue(
    "challenge_3",
  );
  await expect(page.getByLabel("Challenge ID")).toHaveValue("challenge_6");
  await expect(
    page.getByLabel("Program sequence — one step per line"),
  ).toHaveValue(/challenge\.py loads the initial pose/);
  await expect(page.getByText("Program flow", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "python3 scripts/challenge_authoring.py create --spec challenge_6.challenge.json",
    ),
  ).toBeVisible();

  await page.getByLabel("Starting challenge").selectOption("challenge_2");
  await expect(
    page.getByText("challenge_2 source requires a waypoint named turn."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load this challenge's example world" })
    .click();
  await expect(
    page.getByText("Loaded the challenge_2 example world."),
  ).toBeVisible();
  await page
    .locator('.file-open-button input[type="file"]')
    .setInputFiles("docs/examples/waypoint_slalom.challenge.json");
  await expect(
    page.getByText("waypoint_slalom.challenge.json opened."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add another component" }).click();
  await expect(
    page.getByText("Student implementation 2 is incomplete."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeDisabled();
  await page.getByLabel("Additional component 1 file").fill("localizer.py");
  await page.getByLabel("Additional component 1 class").fill("Localizer");
  await page
    .getByLabel("Additional component 1 selection flag")
    .fill("USE_STUDENT_LOCALIZER");
  await page
    .getByLabel("Additional component 1 responsibility")
    .fill("Estimate the robot pose from the supplied landmark observations.");
  await expect(
    page.getByText(
      "Student implementation 2 needs a complete localizer.py project-file override.",
    ),
  ).toBeVisible();
  await page.getByText("Optional project-file overrides").click();
  const overrideEditor = page.getByLabel("Project file overrides as JSON");
  const originalOverrideSource = await overrideEditor.inputValue();
  const overrides = JSON.parse(originalOverrideSource) as Record<
    string,
    string
  >;
  overrides["localizer.py"] = "class Localizer:\n    pass\n";
  await overrideEditor.fill(JSON.stringify(overrides, null, 2));
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Remove additional component 1" })
    .click();
  await overrideEditor.fill(originalOverrideSource);

  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download checked specification" })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("challenge_6.challenge.json");

  await page
    .getByRole("button", { name: "Start a blank specification" })
    .click();
  await expect(page.getByText(/item\(s\) require attention/)).toBeVisible();
  await expect(
    page.getByText("Title must be one nonempty line."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download checked specification" }),
  ).toBeDisabled();

  await page
    .getByRole("button", { name: "Load working slalom example" })
    .click();
  await expect(
    page.getByText(
      "Specification checks pass. No repository files have been created or checked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Authoring instructions" }),
  ).toHaveAttribute("href", /INSTRUCTOR_CHALLENGE_AUTHORING.*\.md$/);
  await expect(
    page.getByRole("link", { name: "Technical overview" }),
  ).toHaveAttribute("href", "../overview/#authoring");
  expect(browserErrors).toEqual([]);
});

test("visual world editor changes the downloadable world without losing advanced fields", async ({
  page,
}) => {
  await page.goto("/author/");
  const editor = page.locator(".world-editor");

  await expect(editor.getByLabel("World to edit")).toHaveValue(
    "waypoint-slalom",
  );
  await expect(editor.getByLabel("Grid snap")).toHaveValue("25");
  await expect(
    editor.getByRole("img", { name: "Graphic editor for Waypoint slalom" }),
  ).toBeVisible();
  await expect(editor.getByText("Advanced world.json")).toBeVisible();
  await expect(editor.getByLabel("World configuration JSON")).not.toBeVisible();

  await editor.getByLabel("World item type").selectOption("block");
  await editor.getByRole("button", { name: "Add item" }).click();
  const inspector = editor.locator(".world-editor-inspector");
  await expect(
    inspector.getByRole("heading", { name: "block · Block" }),
  ).toBeVisible();
  await inspector.getByLabel("Label").fill("Foam barrier");
  await inspector.getByLabel("Feature name").fill("foam_barrier");
  await expect(
    editor.getByRole("button", { name: "block · Foam barrier" }),
  ).toBeVisible();

  await editor.getByText("Advanced world.json").click();
  const rawEditor = editor.getByLabel("World configuration JSON");
  const editedSource = await rawEditor.inputValue();
  const extended = JSON.parse(editedSource) as Record<string, any>;
  extended.instructor_extension = { keep: "yes" };
  extended.worlds[0].markers[0].appearance = "dashed";
  await rawEditor.fill(JSON.stringify(extended, null, 2));
  await expect(
    editor.getByRole("img", { name: "Graphic editor for Waypoint slalom" }),
  ).toBeVisible();

  await inspector.getByRole("button", { name: "waypoint · 1" }).click();
  await inspector.getByLabel("Label").fill("First gate");
  const retained = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  expect(retained.instructor_extension).toEqual({ keep: "yes" });
  expect(retained.worlds[0].markers[0].appearance).toBe("dashed");
  expect(retained.worlds[0].markers[1].label).toBe("First gate");

  await editor.getByRole("button", { name: "Add world" }).click();
  await expect(editor.getByLabel("World to edit")).toHaveValue("world");
  await editor.getByRole("button", { name: "Duplicate" }).click();
  await expect(editor.getByLabel("World to edit")).toHaveValue("world-copy");
  await editor.getByRole("button", { name: "Make default" }).click();
  await expect(
    editor.getByLabel("World to edit").locator("option:checked"),
  ).toContainText("default");
  await editor.getByRole("button", { name: "Delete" }).click();
  await expect(editor.getByLabel("World to edit")).toHaveValue("world");
  await editor.getByLabel("World to edit").selectOption("waypoint-slalom");
  await editor.getByRole("button", { name: "Make default" }).click();

  const validExtendedSource = await editor
    .getByLabel("World configuration JSON")
    .inputValue();
  await editor.getByLabel("World configuration JSON").fill("{");
  await expect(editor.getByRole("alert")).toContainText(
    "Graphic editor unavailable",
  );
  await expect(editor.getByLabel("World configuration JSON")).toHaveValue("{");
  await editor.getByLabel("World configuration JSON").fill(validExtendedSource);
  await expect(
    editor.getByRole("img", { name: /Graphic editor for/ }),
  ).toBeVisible();

  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download checked specification" })
    .click();
  const download = await downloadEvent;
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const downloaded = JSON.parse(
    readFileSync(downloadedPath!, "utf8"),
  ) as Record<string, any>;
  expect(downloaded.world.instructor_extension).toEqual({ keep: "yes" });
  expect(downloaded.world.worlds[0].obstacles.at(-1)).toMatchObject({
    type: "block",
    label: "Foam barrier",
    feature: "foam_barrier",
  });
});

test("visual world handles resize lines and boxes and set initial heading", async ({
  page,
}) => {
  await page.goto("/author/");
  const editor = page.locator(".world-editor");
  const rawEditor = editor.getByLabel("World configuration JSON");
  await editor.getByText("Advanced world.json").click();

  await editor.getByRole("button", { name: "start box · Start" }).click();
  const rectangleHandle = editor
    .locator('circle[aria-label="Resize start_box"]')
    .first();
  await rectangleHandle.scrollIntoViewIfNeeded();
  const rectangleBox = await rectangleHandle.boundingBox();
  expect(rectangleBox).not.toBeNull();
  const beforeRectangle = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  await page.mouse.move(
    rectangleBox!.x + rectangleBox!.width / 2,
    rectangleBox!.y + rectangleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(rectangleBox!.x - 14, rectangleBox!.y + 14);
  await page.mouse.up();
  const afterRectangle = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  expect(afterRectangle.worlds[0].markers[0]).not.toEqual(
    beforeRectangle.worlds[0].markers[0],
  );

  await editor.getByLabel("World item type").selectOption("start_line");
  await editor.getByRole("button", { name: "Add item" }).click();
  const lineHandle = editor
    .locator('circle[aria-label="Move start_line first endpoint"]')
    .first();
  await lineHandle.scrollIntoViewIfNeeded();
  const lineBox = await lineHandle.boundingBox();
  expect(lineBox).not.toBeNull();
  const beforeLine = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  await page.mouse.move(
    lineBox!.x + lineBox!.width / 2,
    lineBox!.y + lineBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(lineBox!.x + 22, lineBox!.y - 18);
  await page.mouse.up();
  const afterLine = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  expect(afterLine.worlds[0].markers.at(-1)).not.toEqual(
    beforeLine.worlds[0].markers.at(-1),
  );

  await editor.getByRole("button", { name: "Initial XRP pose" }).click();
  const headingHandle = editor.locator(
    'circle[aria-label="Set initial XRP heading"]',
  );
  await headingHandle.scrollIntoViewIfNeeded();
  const headingBox = await headingHandle.boundingBox();
  expect(headingBox).not.toBeNull();
  await page.mouse.move(
    headingBox!.x + headingBox!.width / 2,
    headingBox!.y + headingBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(headingBox!.x - 15, headingBox!.y - 36);
  await page.mouse.up();
  const afterHeading = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  expect(afterHeading.worlds[0].initial_pose.heading_rad).not.toBe(0);

  const poseHandle = editor.locator(
    'circle[aria-label="Move initial XRP pose"]',
  );
  const poseBox = await poseHandle.boundingBox();
  expect(poseBox).not.toBeNull();
  await page.mouse.move(
    poseBox!.x + poseBox!.width / 2,
    poseBox!.y + poseBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(poseBox!.x + 32, poseBox!.y - 22);
  await page.mouse.up();
  const afterPoseMove = JSON.parse(await rawEditor.inputValue()) as Record<
    string,
    any
  >;
  expect(afterPoseMove.worlds[0].initial_pose).not.toMatchObject({
    x_mm: 0,
    y_mm: 0,
  });
});

test("specification editor remains readable at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/author/");
  await expect(
    page.getByRole("heading", {
      name: "Challenge creation",
    }),
  ).toBeVisible();
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  const labelFontSize = await page
    .getByLabel("Starting challenge")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(labelFontSize).toBeGreaterThanOrEqual(14);
  const commandFontSize = await page
    .locator(".create-row code")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(commandFontSize).toBeGreaterThanOrEqual(14);
  const editorLayout = page.locator(".world-editor-layout");
  await expect(editorLayout).toBeVisible();
  const layoutColumns = await editorLayout.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns,
  );
  expect(layoutColumns.trim().split(/\s+/)).toHaveLength(1);
});

test("instructor overview states the system boundaries and release workflow", async ({
  page,
}) => {
  await page.goto("/overview/");
  await expect(
    page.getByRole("heading", {
      name: "UCSBXRP technical overview",
    }),
  ).toBeVisible();
  for (const heading of [
    "Challenge sequence",
    "Runtime architecture",
    "Project structure",
    "Virtual and physical targets",
    "Challenge authoring",
    "Release, offline operation, and validation",
    "Release checks",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "Create or revise a challenge" }),
  ).toHaveAttribute("href", "../author/");
  await expect(page.locator("#components")).toContainText(
    "XRPBot, Robot, StraightLineController, ArenaMap, OccupancyGrid, and DeliveryMission",
  );
  await expect(page.locator("#authoring")).toContainText(
    "The browser does not create repository files or publish a challenge.",
  );
});

test("generated Waypoint Slalom runs in the virtual XRP and exports telemetry", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(150_000);
  const draftRoot = mkdtempSync(join(tmpdir(), "ucsbxrp-author-e2e-"));
  try {
    cpSync("vendor/current", join(draftRoot, "vendor/current"), {
      recursive: true,
    });
    execFileSync(
      "python3",
      [
        "scripts/challenge_authoring.py",
        "--root",
        draftRoot,
        "create",
        "--spec",
        "docs/examples/waypoint_slalom.challenge.json",
      ],
      { stdio: "pipe" },
    );
    const files = projectFiles(
      join(draftRoot, "vendor/current/starters/challenge_6"),
    );
    await context.addInitScript(() => {
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        value: undefined,
      });
    });
    await ide.addInitScript((generatedFiles: Record<string, string>) => {
      localStorage.clear();
      localStorage.setItem(
        "ucsb-xrp-course-project-v2",
        JSON.stringify({
          name: "Waypoint Slalom",
          entrypoint: "main.py",
          files: generatedFiles,
        }),
      );
    }, files);

    await ide.goto("/ide/");
    const monitor = await context.newPage();
    await monitor.goto("/monitor/");
    await monitor
      .getByRole("button", { name: "Start recording", exact: true })
      .click();

    await ide.getByRole("button", { name: "Validate" }).click();
    await expect(ide.getByTestId("check-result")).toContainText(
      "compiled with MicroPython",
    );
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(
      "Waypoint Slalom complete",
      { timeout: 80_000 },
    );
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await expect
      .poll(
        async () =>
          Number.parseFloat(
            (await monitor.getByTestId("x-mm").textContent()) ?? "NaN",
          ),
        { message: "the generated route should advance through the world" },
      )
      .toBeGreaterThan(900);

    await monitor
      .getByRole("button", { name: "Stop recording", exact: true })
      .click();
    const downloadEvent = monitor.waitForEvent("download");
    await monitor.getByRole("button", { name: "Export telemetry CSV" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toMatch(/^xrp-telemetry-.*\.csv$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const csv = readFileSync(downloadPath!, "utf8");
    expect(csv.split("\n").length).toBeGreaterThan(10);
    expect(csv).toContain("target_left_wheel_speed_mm_s");
  } finally {
    rmSync(draftRoot, { recursive: true, force: true });
  }
});
