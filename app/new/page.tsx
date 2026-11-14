import { NewDictationForm } from "./NewDictationForm";

export const metadata = { title: "New dictation · Culinary Lab Book" };

export default function NewDictationPage() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New dictation</h1>
        <p className="text-stone-700">
          Paste what the cook said, or tap the microphone on your keyboard and dictate. Mistakes are fine. Their words
          are saved exactly as they are.
        </p>
      </div>
      <NewDictationForm />
    </main>
  );
}
