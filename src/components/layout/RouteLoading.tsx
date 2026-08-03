export const RouteLoading = () => (
  <div
    className="flex min-h-screen items-center justify-center bg-background px-6"
    role="status"
    aria-live="polite"
  >
    <div className="w-full max-w-sm space-y-4">
      <div className="mx-auto h-10 w-10 animate-pulse rounded-xl bg-accent/20" />
      <div className="mx-auto h-3 w-36 animate-pulse rounded-full bg-muted" />
      <p className="text-center text-xs text-muted-foreground">Carregando página...</p>
    </div>
  </div>
);
