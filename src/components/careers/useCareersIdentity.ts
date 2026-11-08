import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { getSignedInCareers } from "@/lib/careers.functions";
export function useCareersIdentity(slug?: string) {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);
  const read = useServerFn(getSignedInCareers);
  return useQuery({
    queryKey: ["careers", "identity", user, slug],
    queryFn: () => read({ data: { slug } }),
    enabled: !!user,
    staleTime: 30000,
    retry: false,
  });
}
