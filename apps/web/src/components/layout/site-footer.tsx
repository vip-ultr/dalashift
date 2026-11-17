import Image from 'next/image';
import Link from 'next/link';

/** Global footer. Quiet, informational, and safe to render on every route. */
export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border bg-surface-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Image
              src="/brand/logo-horizontal.svg"
              alt="DalaShift"
              width={117}
              height={30}
              className="h-6 w-auto"
            />
            <span className="text-sm text-text-primary">
              Climate-informed crop rotation decisions for rain-fed farmers.
            </span>
          </div>
          <Link
            href="/methodology"
            className="text-sm font-medium text-brand-primary hover:underline"
          >
            Methodology and data sources
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          DalaShift uses public NASA data. It is not endorsed by or affiliated with NASA.
        </p>
      </div>
    </footer>
  );
}
