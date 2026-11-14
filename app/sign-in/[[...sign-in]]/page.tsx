import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex justify-center px-4 py-10">
      <SignIn />
    </main>
  );
}
