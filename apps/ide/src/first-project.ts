import type { CourseDirectoryHandle } from "../../shared/course-folder";

/** Read names only; final creation still holds the native parent writer lock. */
export async function nextAvailableProjectName(
  parent: CourseDirectoryHandle,
  baseName: string,
  alwaysNumbered = false,
): Promise<string> {
  const names = new Set<string>();
  let scanned = 0;
  for await (const [name] of parent.entries()) {
    if (++scanned > 10_000)
      throw new Error(
        "Choose a smaller Working folder so project names can be checked reliably.",
      );
    names.add(name.normalize("NFC").toLowerCase());
  }
  const base = baseName.trim() || "XRP_Project";
  for (let number = alwaysNumbered ? 1 : 0; number <= 10_001; number++) {
    const suffix = number === 0 ? "" : `_${String(number).padStart(2, "0")}`;
    const name = base.slice(0, 255 - suffix.length) + suffix;
    if (!names.has(name.normalize("NFC").toLowerCase())) return name;
  }
  throw new Error("Choose another Working folder for this project.");
}

export function nextFirstProjectName(
  parent: CourseDirectoryHandle,
): Promise<string> {
  return nextAvailableProjectName(parent, "my_demo_spiral", true);
}

/** Keep the user's name separate from a replaceable, asynchronously checked default. */
export class ProjectNameDraft {
  private epoch = 0;
  private context: object | null = null;
  private parent: CourseDirectoryHandle | null = null;
  private base = "";
  private value = "";
  private custom = false;

  get name(): string {
    return this.value;
  }
  get isCustom(): boolean {
    return this.custom;
  }

  reset(context: object | null, defaultName: string): string {
    this.custom = false;
    return this.select(context, defaultName);
  }

  select(context: object | null, defaultName: string): string {
    this.cancel();
    this.context = context;
    this.base = defaultName;
    if (!this.custom) this.value = defaultName;
    return this.value;
  }

  edit(name: string): string {
    this.cancel();
    this.custom = true;
    this.value = name;
    return name;
  }

  cancel(): void {
    this.epoch++;
    this.parent = null;
  }

  async suggest(
    parent: CourseDirectoryHandle,
    context: object,
  ): Promise<string | null> {
    if (context !== this.context) return null;
    const epoch = ++this.epoch;
    this.parent = parent;
    if (this.custom) return this.value;
    const current = () =>
      epoch === this.epoch &&
      context === this.context &&
      parent === this.parent &&
      !this.custom;
    let available: string;
    try {
      available = await nextAvailableProjectName(parent, this.base);
    } catch (error) {
      if (!current()) return null;
      throw error;
    }
    if (!current()) return null;
    this.value = available;
    return available;
  }
}
