import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="space-y-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Not in your lab book</h1>
      <p className="text-stone-700">
        This page doesn&apos;t exist, or it belongs to someone else&apos;s lab book. If someone sent you a recipe, open
        the link they sent.
      </p>
      <LinkButton href="/" variant="secondary">
        Back to your lab book
      </LinkButton>
    </main>
  );
}
