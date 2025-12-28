// src/app/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Venue = {
  id: number;
  name: string;
  address: string | null;
  capacity: number | null;
  description: string | null;
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: Props) {
  const search = await searchParams;

  const q =
    typeof search.q === "string" && search.q.trim() !== ""
      ? search.q.trim()
      : undefined;

  const minCapStr =
    typeof search.minCapacity === "string" ? search.minCapacity : undefined;
  const maxCapStr =
    typeof search.maxCapacity === "string" ? search.maxCapacity : undefined;

  const minCapacity = minCapStr ? Number(minCapStr) : undefined;
  const maxCapacity = maxCapStr ? Number(maxCapStr) : undefined;

  // Build Supabase query with filters
  let query = supabase
    .from("venues")
    .select("id, name, address, capacity, description")
    .order("name", { ascending: true });

  if (typeof minCapacity === "number" && !Number.isNaN(minCapacity)) {
    query = query.gte("capacity", minCapacity);
  }

  if (typeof maxCapacity === "number" && !Number.isNaN(maxCapacity)) {
    query = query.lte("capacity", maxCapacity);
  }

  if (q) {
    // Basic text search on name OR address
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading venues for homepage:", error.message);
  }

  const venues = (data ?? []) as Venue[];

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Community venue booking for the Chamber
        </h1>
        <p className="text-base md:text-lg text-gray-700">
          A simple way for residents, associations, and businesses to request{" "}
          city-owned spaces for meetings, events, and activities.
        </p>

        <div className="flex flex-wrap gap-3 mt-2">
          {/* kept as an <a> so it still jumps to the #venues section */}
          <a
            href="#venues"
            className="border rounded px-4 py-2 text-sm md:text-base bg-black text-white hover:bg-gray-900"
          >
            Browse available venues
          </a>
          <Link
            href="/admin/login"
            className="text-xs md:text-sm text-gray-600 underline"
          >
            Admin login
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm md:text-base text-gray-800">
          <li>Choose a venue that fits your event size and needs.</li>
          <li>
            Select an available day and time, then submit a booking request.
          </li>
          <li>
            The Chamber reviews your request and confirms or contacts you with
            any questions.
          </li>
        </ol>
      </section>

      {/* Filters + venues */}
      <section id="venues" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Venues you can request</h2>
        </div>

        {/* Filter form (GET) */}
        <form
          method="get"
          className="border rounded p-4 flex flex-wrap gap-4 text-sm bg-white"
        >
          <div>
            <label className="block mb-1 font-medium" htmlFor="q">
              Search
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Name or address"
              className="w-48"
              type="text"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="minCapacity">
              Min capacity
            </label>
            <Input
              id="minCapacity"
              name="minCapacity"
              type="number"
              min={0}
              defaultValue={minCapacity ?? ""}
              className="w-28"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="maxCapacity">
              Max capacity
            </label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              min={0}
              defaultValue={maxCapacity ?? ""}
              className="w-28"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="text-xs"
            >
              Apply filters
            </Button>
            <Link href="/" className="text-xs text-gray-600 underline">
              Reset
            </Link>
          </div>
        </form>

        {/* Results */}
        {venues.length === 0 ? (
          <p className="text-sm text-gray-700 mt-2">
            No venues match these filters.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-2">
            {venues.map((v) => (
              <div
                key={v.id}
                className="border rounded p-4 flex flex-col justify-between bg-white"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-1">{v.name}</h3>
                  <p className="text-sm text-gray-700 mb-1">
                    {v.address ?? "Address not specified"}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    Capacity:{" "}
                    {typeof v.capacity === "number"
                      ? `${v.capacity} people`
                      : "Not specified"}
                  </p>
                  {v.description && (
                    <p className="text-sm text-gray-700 mt-1">
                      {v.description}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  <Link
                    href={`/venues/${v.id}`}
                    className="inline-block border rounded px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    View details & request booking
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      <section className="pt-4 border-t text-xs text-gray-500">
        <p>
          Submitting a request does not guarantee availability until it is
          reviewed and approved by Chamber staff.
        </p>
      </section>
    </main>
  );
}
