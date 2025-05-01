"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import ManageTeams from "@/components/basejump/manage-teams";
import { createClient } from "@/utils/supabase/client"; // Assuming this is the correct path

export default function PersonalAccountTeamsPage() {
  const [teams, setTeams] = useState<any[] | null>(null); // Use appropriate type for teams
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      const supabase = createClient();
      try {
        setLoading(true);
        setError(null);

        // Fetch the necessary data for ManageTeams. 
        // This might involve fetching accounts or teams directly.
        // Replace this example with the actual logic needed by ManageTeams.
        // Example: Fetching accounts using the rpc call likely used inside ManageTeams
        const { data, error: rpcError } = await supabase.rpc('get_accounts'); 

        if (rpcError) {
          throw rpcError;
        }
        // Assuming 'get_accounts' returns the list needed by ManageTeams
        setTeams(data || []); 
      } catch (err: any) {
        console.error("Erro ao buscar dados para times:", err);
        setError("Falha ao carregar os dados dos times.");
        setTeams([]); // Set to empty array on error to avoid issues in ManageTeams
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading) {
    return <div>Carregando configurações de times...</div>; // Or a skeleton loader
  }

  // Render ManageTeams only after loading is complete
  // Pass the fetched data (or empty array/null based on your ManageTeams component needs)
  return (
    <div>
      {/* Pass teams data to ManageTeams. Adjust prop name if needed. */} 
      {/* Ensure ManageTeams component itself does NOT fetch data if it receives it via props */}
      <ManageTeams initialTeams={teams} error={error} /> 
    </div>
  );
}

