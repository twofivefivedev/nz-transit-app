export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="border-2 border-black bg-white p-8 shadow-sharp">
        <h1 className="mb-4 text-4xl font-bold uppercase tracking-tight">
          METLINK VNEXT
        </h1>
        <p className="mb-6 text-lg uppercase text-zinc-600">
          REAL-TIME TRANSIT FOR WELLINGTON
        </p>
        <div className="flex gap-4">
          <div className="border-2 border-black bg-zinc-100 px-4 py-2">
            <span className="text-sm uppercase">TRAIN</span>
          </div>
          <div className="border-2 border-black bg-zinc-100 px-4 py-2">
            <span className="text-sm uppercase">BUS</span>
          </div>
        </div>
      </div>
    </main>
  );
}


