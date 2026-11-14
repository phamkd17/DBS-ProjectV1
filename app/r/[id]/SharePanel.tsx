"use client";

import { useState, useTransition } from "react";
import { setSharing } from "@/app/actions";
import { Button, Spinner } from "@/components/ui";

export function SharePanel({ recipeId, url, title }: { recipeId: string; url: string | null; title: string }) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const toggle = (on: boolean) => start(() => setSharing(recipeId, on));

  return (
    <section aria-labelledby="send" className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <h2 id="send" className="text-lg font-semibold">
        Send this recipe
      </h2>

      {!url ? (
        <>
          <p className="text-sm text-stone-700">
            Make a private link to text or email. Anyone with the link can read this recipe and save a copy to their
            own lab book. You can turn the link off at any time.
          </p>
          <Button onClick={() => toggle(true)} disabled={pending}>
            {pending && <Spinner />} Make a link
          </Button>
        </>
      ) : (
        <>
          <label htmlFor="share-url" className="block text-sm font-medium">
            Private link
          </label>
          <input
            id="share-url"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({ title, text: `Here's the recipe for ${title}`, url }).catch(() => {});
                } else {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                }
              }}
            >
              Send…
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </Button>
            <Button variant="quiet" onClick={() => toggle(false)} disabled={pending}>
              {pending && <Spinner />} Turn off link
            </Button>
          </div>
          <p aria-live="polite" className="text-sm text-stone-600">
            {copied ? "Link copied. Paste it into a text or email." : "Only people you send it to will have the link."}
          </p>
        </>
      )}
    </section>
  );
}
