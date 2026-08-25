import { expect, test } from "@playwright/test";

const starters = [
  { option: "challenge_2", completion: "Challenge 2 complete" },
  { option: "challenge_3", completion: "Challenge 3 complete" },
  { option: "challenge_4", completion: "Challenge 4 complete" },
  { option: "challenge_5", completion: "Challenge 5 result: delivered" },
];

test("opens the spiral demo by default in a new browser", async ({ page }) => {
  await page.goto("/ide/");

  await expect(page.getByLabel("Project template")).toHaveValue("demo_spiral");
  await expect(
    page.getByRole("button", { name: "Open main.py (main file)" }),
  ).toBeVisible();
});

test("keeps the former dashboard address as a Monitor redirect", async ({
  page,
}) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/\/monitor\/$/);
  await expect(page).toHaveTitle("UCSBXRP Monitor");
});

test("runs the default project directly from a fresh Monitor", async ({
  page,
}) => {
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

  await page.getByRole("tab", { name: "System log" }).click();
  await expect(page.getByRole("log")).toContainText(
    "Project prepared for the virtual XRP",
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
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
  page,
}) => {
  await page.goto("/monitor/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect
    .poll(() => page.locator("html").getAttribute("data-offline-shell-state"))
    .toBe("ready");
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
  await page.getByRole("tab", { name: "System log" }).click();
  await expect(page.getByRole("log")).not.toContainText(
    "MicroPython exception",
  );
  await page
    .locator(".app-header")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await expect(page.getByRole("log")).toContainText(
    "Run stopped; drive command set to zero",
  );
});

test("Run reports a validation error before starting invalid code", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ucsb-xrp-course-project-v1",
      JSON.stringify({
        name: "invalid-project",
        entrypoint: "main.py",
        files: { "main.py": "def broken(:\n    pass\n" },
      }),
    );
  });
  await page.goto("/ide/");

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Validation failed");
  await page.getByRole("tab", { name: "Status" }).click();
  await expect(page.getByTestId("check-result")).toContainText(/main\.py/i);
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

test("runs hardware-free student component checks without changing the target", async ({
  page,
}) => {
  await page.goto("/ide/");
  await page.getByLabel("Project template").selectOption("challenge_1");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(
    page.getByRole("button", { name: "Open README.md" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Test components" }).click();
  await expect(page.getByRole("log")).toContainText("PENDING · SensorModel");
  await expect(page.getByRole("log")).toContainText(
    "PENDING · WheelSpeedController",
  );
  await expect(page.getByRole("log")).toContainText(
    "Component checks completed with MicroPython",
  );
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
});

for (const starter of starters) {
  test(`${starter.option} validates and completes on the virtual XRP`, async ({
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

    await page.goto("/ide/");
    await expect(page.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await page.getByLabel("Project template").selectOption(starter.option);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await page.getByRole("button", { name: "Validate" }).click();
    await expect(page.getByTestId("check-result")).toContainText(
      "compiled with MicroPython",
    );
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("log")).toContainText(starter.completion, {
      timeout: 40_000,
    });
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

  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open 7_finite_state_machine.py" }),
  ).toBeVisible();
  await expect(page.locator(".file-type-icon")).toHaveCount(0);
});

test("validates and runs every staged tutorial lesson on the virtual XRP", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(150_000);
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByLabel("Project template").selectOption("micropython_tutorial");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    ide.getByRole("button", { name: /Open 1_values_and_functions\.py/ }),
  ).toBeVisible();
  await expect(
    ide.getByRole("button", { name: /Open 7_finite_state_machine\.py/ }),
  ).toBeVisible();
  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "8 Python files compiled with MicroPython",
  );

  const lessons = [
    {
      file: "1_values_and_functions.py",
      output: "Lesson 1 complete: 150.0 mm/s",
      xRange: [-1, 1],
    },
    {
      file: "2_collections_and_loops.py",
      output: "Lesson 2 complete: 3 segments, 600.0 mm",
      xRange: [-1, 1],
    },
    {
      file: "3_classes.py",
      output: "Lesson 3 complete: 3 motion segments",
      xRange: [10, 100],
    },
    {
      file: "4_exceptions.py",
      output: "Lesson 4 complete: 1 safe segment",
      xRange: [1, 50],
    },
    {
      file: "5_modules.py",
      output: "Lesson 5 complete: imported helper ran 3 segments",
      xRange: [10, 110],
    },
    {
      file: "6_virtual_robot.py",
      output: "Lesson 6 complete: obstacle detected at",
      xRange: [150, 350],
    },
    {
      file: "7_finite_state_machine.py",
      output: "Lesson 7 complete: finite-state route finished",
      xRange: [150, 450],
    },
  ] as const;

  for (const lesson of lessons) {
    await ide
      .getByRole("button", { name: new RegExp(`Open ${lesson.file}`) })
      .click();
    const makeMain = ide.getByRole("button", { name: "Make main" });
    if (await makeMain.isEnabled()) {
      await makeMain.click();
    }
    await ide.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    await ide.getByRole("button", { name: "Run", exact: true }).click();
    await expect(ide.getByRole("log")).toContainText(lesson.output, {
      timeout: 15_000,
    });
    await expect(ide.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
      { timeout: 15_000 },
    );
    await expect(monitor.getByTestId("motor-effort")).toHaveText("0.00 / 0.00");
    const finalX = Number.parseFloat(
      (await monitor.getByTestId("x-mm").textContent()) ?? "NaN",
    );
    expect(finalX, lesson.file).toBeGreaterThanOrEqual(lesson.xRange[0]);
    expect(finalX, lesson.file).toBeLessThanOrEqual(lesson.xRange[1]);

    if (lesson.file === "6_virtual_robot.py") {
      const finalRange = Number.parseFloat(
        (await monitor.getByTestId("range-mm").textContent()) ?? "NaN",
      );
      expect(finalRange).toBeGreaterThan(250);
      expect(finalRange).toBeLessThanOrEqual(325);
    }

    if (lesson.xRange[0] > 1) {
      await ide.getByRole("button", { name: "Reset", exact: true }).click();
      await ide.getByRole("button", { name: "Run", exact: true }).click();
      await expect(ide.getByTestId("target-status")).toContainText(
        "Virtual XRP · running",
      );
      await expect(ide.getByTestId("target-status")).toContainText(
        "Virtual XRP · ready",
        { timeout: 15_000 },
      );
      const repeatedX = Number.parseFloat(
        (await monitor.getByTestId("x-mm").textContent()) ?? "NaN",
      );
      expect(Math.abs(repeatedX - finalX), lesson.file).toBeLessThanOrEqual(5);
      await expect(monitor.getByTestId("motor-effort")).toHaveText(
        "0.00 / 0.00",
      );
    }
  }
});

test("runs the obstacle-left-obstacle demo on the virtual XRP", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(50_000);
  const monitor = await context.newPage();
  await monitor.goto("/monitor/");
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await ide.getByLabel("Project template").selectOption("demo_obstacle_turn");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "3 Python files compiled with MicroPython",
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
  await speed.fill("180");
  const speedControl = liveProgram.locator(
    '[data-runtime-parameter="forward_speed_mm_s"]',
  );
  await expect(speedControl).toContainText("180 mm/s");
  await expect(speedControl).toHaveAttribute("data-pending", "false", {
    timeout: 5_000,
  });
  await expect(speedControl).toHaveAttribute("data-runtime-value", "180");
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
  await ide.goto("/ide/");
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );

  await ide.getByLabel("Project template").selectOption("demo_spiral");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
  await ide.getByRole("button", { name: "Validate" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "3 Python files compiled with MicroPython",
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
  await expect(winding).toHaveValue("1.2");
  await expect(winding).toHaveAttribute("max", "2");
  await expect(ide.getByRole("log")).not.toContainText(
    "Press and release USER",
  );
  await winding.fill("1");
  const windingControl = liveControls.locator(
    '[data-runtime-parameter="spiral_winding_turns_per_m"]',
  );
  await expect(windingControl).toHaveAttribute("data-runtime-value", "1", {
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
  await expect(monitor.getByTestId("range-mm")).toContainText("250.0 mm");
  await ide.getByRole("button", { name: "Run", exact: true }).click();

  await expect(ide.getByRole("log")).toContainText(
    "Obstacle detected; spiral stopped",
    { timeout: 15_000 },
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
  await ide.getByLabel("Project template").selectOption("challenge_5");
  await ide.getByRole("button", { name: "Create", exact: true }).click();
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
