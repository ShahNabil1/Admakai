import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface TableResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useSupabaseTable<T>(table: string): TableResult<T> {
  const [state, setState] = useState<TableResult<T>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    supabase
      .from(table)
      .select("*")
      .then(({ data, error }) => {
        if (!active) return;
        setState({
          data: (data as T[] | null) ?? [],
          loading: false,
          error: error ? new Error(error.message) : null,
        });
      });
    return () => {
      active = false;
    };
  }, [table]);

  return state;
}
