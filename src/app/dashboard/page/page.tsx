import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Page() {
	const recentPage = await api.page.getLatest();

	if (!recentPage) return redirect("/dashboard/home");

	redirect(`/dashboard/page/${recentPage.id}`);
}
