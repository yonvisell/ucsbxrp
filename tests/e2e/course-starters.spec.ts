import { expect, test } from "@playwright/test";

const starters = [
  { option: "challenge_2", completion: "Challenge 2 complete" },
  { option: "challenge_3", completion: "Challenge 3 complete" },
  { option: "challenge_4", completion: "Challenge 4 complete" },
  { option: "challenge_5", completion: "Challenge 5 result: delivered" },
];

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
    await page.getByRole("button", { name: "Load", exact: true }).click();
    await page.getByRole("button", { name: "Validate code" }).click();
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
  await page.getByRole("button", { name: "Load", exact: true }).click();
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
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open 1_values_and_functions.py" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open 7_finite_state_machine.py" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate code" }).click();
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
  await ide.getByRole("button", { name: "Load", exact: true }).click();
  await ide.getByRole("button", { name: "Validate code" }).click();
  await expect(ide.getByTestId("check-result")).toContainText(
    "3 Python files compiled with MicroPython",
  );
  await ide.getByRole("button", { name: "Run", exact: true }).click();
  await expect(ide.getByRole("log")).toContainText(
    "Obstacle-turn demo complete",
    { timeout: 40_000 },
  );
  await expect(ide.getByTestId("target-status")).toContainText(
    "Virtual XRP · ready",
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
  await ide.getByRole("button", { name: "Load", exact: true }).click();
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
