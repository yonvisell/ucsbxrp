import { expect, test } from "@playwright/test";
import { seedWorkingFolder } from "./working-folder";

test("generated names enumerate occupied entries while custom names survive template changes", async ({
  page,
}) => {
  await seedWorkingFolder(page, { folderName: "Project-Naming" });
  await page.goto("/ide/");
  await expect(page.getByTestId("project-save-state")).toHaveText("Saved");
  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  const name = page.getByLabel("Name", { exact: true });
  await expect(name).toHaveValue("Expanding-spiral_01");
  await name.fill("Team 7");
  await page.getByLabel("Project template").selectOption("demo_obstacle_turn");
  await expect(name).toHaveValue("Team 7");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByTestId("project-folder")).toHaveText("Team 7");
  await expect(page.getByTestId("project-name")).toHaveText(
    "Obstacle, left, obstacle",
  );

  await page.getByRole("button", { name: "New project…", exact: true }).click();
  await page.getByLabel("Project template").selectOption("demo_spiral");
  await expect(name).toHaveValue("Expanding-spiral_01");
  // Another creator occupies the suggestion after it was shown. The final
  // native check must choose the next generated name and preserve those bytes.
  await page.evaluate(async () => {
    const parent = await (
      await navigator.storage.getDirectory()
    ).getDirectoryHandle("Project-Naming");
    const occupied = await parent.getFileHandle("EXPANDING-SPIRAL_01", {
      create: true,
    });
    const writable = await occupied.createWritable();
    await writable.write("other creator's work");
    await writable.close();
  });
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByTestId("project-folder")).toHaveText(
    "Expanding-spiral_02",
  );
  expect(
    await page.evaluate(async () => {
      const parent = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle("Project-Naming");
      return (
        await (await parent.getFileHandle("EXPANDING-SPIRAL_01")).getFile()
      ).text();
    }),
  ).toBe("other creator's work");
});
