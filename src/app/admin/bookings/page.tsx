// src/app/admin/bookings/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BookingWithVenue = {
  id: number;
  venue_id: number;
  requester_name: string;
  requester_email: string;
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  venues?: { name: string }[] | null;
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

// Allowed status values from the UI/query
const allowedStatuses = ["all", "pending", "approved", "rejected"] as const;
type StatusFilter = (typeof allowedStatuses)[number];

function isStatusFilter(value: string): value is StatusFilter {
  return (allowedStatuses as readonly string[]).includes(value);
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  // 🔐 Check admin cookie
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";
  const adminEmail = cookieStore.get("admin_email")?.value;

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const search = await searchParams;

  // ----- Filters from query string -----
  const rawStatus =
    typeof search.status === "string" ? search.status : "pending";

  const statusFilter: StatusFilter = isStatusFilter(rawStatus)
    ? rawStatus
    : "pending";

  const rawVenue =
    typeof search.venue === "string" ? search.venue : "all";
  const venueFilter = rawVenue === "" ? "all" : rawVenue;

  // We'll need this for redirecting back after updates
  const currentQuery = new URLSearchParams();
  if (statusFilter !== "pending") currentQuery.set("status", statusFilter);
  if (venueFilter !== "all") currentQuery.set("venue", venueFilter);
  const currentUrl =
    "/admin/bookings" +
    (currentQuery.toString() ? `?${currentQuery.toString()}` : "");

  // ----- Load venues for dropdown -----
  const { data: venues, error: venueError } = await supabase
    .from("venues")
    .select("id, name")
    .order("name", { ascending: true });

  if (venueError) {
    console.error("Error loading venues for filters:", venueError.message);
  }

  // ----- Load bookings with filters applied -----
  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      venue_id,
      requester_name,
      requester_email,
      event_date,
      start_time,
      end_time,
      status,
      notes,
      venues:venues(name)
    `
    )
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (venueFilter !== "all") {
    const venueIdNum = Number(venueFilter);
    if (!Number.isNaN(venueIdNum)) {
      query = query.eq("venue_id", venueIdNum);
    }
  }

  const { data: bookingsRaw, error } = await query;

  if (error) {
    console.error("Error loading bookings:", error.message);
  }

  const bookings = (bookingsRaw ?? []) as BookingWithVenue[];

  // ----- Server action: update booking status -----
  async function updateStatus(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_auth")?.value === "true";
    if (!isAdmin) {
      redirect("/admin/login");
    }

    const idRaw = formData.get("id");
    const status = formData.get("status") as string | null;
    const redirectTo = formData.get("redirectTo") as string | null;

    const id = typeof idRaw === "string" ? Number(idRaw) : NaN;

    if (!status || Number.isNaN(id)) {
      console.error("Invalid status update payload", { idRaw, status });
      return;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating status:", updateError.message);
    }

    redirect(redirectTo && redirectTo !== "" ? redirectTo : "/admin/bookings");
  }

  // ----- Server action: logout (clear cookie) -----
  async function logout() {
    "use server";

    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    cookieStore.set("admin_email", "", {
      httpOnly: false,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/admin/login");
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings (admin)</h1>
          {adminEmail && (
            <p className="text-xs text-gray-500">Logged in as {adminEmail}</p>
          )}
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="border rounded px-3 py-1 text-xs"
          >
            Log out
          </button>
        </form>
      </div>

      {/* Filters */}
      <form
        method="get"
        className="mb-4 flex flex-wrap items-end gap-3 text-sm"
      >
        <div>
          <label className="block mb-1 font-medium" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter}
            className="border rounded px-2 py-1"
          >
            <option value="pending">Pending (default)</option>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium" htmlFor="venue">
            Venue
          </label>
          <select
            id="venue"
            name="venue"
            defaultValue={venueFilter}
            className="border rounded px-2 py-1"
          >
            <option value="all">All venues</option>
            {venues?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="border rounded px-3 py-1 text-xs mt-5"
        >
          Apply filters
        </button>
      </form>

      {bookings.length === 0 ? (
        <p>No bookings found with these filters.</p>
      ) : (
        <table className="border-collapse w-full text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">ID</th>
              <th className="border px-2 py-1 text-left">Venue</th>
              <th className="border px-2 py-1 text-left">Requester</th>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Date</th>
              <th className="border px-2 py-1 text-left">Start</th>
              <th className="border px-2 py-1 text-left">End</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Notes</th>
              <th className="border px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const venueName =
                b.venues && b.venues.length > 0
                  ? b.venues[0].name
                  : `Venue #${b.venue_id}`;

              return (
                <tr key={b.id}>
                  <td className="border px-2 py-1">{b.id}</td>
                  <td className="border px-2 py-1">{venueName}</td>
                  <td className="border px-2 py-1">{b.requester_name}</td>
                  <td className="border px-2 py-1">{b.requester_email}</td>
                  <td className="border px-2 py-1">{b.event_date}</td>
                  <td className="border px-2 py-1">{b.start_time}</td>
                  <td className="border px-2 py-1">{b.end_time}</td>
                  <td className="border px-2 py-1 capitalize">{b.status}</td>
                  <td className="border px-2 py-1 whitespace-pre-wrap max-w-xs">
                    {b.notes ?? ""}
                  </td>
                  <td className="border px-2 py-1">
                    <div className="flex flex-wrap gap-2">
                      {/* Approve */}
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value="approved" />
                        <input type="hidden" name="redirectTo" value={currentUrl} />
                        <button
                          type="submit"
                          className="border rounded px-2 py-1 text-xs"
                        >
                          Approve
                        </button>
                      </form>

                      {/* Reject */}
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <input type="hidden" name="redirectTo" value={currentUrl} />
                        <button
                          type="submit"
                          className="border rounded px-2 py-1 text-xs"
                        >
                          Reject
                        </button>
                      </form>

                      {/* Reset to pending */}
                      {b.status !== "pending" && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="status" value="pending" />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={currentUrl}
                          />
                          <button
                            type="submit"
                            className="border rounded px-2 py-1 text-xs"
                          >
                            Reset
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
