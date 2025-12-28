// src/app/thank-you/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ThankYouPage({ searchParams }: Props) {
  const search = await searchParams;

  const name =
    typeof search.name === "string" && search.name.trim() !== ""
      ? search.name
      : undefined;

  const eventDate =
    typeof search.event_date === "string" ? search.event_date : undefined;
  const startTime =
    typeof search.start === "string" ? search.start : undefined;
  const endTime = typeof search.end === "string" ? search.end : undefined;

  const venueIdStr =
    typeof search.venue === "string" ? search.venue : undefined;
  const venueId = venueIdStr ? Number(venueIdStr) : undefined;

  let venueName: string | undefined;
  let venueAddress: string | undefined;

  if (venueId && !Number.isNaN(venueId)) {
    const { data, error } = await supabase
      .from("venues")
      .select("name, address")
      .eq("id", venueId)
      .single();

    if (error) {
      console.error("Error loading venue for thank-you page:", error.message);
    } else if (data) {
      venueName = data.name ?? undefined;
      venueAddress = data.address ?? undefined;
    }
  }

  const hasSummary = eventDate || startTime || endTime || venueName;

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Success panel */}
      <section className="rounded border border-green-500 bg-green-50 px-4 py-3">
        <h1 className="text-2xl font-bold mb-1">
          Thank you{venueName || name ? "," : ""}{" "}
          {name ? name : venueName ? "" : ""}
        </h1>
        <p className="text-sm text-green-900">
          Your booking request has been received. Chamber staff will review it
          and contact you by email with a confirmation or any follow-up
          questions.
        </p>
      </section>

      {/* Summary */}
      {hasSummary && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Request summary</h2>
          <dl className="text-sm space-y-1">
            {venueName && (
              <div>
                <dt className="font-medium inline">Venue:</dt>
                <dd className="inline ml-1">
                  {venueName}
                  {venueAddress ? ` — ${venueAddress}` : ""}
                </dd>
              </div>
            )}
            {eventDate && (
              <div>
                <dt className="font-medium inline">Date:</dt>
                <dd className="inline ml-1">{eventDate}</dd>
              </div>
            )}
            {startTime && (
              <div>
                <dt className="font-medium inline">Start time:</dt>
                <dd className="inline ml-1">{startTime}</dd>
              </div>
            )}
            {endTime && (
              <div>
                <dt className="font-medium inline">End time:</dt>
                <dd className="inline ml-1">{endTime}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-gray-600 mt-2">
            If any of these details are incorrect, please submit a new request
            or contact the Chamber directly.
          </p>
        </section>
      )}

      {/* Actions */}
      <section className="space-x-3">
        <Link
          href="/"
          className="inline-block border rounded px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200"
        >
          Back to homepage
        </Link>
        <Link
          href="/venues"
          className="inline-block text-xs text-gray-600 underline"
        >
          Make another request
        </Link>
      </section>
    </main>
  );
}
