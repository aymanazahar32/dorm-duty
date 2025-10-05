import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-16 text-slate-100">
      <div className="text-center space-y-4 max-w-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">DormDuty Backend</p>
        <h1 className="text-4xl font-bold sm:text-5xl">API & Supabase Auth deployment is live.</h1>
        <p className="text-base text-slate-300 sm:text-lg">
          This Next.js app hosts the DormDuty API route handlers and Supabase authentication glue. Use the React
          dashboard to manage chores, or hit the API routes directly for integration tests.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/api/registerUser"
          className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-300"
        >
          Test registerUser endpoint
        </Link>
        <a
          href="https://github.com/aymanazahar32/dorm-duty"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
        >
          View source on GitHub
        </a>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left text-sm text-slate-300 shadow-lg">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-emerald-200">Key Routes</h2>
          <ul className="space-y-1">
            <li><code className="rounded bg-slate-800 px-2 py-1 text-emerald-300">POST /api/registerUser</code> &ndash; registers a Supabase user in the DormDuty DB.</li>
            <li><code className="rounded bg-slate-800 px-2 py-1 text-emerald-300">GET /api/tasks</code> &ndash; fetch room tasks (requires userId &amp; roomId query params).</li>
            <li><code className="rounded bg-slate-800 px-2 py-1 text-emerald-300">POST /api/tasks</code> &ndash; create a new task for the authenticated room.</li>
            <li><code className="rounded bg-slate-800 px-2 py-1 text-emerald-300">GET /api/leaderboard</code> &ndash; view aura leaderboard for a room.</li>
            <li><code className="rounded bg-slate-800 px-2 py-1 text-emerald-300">PATCH /api/laundry</code> &ndash; update washer/dryer assignments and timers.</li>
          </ul>
        </div>
        <p>
          Need the full dashboard? Deploy the React client under <code className="rounded bg-slate-800 px-2 py-1">frontend/</code> and
          point <code>REACT_APP_API_BASE_URL</code> to this deployment.
        </p>
      </div>
    </div>
  );
}
