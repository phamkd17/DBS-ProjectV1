import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="space-y-6 py-6">
      <h1 className="font-ls-serif text-5xl leading-none">Not in your lab book</h1>
      <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
        This page doesn&apos;t exist, or it belongs to someone else&apos;s lab book. If someone sent you a recipe, open
        the link they sent.
      </p>
      <LinkButton href="/" variant="secondary">
        Back to your lab book
      </LinkButton>
    </main>
  );
}
