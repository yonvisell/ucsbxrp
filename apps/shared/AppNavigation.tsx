export type CourseApp =
  "home" | "ide" | "monitor" | "guide" | "commission" | "reference";

const destinations: ReadonlyArray<{
  id: CourseApp;
  href: string;
  label: string;
}> = [
  { id: "home", href: "../", label: "Home" },
  { id: "ide", href: "../ide/", label: "IDE" },
  { id: "monitor", href: "../monitor/", label: "Monitor" },
  { id: "guide", href: "../guide/", label: "Guide" },
  {
    id: "commission",
    href: "../commission/",
    label: "Set up or Repair",
  },
  { id: "reference", href: "../reference/", label: "API" },
];

/** Consistent navigation for browser tabs and the installed course app. */
export function AppNavigation({
  active,
  disabled = false,
  onNavigate,
}: {
  active?: CourseApp;
  disabled?: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav aria-label="Course applications" className="app-navigation">
      {destinations.map((destination) => (
        <a
          aria-current={active === destination.id ? "page" : undefined}
          aria-disabled={disabled || undefined}
          className="app-navigation-link"
          href={destination.href}
          key={destination.id}
          rel={
            (active === "ide" && destination.id === "monitor") ||
            (active === "monitor" && destination.id === "ide")
              ? "noopener"
              : undefined
          }
          target={
            (active === "ide" && destination.id === "monitor") ||
            (active === "monitor" && destination.id === "ide")
              ? "_blank"
              : undefined
          }
          onClick={
            disabled || onNavigate
              ? (event) => {
                  event.preventDefault();
                  if (!disabled) {
                    onNavigate?.(destination.href);
                  }
                }
              : undefined
          }
        >
          {destination.label}
        </a>
      ))}
    </nav>
  );
}
