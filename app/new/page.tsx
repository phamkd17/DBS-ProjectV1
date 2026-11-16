import { NewDictationForm } from "./NewDictationForm";

export const metadata = { title: "New dictation · Culinary Lab Book" };

export default async function NewDictationPage({ searchParams }: PageProps<"/new">) {
  const { dish } = await searchParams;
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-ls-serif text-5xl leading-none">New dictation</h1>
        <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
          Have the cook dictate how they make the dish: the ingredients, then each step in detail. Tap the microphone on
          your keyboard, or paste what they said. Mistakes are fine. The AI will format it into a recipe anyone can repeat.
        </p>
      </div>
      <NewDictationForm defaultDish={typeof dish === "string" ? dish.slice(0, 120) : ""} />
    </main>
  );
}
