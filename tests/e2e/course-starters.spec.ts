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

test("runs the default project directly from a fresh Monitor", async ({
  page,
}) => {
  await page.goto("/dashboard/");
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

test("loads and runs the staged MicroPython tutorial", async ({ page }) => {
  await page.goto("/ide/");
  await expect(page.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await page
    .getByLabel("Project template")
    .selectOption("micropython_tutorial");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open 1_values_and_functions.py" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open 7_finite_state_machine.py" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByTestId("check-result")).toContainText(
    "8 Python files compiled with MicroPython",
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "average speed: 150.0 mm/s",
  );
});

test("runs the obstacle-left-obstacle demo on the virtual XRP", async ({
  context,
  page: ide,
}) => {
  test.setTimeout(50_000);
  const monitor = await context.newPage();
  await monitor.goto("/dashboard/");
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
  const liveProgram = monitor.locator(".live-program-group");
  await expect(liveProgram).toBeVisible();
  await expect(liveProgram.locator("summary")).toHaveCount(0);
  await expect(liveProgram).toContainText("5 controls");
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
  const secondApproach = liveProgram.getByRole("checkbox", {
    name: "Drive after turn",
  });
  await secondApproach.click();
  const secondApproachControl = liveProgram.locator(
    '[data-runtime-parameter="second_approach"]',
  );
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
  await monitor.goto("/dashboard/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · running",
  );
  const liveControls = monitor.locator(".live-program-group");
  await expect(liveControls).toContainText("2 controls");

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

  await monitor
    .getByLabel("Virtual scene")
    .selectOption("delivery-gate-blocked");
  await expect(monitor.getByTestId("range-mm")).toContainText("280.0 mm");
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

  await monitor.goto("/dashboard/");
  await expect(monitor.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
  );
  await monitor
    .getByLabel("Virtual scene")
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
