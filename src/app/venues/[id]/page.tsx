// src/app/venues/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { DayAvailabilityCalendar } from "@/components/DayAvailabilityCalendar";
import { sendBookingConfirmationEmail } from "@/lib/email";


type PageParams = {
  id: string;
};

type PageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type VenueDetailPageProps = {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
};

function todayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

function conflictMessage(flag: string | string[] | undefined) {
  if (flag === "1") {
    return "This venue is already booked or requested for that day. Please choose a different date.";
  }
  if (flag === "missing") {
    return "Please fill in all required fields.";
  }
  if (flag === "insert") {
    return "There was an error saving your booking. Please try again.";
  }
  if (flag === "past") {
    return "You cannot book events in the past. Please select a future date.";
  }
  return null;
}

export default async function VenueDetailPage({
  params,
  searchParams,
}: VenueDetailPageProps) {
  const { id } = await params;
  const search = await searchParams;

  const numericId = Number(id);
  if (Number.isNaN(numericId)) return notFound();

  const conflictFlag = search.conflict;
  const selectedDateFromUrl =
    typeof search.event_date === "string" ? search.event_date : undefined;

  // Load venue from Supabase
  const { data: venue, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error) {
    console.error("Error loading venue:", error.message);
  }
  if (!venue) return notFound();

  // Load future bookings for this venue (next ~60 days)
  const today = todayYMD();
  const end = new Date();
  end.setMonth(end.getMonth() + 2);
  const endYMD = end.toISOString().slice(0, 10);

  const { data: futureBookings, error: fbError } = await supabase
    .from("bookings")
    .select("event_date")
    .eq("venue_id", numericId)
    .in("status", ["pending", "approved"])
    .gte("event_date", today)
    .lte("event_date", endYMD);

  if (fbError) {
    console.error("Error loading future bookings:", fbError.message);
  }

  const bookedDates = Array.from(
    new Set((futureBookings ?? []).map((b) => b.event_date as string))
  );

  const initialSelected =
    selectedDateFromUrl ?? (bookedDates.includes(today) ? "" : today);

  const message = conflictMessage(conflictFlag);

  // Server action to create a booking with day-level conflict checking
  // inside src/app/venues/[id]/page.tsx

  // Server action to create a booking with day-level conflict checking
  async function createBooking(formData: FormData) {
    "use server";

    const requesterName = formData.get("requester_name") as string | null;
    const requesterEmail = formData.get("requester_email") as string | null;
    const eventDate = formData.get("event_date") as string | null;
    const startTime = formData.get("start_time") as string | null;
    const endTime = formData.get("end_time") as string | null;
    const notes = formData.get("notes") as string | null;

    const todayServer = new Date().toISOString().slice(0, 10);

    if (!requesterName || !requesterEmail || !eventDate || !startTime || !endTime) {
      console.error("Missing required fields", {
        requesterName,
        requesterEmail,
        eventDate,
        startTime,
        endTime,
      });
      redirect(`/venues/${numericId}?conflict=missing&event_date=${eventDate ?? ""}`);
    }

    // At this point TS still sees these as string | null, so we cast:
    const safeName = requesterName as string;
    const safeEventDate = eventDate as string;
    const safeStartTime = startTime as string;
    const safeEndTime = endTime as string;

    // Block past dates on the server side too
    if (safeEventDate < todayServer) {
      console.error("Attempt to book in the past:", safeEventDate);
      redirect(`/venues/${numericId}?conflict=past&event_date=${todayServer}`);
    }

    // Check if this day already has any pending/approved booking
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("venue_id", numericId)
      .eq("event_date", safeEventDate)
      .in("status", ["pending", "approved"]);

    if (existingError) {
      console.error("Error checking existing bookings:", existingError.message);
    } else if (existing && existing.length > 0) {
      redirect(`/venues/${numericId}?conflict=1&event_date=${safeEventDate}`);
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      venue_id: numericId,
      requester_name: safeName,
      requester_email: requesterEmail,
      event_date: safeEventDate,
      start_time: safeStartTime,
      end_time: safeEndTime,
      notes,
      status: "pending",
    });

    if (insertError) {
      console.error("Error creating booking:", insertError.message);
      redirect(`/venues/${numericId}?conflict=insert&event_date=${safeEventDate}`);
    }

    // ✅ Try to send confirmation email (but don't break the flow if it fails)
    try {
      if (requesterEmail) {
        await sendBookingConfirmationEmail({
          to: requesterEmail,
          requesterName: safeName,
          venueName: venue.name as string,
          venueAddress: venue.address ?? undefined,
          eventDate: safeEventDate,
          startTime: safeStartTime,
          endTime: safeEndTime,
        });
      }
    } catch (emailErr) {
      console.error("Error sending booking confirmation email:", emailErr);
    }
    
    const params = new URLSearchParams({
      venue: String(numericId),
      name: safeName,
      event_date: safeEventDate,
      start: safeStartTime,
      end: safeEndTime,
    });

    redirect(`/thank-you?${params.toString()}`);
  }


  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">{venue.name}</h1>
      <p className="mb-1">Capacity: {venue.capacity ?? "N/A"} people</p>
      <p className="mb-1">Address: {venue.address ?? "N/A"}</p>
      <p className="mb-4">{venue.description}</p>

      {message && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">Request a booking</h2>
      <form className="space-y-4 max-w-md" action={createBooking}>
        <div>
          <h3 className="text-sm font-medium mb-1">Select an available day</h3>
          <DayAvailabilityCalendar
            bookedDates={bookedDates}
            initialSelectedDate={initialSelected || today}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="requester_name">
            Your name
          </label>
          <input
            id="requester_name"
            name="requester_name"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="requester_email">
            Your email
          </label>
          <input
            id="requester_email"
            name="requester_email"
            type="email"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="start_time">
            Start time
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="end_time">
            End time
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            className="border rounded px-2 py-1 w-full"
            rows={3}
            placeholder="Extra details about the event, setup requirements, etc."
          />
        </div>

        <button type="submit" className="border rounded px-4 py-2">
          Send request
        </button>
      </form>
    </main>
  );
}
