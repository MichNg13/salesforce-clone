export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4" aria-busy="true" aria-label="Loading">
      <div className="card h-20 animate-pulse bg-white" />
      <div className="card h-96 animate-pulse bg-white" />
    </div>
  );
}
