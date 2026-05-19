import { redirect } from "next/navigation";

export const metadata = {
  title: "PECAT-E",
  description: "Translation quality assurance platform",
};

export default function Home() {
  redirect("/dashboard");
}
