const rawCourseModules = import.meta.glob(
  "../../../vendor/current/ucsb_xrp/*.py",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

const sourcePrefix = "../../../vendor/current/";

export const COURSE_PACKAGE_FILES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(rawCourseModules).map(([sourcePath, content]) => {
        if (!sourcePath.startsWith(sourcePrefix)) {
          throw new Error(`Unexpected course package source '${sourcePath}'`);
        }
        return [sourcePath.slice(sourcePrefix.length), content];
      }),
    ),
  );

if (!("ucsb_xrp/__init__.py" in COURSE_PACKAGE_FILES)) {
  throw new Error("The canonical ucsb_xrp package was not bundled");
}
