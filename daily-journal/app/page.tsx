import DailyThought from "./components/DailyThought";
//import competencies from "./api/competencies";

// page.tsx specifies the home page of a Next.js app
export default function Home() {
  return (
    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black sm:items-start">
        <DailyThought />
    </main>
  );
}
