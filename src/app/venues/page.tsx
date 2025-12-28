import { supabase } from "@/lib/supabaseClient";

export default async function VenuesPage() {
  const { data: venues, error } = await supabase
    .from("venues")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading venues:", error.message);
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Available venues</h1>

      {!venues || venues.length === 0 ? (
        <p>No venues found.</p>
      ) : (
        <ul className="space-y-3">
          {venues.map((v) => (
            <li key={v.id} className="border rounded p-4">
              <div className="font-semibold text-lg">{v.name}</div>
              <div>Capacity: {v.capacity ?? "N/A"} people</div>
              <div>Address: {v.address ?? "N/A"}</div>
              <a
                href={`/venues/${v.id}`}
                className="inline-block mt-2 underline"
              >
                View details / request booking
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}