"use client";

import { useRef, useState } from "react";

type DemoUser = "manager" | "actor" | "dancer" | "unassigned";
type Result = { label: string; status: number; body: unknown };

const productionId = "prod-demo";
const scriptId = "script-demo";
const choreographyId = "choreography-demo";
const contractId = "contract-demo";

const users: Array<{ id: DemoUser; name: string; role: string }> = [
  { id: "manager", name: "Morgan Lee", role: "Manager" },
  { id: "actor", name: "Alex Rivera", role: "Actor" },
  { id: "dancer", name: "Sam Jordan", role: "Dancer" },
  { id: "unassigned", name: "Taylor Quinn", role: "Cast member · no assignment" },
];

const versions = [
  {
    id: "script-v1",
    content: "Opening scene: the company gathers backstage.",
    contentType: "text/plain",
    publishedAt: "2026-01-14T12:00:00Z",
  },
  {
    id: "script-v2",
    content: "Opening scene: the company gathers backstage. The curtain rises.",
    contentType: "text/plain",
    publishedAt: "2026-01-15T10:00:00Z",
  },
];

async function request(
  path: string,
  userId: DemoUser | null,
  method = "GET",
  body?: unknown,
): Promise<Result> {
  const response = await fetch(path, {
    method,
    headers: {
      ...(userId ? { "X-SetSafe-Test-User": userId } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { label: path, status: response.status, body: result };
}

function fixture() {
  return {
    users: [
      { id: "manager", rolesByProduction: { [productionId]: ["manager"] } },
      {
        id: "actor",
        rolesByProduction: { [productionId]: ["actor", "role-actors"] },
      },
      {
        id: "dancer",
        rolesByProduction: { [productionId]: ["dancer", "role-dancers"] },
      },
      {
        id: "unassigned",
        rolesByProduction: { [productionId]: ["actor"] },
      },
    ],
    productions: [{ id: productionId }],
    resources: [
      {
        id: scriptId,
        productionId,
        type: "script" as const,
        versions,
        currentVersionId: "script-v2",
      },
      {
        id: choreographyId,
        productionId,
        type: "choreography" as const,
        versions: [
          {
            id: "choreography-v1",
            content: "Rehearsal combination: step, turn, hold.",
            contentType: "video/mp4",
            publishedAt: "2026-01-14T12:00:00Z",
          },
        ],
        currentVersionId: "choreography-v1",
      },
      {
        id: contractId,
        productionId,
        type: "contract" as const,
        versions: [
          {
            id: "contract-v1",
            content: "Demo contract for review.",
            contentType: "text/plain",
            publishedAt: "2026-01-14T12:00:00Z",
          },
        ],
        currentVersionId: "contract-v1",
      },
    ],
    assignments: [
      { productionId, resourceId: scriptId, memberId: "actor" },
      { productionId, resourceId: choreographyId, roleId: "role-dancers" },
    ],
    signatures: [],
  };
}

function responseContent(body: unknown): string | undefined {
  if (
    typeof body === "object" &&
    body !== null &&
    "content" in body &&
    typeof body.content === "string"
  ) {
    return body.content;
  }
  return undefined;
}

export default function HomePage() {
  const [activeUser, setActiveUser] = useState<DemoUser>("actor");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Initialize the demo to load sample production data.",
  );
  const [results, setResults] = useState<Result[]>([]);
  const activityRef = useRef<HTMLElement>(null);

  async function run(label: string, operation: () => Promise<Result>) {
    setBusy(true);
    setMessage(label);
    try {
      const result = await operation();
      setResults((current) => [result, ...current]);
      setMessage(
        result.status >= 200 && result.status < 300
          ? `${label} completed (HTTP ${result.status}).`
          : `${label} returned HTTP ${result.status}.`,
      );
      requestAnimationFrame(() =>
        activityRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unexpected request failure.";
      setMessage(`${label} failed: ${detail}`);
    } finally {
      setBusy(false);
    }
  }

  async function initializeDemo() {
    setBusy(true);
    setMessage("Loading sample production…");
    try {
      const reset = await fetch("/__test/reset", { method: "POST" });
      if (!reset.ok) {
        throw new Error(
          "The demo fixture API is unavailable. Start Next.js with SETSAFE_E2E_TEST_MODE=1.",
        );
      }

      const seeded = await fetch("/__test/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixture()),
      });
      const result: unknown = await seeded.json();
      if (!seeded.ok) {
        throw new Error(`Fixture setup returned HTTP ${seeded.status}.`);
      }

      setReady(true);
      setResults([
        { label: "Sample production initialized", status: seeded.status, body: result },
      ]);
      setMessage("Demo ready. Choose a role and try an action.");
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unexpected setup failure.";
      setReady(false);
      setMessage(detail);
    } finally {
      setBusy(false);
    }
  }

  const activeName = users.find((user) => user.id === activeUser)?.name;

  return (
    <main className="min-h-screen bg-[#f5f4f0] text-[#202923]">
      <header className="border-b border-[#e2e2da] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <a className="flex items-center gap-3" href="#" aria-label="SetSafe home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#164e41] text-lg font-bold text-white">
              S
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">SetSafe</span>
              <span className="block text-xs text-[#66736d]">Production workspace</span>
            </span>
          </a>
          <span className="rounded-full border border-[#d6e5dc] bg-[#f1f8f3] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#24634d]">
            Interactive demo
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10 lg:py-12">
        <aside className="space-y-2" aria-label="Workspace navigation">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#829089]">
            Workspace
          </p>
          <a
            className="flex items-center gap-3 rounded-xl bg-[#e6eee8] px-3 py-3 text-sm font-semibold text-[#164e41]"
            href="#overview"
          >
            <span aria-hidden="true">▦</span> Overview
          </a>
          <a
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#66736d] hover:bg-white"
            href="#materials"
          >
            <span aria-hidden="true">▤</span> Materials
          </a>
          <a
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#66736d] hover:bg-white"
            href="#contracts"
          >
            <span aria-hidden="true">▧</span> Contracts
          </a>
          <a
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#66736d] hover:bg-white"
            href="#activity"
          >
            <span aria-hidden="true">◷</span> Activity
          </a>
          <div className="mt-8 rounded-2xl border border-[#e5e3dc] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#829089]">
              Demo mode
            </p>
            <p className="mt-2 text-sm leading-6 text-[#66736d]">
              Uses temporary sample data and test identities. No production data is
              stored.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-8">
          <div
            id="overview"
            className="flex flex-col justify-between gap-5 md:flex-row md:items-end"
          >
            <div>
              <p className="text-sm font-medium text-[#718078]">Friday, January 15</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Good morning, {activeName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
                A small working demo of production-scoped materials and contract
                access.
              </p>
            </div>
            <button
              className="rounded-xl bg-[#164e41] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#103d33] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={initializeDemo}
              disabled={busy}
            >
              {ready ? "Reset demo data" : "Initialize demo"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Production", value: "Northstar · Season 1", icon: "✦" },
              { label: "Your role", value: users.find((user) => user.id === activeUser)?.role, icon: "◉" },
              { label: "Current materials", value: "2 assigned", icon: "▤" },
            ].map((item) => (
              <div
                className="rounded-2xl border border-[#e5e3dc] bg-white p-5"
                key={item.label}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#718078]">{item.label}</p>
                  <span className="text-lg text-[#39816a]" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold">View as a production member</h2>
                <p className="mt-1 text-sm text-[#718078]">
                  Switch the test identity to demonstrate role-specific access.
                </p>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium">
                <span className="sr-only">Choose demo identity</span>
                <select
                  className="min-w-56 rounded-xl border border-[#d9ddd7] bg-white px-4 py-3 text-[#202923] outline-none focus:border-[#39816a] focus:ring-2 focus:ring-[#d6e5dc]"
                  value={activeUser}
                  onChange={(event) => {
                    const selectedUser = users.find(
                      (user) => user.id === event.target.value,
                    );
                    if (selectedUser) {
                      setActiveUser(selectedUser.id);
                    }
                  }}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.role}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section id="materials">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-[#718078]">Northstar · Season 1</p>
                <h2 className="mt-1 text-xl font-semibold">Assigned materials</h2>
              </div>
              <span className="text-sm text-[#718078]">Latest published versions</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ef] text-xl text-[#28634f]" aria-hidden="true">
                    ▤
                  </div>
                  <span className="rounded-full bg-[#edf6ef] px-3 py-1 text-xs font-semibold text-[#317250]">
                    Script · v2
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">Opening scene</h3>
                <p className="mt-1 text-sm text-[#718078]">
                  Assigned directly to Alex Rivera
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[#eeeee9] pt-4">
                  <span className="text-xs text-[#829089]">Updated Jan 15, 10:00 AM</span>
                  <button
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[#17644d] hover:bg-[#f1f8f3] disabled:opacity-50"
                    disabled={!ready || busy}
                    onClick={() =>
                      run("Open script", () =>
                        request(
                          `/api/productions/${productionId}/scripts/${scriptId}`,
                          activeUser,
                        ),
                      )
                    }
                  >
                    Open script <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>

              <article className="rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4eff9] text-xl text-[#77569a]" aria-hidden="true">
                    ▷
                  </div>
                  <span className="rounded-full bg-[#f4eff9] px-3 py-1 text-xs font-semibold text-[#77569a]">
                    Choreography · v1
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">Rehearsal combination</h3>
                <p className="mt-1 text-sm text-[#718078]">
                  Assigned to the Dancers role
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[#eeeee9] pt-4">
                  <span className="text-xs text-[#829089]">Published Jan 14, 12:00 PM</span>
                  <button
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[#17644d] hover:bg-[#f1f8f3] disabled:opacity-50"
                    disabled={!ready || busy}
                    onClick={() =>
                      run("Open choreography", () =>
                        request(
                          `/api/productions/${productionId}/choreography/${choreographyId}`,
                          activeUser,
                        ),
                      )
                    }
                  >
                    View material <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section
            id="contracts"
            className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"
          >
            <article className="rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#718078]">For cast review</p>
                  <h2 className="mt-1 text-lg font-semibold">Performance agreement</h2>
                  <p className="mt-1 text-sm text-[#718078]">Northstar · Contract v1</p>
                </div>
                <span className="rounded-full bg-[#fff5e5] px-3 py-1 text-xs font-semibold text-[#95651b]">
                  Ready to assign
                </span>
              </div>
              <div className="mt-5 rounded-xl bg-[#f8f8f5] p-4">
                <p className="text-sm leading-6 text-[#66736d]">
                  Demo contract for review. Contract creation and signature capture
                  are not part of this demo.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#718078]">Assign to Alex Rivera</p>
                <button
                  className="rounded-xl border border-[#cbd9d0] px-4 py-2.5 text-sm font-semibold text-[#17644d] hover:bg-[#f1f8f3] disabled:opacity-50"
                  disabled={!ready || busy || activeUser !== "manager"}
                  onClick={() =>
                    run("Assign contract", () =>
                      request(
                        `/api/productions/${productionId}/contracts/${contractId}/assignments`,
                        "manager",
                        "POST",
                        { assigneeIds: ["actor"] },
                      ),
                    )
                  }
                >
                  Assign &amp; notify
                </button>
              </div>
              {activeUser !== "manager" && (
                <p className="mt-3 text-xs text-[#829089]">
                  Switch to the manager identity to assign this contract.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6">
              <p className="text-sm font-medium text-[#718078]">Contract access</p>
              <h2 className="mt-1 text-lg font-semibold">Access check</h2>
              <p className="mt-2 text-sm leading-6 text-[#718078]">
                The current identity requests the contract. Assigned members are
                authorized; other production members are denied.
              </p>
              <button
                className="mt-5 w-full rounded-xl bg-[#164e41] px-4 py-3 text-sm font-semibold text-white hover:bg-[#103d33] disabled:opacity-50"
                disabled={!ready || busy}
                onClick={() =>
                  run("Check contract access", () =>
                    request(
                      `/api/productions/${productionId}/resources/${contractId}/access`,
                      activeUser,
                    ),
                  )
                }
              >
                Check access as {users.find((user) => user.id === activeUser)?.name}
              </button>
            </article>
          </section>

          <section
            id="activity"
            ref={activityRef}
            className="scroll-mt-6 rounded-2xl border border-[#e5e3dc] bg-white p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#718078]">Live API responses</p>
                <h2 className="mt-1 text-lg font-semibold">Demo activity</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="text-sm font-semibold text-[#17644d] hover:text-[#103d33] disabled:opacity-50"
                  disabled={!ready || busy}
                  onClick={() =>
                    run("Load notifications", () =>
                      request("/api/notifications", activeUser),
                    )
                  }
                >
                  View inbox
                </button>
                <button
                  className="text-sm font-medium text-[#718078] hover:text-[#17644d]"
                  onClick={() => setResults([])}
                  disabled={results.length === 0 || busy}
                >
                  Clear
                </button>
              </div>
            </div>
            <div
              aria-live="polite"
              className="mt-4 rounded-xl bg-[#f8f8f5] px-4 py-3 text-sm text-[#53635a]"
            >
              {busy && (
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#39816a]" />
              )}
              {message}
            </div>
            {results.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {results.map((result, index) => (
                  <li
                    className="overflow-hidden rounded-xl border border-[#e5e3dc]"
                    key={`${result.label}-${index}`}
                  >
                    <div className="flex items-center justify-between gap-3 bg-[#fbfbf9] px-4 py-3">
                      <p className="min-w-0 truncate text-sm font-semibold">{result.label}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          result.status >= 200 && result.status < 300
                            ? "bg-[#edf6ef] text-[#317250]"
                            : "bg-[#fff0ef] text-[#a63e36]"
                        }`}
                      >
                        HTTP {result.status}
                      </span>
                    </div>
                    {responseContent(result.body) !== undefined && (
                      <div className="border-b border-[#e5e3dc] px-4 py-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#829089]">
                          Material preview
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#202923]">
                          {responseContent(result.body)}
                        </p>
                      </div>
                    )}
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-xs leading-5 text-[#59675f]">
                      {JSON.stringify(result.body, null, 2)}
                    </pre>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[#829089]">
                Responses will appear here after you try an action.
              </p>
            )}
          </section>

          <p className="pb-6 text-xs leading-5 text-[#829089]">
            Demonstration only: sample in-memory data, test identities, and local
            API routes. Authentication, persistent storage, digital signatures,
            and real notification delivery are not represented.
          </p>
        </section>
      </div>
    </main>
  );
}
