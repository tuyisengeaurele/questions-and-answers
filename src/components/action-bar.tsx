/** Fixed bar for the main action of a question screen, sitting just above the navigation bar on phones. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="rise fixed inset-x-0 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-10 border-t border-line bg-bg px-4 py-3 md:bottom-0">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}

/** Keeps content clear of the fixed action bar. */
export function ActionBarSpacer() {
  return <div className="h-24" aria-hidden />;
}
