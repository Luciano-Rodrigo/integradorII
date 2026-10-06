import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <SettingsClient adminName={user.name} />;
}
