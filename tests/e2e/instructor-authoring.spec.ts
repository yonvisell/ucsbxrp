import { expect, test } from "@playwright/test";

test("landing page exposes the instructor tools as compact text links", async ({
  page,
}) => {
  await page.goto("/");
  const authorLink = page.getByRole("link", {
    name: "challenge creation wizard",
  });
  const overviewLink = page.getByRole("link", {
    name: "overview of UCSBXRP",
  });
  await expect(authorLink).toHaveAttribute("href", "./author/");
  await expect(overviewLink).toHaveAttribute("href", "./overview/");
  await expect(authorLink.locator("xpath=..")).toContainText(
    "challenge creation wizard • overview of UCSBXRP",
  );
});

test("wizard validates and downloads the complete curriculum example", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/author/");

  await expect(
    page.getByRole("heading", { name: "UCSBXRP challenge creation" }),
  ).toBeVisible();
  await expect(page.getByLabel("Starting challenge")).toHaveValue(
    "challenge_3",
  );
  await expect(page.getByLabel("Challenge ID")).toHaveValue("challenge_6");
  await expect(
    page.getByText(
      "Specification complete. The repository performs the final file checks.",
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
      "Specification complete. The repository performs the final file checks.",
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add another component" }).click();
  await expect(
    page.getByText("Student implementation 2 is incomplete."),
  ).toBeVisible();
  await page.getByLabel("Additional component 1 file").fill("localizer.py");
  await page.getByLabel("Additional component 1 class").fill("Localizer");
  await page
    .getByLabel("Additional component 1 responsibility")
    .fill("Estimate the robot pose from the supplied landmark observations.");
  await expect(
    page.getByText(
      "Specification complete. The repository performs the final file checks.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove additional component 1" })
    .click();

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

  await page
    .getByRole("button", { name: "Load working slalom example" })
    .click();
  await expect(
    page.getByText(
      "Specification complete. The repository performs the final file checks.",
    ),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("instructor overview states the system boundaries and release workflow", async ({
  page,
}) => {
  await page.goto("/overview/");
  await expect(
    page.getByRole("heading", { name: "UCSBXRP technical overview" }),
  ).toBeVisible();
  for (const heading of [
    "Course progression",
    "Runtime architecture",
    "Project structure",
    "Virtual and physical targets",
    "Challenge authoring",
    "Release, offline operation, and validation",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "Open challenge creation wizard" }),
  ).toHaveAttribute("href", "../author/");
});
