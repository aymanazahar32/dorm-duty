
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function TestPage() {
  const [status, setStatus] = useState("Testing Supabase...");

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.getSession();
      if (error) setStatus("failed " + error.message);
      else setStatus(" Supabase Connected");
    })();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center text-xl">
      {status}
    </div>
  );
}
