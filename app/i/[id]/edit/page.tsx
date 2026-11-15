import Link from "next/link";
import { notFound } from "next/navigation";
import { IdeaForm } from "@/components/IdeaForm";
import { eyebrow, textLink } from "@/components/ui";
import { supabaseForUser } from "@/lib/supabase/server";
import type { IdeaRow } from "@/lib/types";

export default async function EditIdeaPage({ params }: PageProps<"/i/[id]/edit">) {
  const { id } = await params;
  const supabase = await supabaseForUser();
  const { data: idea } = await supabase.from("ideas").select("*").eq("id", id).maybeSingle<IdeaRow>();
  if (!idea) notFound();

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className={eyebrow}>
          <Link href={`/i/${idea.id}`} className={textLink}>
            Back to idea
          </Link>
        </p>
        <h1 className="font-ls-serif text-5xl leading-none">Edit idea</h1>
      </div>
      <IdeaForm idea={idea} />
    </main>
  );
}
