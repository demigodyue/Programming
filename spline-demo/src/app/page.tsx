import { SplineSceneBasic } from "@/components/spline-scene-basic";
import CardFanDemo from "@/components/card-fan-demo";

export default function Home() {
  return (
    <main className="dark flex flex-1 flex-col items-center justify-center gap-16 bg-zinc-950 p-6">
      <div className="w-full max-w-5xl">
        <SplineSceneBasic />
      </div>
      <CardFanDemo />
    </main>
  );
}
