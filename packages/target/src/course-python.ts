const rawCourseModules = import.meta.glob(
  "../../../vendor/current/ucsb_xrp/*.py",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

const rawReferenceModules = import.meta.glob(
  "../../../vendor/current/reference_mpy/**/*.mpy",
  {
    eager: true,
    import: "default",
    query: "?url",
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

export const COURSE_REFERENCE_FILES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(rawReferenceModules).map(([sourcePath, url]) => {
        if (!sourcePath.startsWith(sourcePrefix)) {
          throw new Error(`Unexpected reference artifact '${sourcePath}'`);
        }
        return [sourcePath.slice(sourcePrefix.length), url];
      }),
    ),
  );

if (
  !("reference_mpy/ucsb_xrp_reference/__init__.mpy" in COURSE_REFERENCE_FILES)
) {
  throw new Error("The supplied reference package was not bundled");
}
