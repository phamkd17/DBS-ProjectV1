import { NewDictationForm } from "./NewDictationForm";

export const metadata = { title: "New dictation · Culinary Lab Book" };

export default function NewDictationPage() {
  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-ls-serif text-5xl leading-none">New dictation</h1>
        <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
          Paste what the cook said, or tap the microphone on your keyboard and dictate. Mistakes are fine. Their words
          are saved exactly as they are.
        </p>
      </div>
      <NewDictationForm />
    </main>
  );
}
