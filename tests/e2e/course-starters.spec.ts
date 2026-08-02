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
    await page.getByLabel("Course starter").selectOption(starter.option);
    await page.getByRole("button", { name: "Load starter" }).click();
    await page.getByRole("button", { name: "Validate code" }).click();
    await expect(page.getByTestId("check-result")).toContainText(
      "compiled with MicroPython",
    );
    await page.getByRole("button", { name: "Run virtual XRP" }).click();
    await expect(page.getByRole("log")).toContainText(starter.completion, {
      timeout: 40_000,
    });
    await expect(page.getByTestId("target-status")).toContainText(
      "Virtual XRP · ready",
    );
    expect(errors).toEqual([]);
  });
}

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
  await ide.getByLabel("Course starter").selectOption("challenge_5");
  await ide.getByRole("button", { name: "Load starter" }).click();
  await ide.getByRole("button", { name: "Run virtual XRP" }).click();
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
