import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CortexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login');
  }

  return <CortexClient />;

}
