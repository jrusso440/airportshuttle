import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const sess = getSession();
  if (!sess) redirect("/login");
  if (sess.role === "DRIVER") redirect("/driver");
  redirect("/schedule");
}
