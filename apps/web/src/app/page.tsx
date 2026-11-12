/**
 * Placeholder landing route.
 *
 * Phase 1 scaffolding: it exists so the App Router has a root page and the
 * project builds and deploys. It is NOT the product landing page. Replace it
 * during Phase 2 (see docs/product/user-flows.md).
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Phase 1 · Foundation
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">DalaShift</h1>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Farm-level agricultural intelligence built on NASA Earth observation data. The product
        surface is not yet implemented — this repository currently contains the research,
        architecture and database design that the build will follow.
      </p>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        <li>Product requirements — PRD.md</li>
        <li>Technical architecture — ARCHITECTURE.md</li>
        <li>Developer reference — ARCHITECTURE_ESSENTIALS.md</li>
        <li>Contributing — CONTRIBUTING.md</li>
      </ul>
    </main>
  );
}
