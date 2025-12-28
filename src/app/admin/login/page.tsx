// src/app/admin/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

// Server action: verify email+password with Supabase Auth
async function login(formData: FormData) {
  "use server";

  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error("Supabase auth error:", error?.message);
    redirect("/admin/login?error=invalid");
  }

  // Auth succeeded → mark this browser as admin for our app
  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "true", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // (Optional) store email for display/debug
  cookieStore.set("admin_email", email, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin/bookings");
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const search = await searchParams;
  const error = search.error;

  let message: string | null = null;
  if (error === "invalid") {
    message = "Invalid email or password. Please try again.";
  } else if (error === "missing") {
    message = "Please enter both email and password.";
  } else if (error === "server") {
    message = "Server error: admin password is not configured.";
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin login</h1>

      {message && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      )}

      <form action={login} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <button type="submit" className="border rounded px-4 py-2">
          Log in
        </button>
      </form>
    </main>
  );
}
