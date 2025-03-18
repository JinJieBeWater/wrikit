export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-12 py-10 sm:px-page">
      <div className="mx-auto h-24 w-full max-w-3xl shrink-0 rounded-xl bg-muted/50" />
      <div className="mx-auto h-full w-full max-w-3xl grow rounded-xl bg-muted/50" />
    </div>
  );
}
