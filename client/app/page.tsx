import { useState } from "react";
import CaseSummaryPanel from "@/components/CaseSummaryPanel";

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
