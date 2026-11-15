import Link from "next/link";
import { IdeaForm } from "@/components/IdeaForm";
import { eyebrow, textLink } from "@/components/ui";

export const metadata = { title: "New idea · Culinary Lab Book" };

export default function NewIdeaPage() {
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className={eyebrow}>
          <Link href="/?tab=ideas" className={textLink}>
            Ideas
          </Link>
        </p>
        <h1 className="font-ls-serif text-5xl leading-none">New idea</h1>
        <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
          Jot down something to try later: a dish you tasted, a technique, a link. You can turn it into a recipe
          whenever you&apos;re ready.
        </p>
      </div>
      <IdeaForm />
    </main>
  );
}
