import { AppNavigation, type CourseApp } from "./AppNavigation";

interface CourseHeaderProps {
  active?: CourseApp;
  className?: string;
  navigationDisabled?: boolean;
  onNavigate?: (href: string) => void;
}

/** Compact UCSBXRP identity and navigation shared by course pages. */
export function CourseHeader({
  active,
  className,
  navigationDisabled = false,
  onNavigate,
}: CourseHeaderProps) {
  return (
    <header
      className={`app-header course-header${className ? ` ${className}` : ""}`}
    >
      <a
        aria-label="UCSBXRP"
        className="brand course-brand"
        href="../"
        onClick={
          onNavigate
            ? (event) => {
                event.preventDefault();
                onNavigate("../");
              }
            : undefined
        }
      >
        <span className="brand-mark">UCSB</span>
        <span className="brand-xrp">XRP</span>
      </a>
      <AppNavigation
        active={active}
        disabled={navigationDisabled}
        onNavigate={onNavigate}
      />
    </header>
  );
}
