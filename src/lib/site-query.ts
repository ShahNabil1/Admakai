import { queryOptions } from "@tanstack/react-query";
import { getPublicSiteDetails } from "./site.functions";
export const siteQueryOptions = queryOptions({ queryKey: ["public-site-details"], queryFn: () => getPublicSiteDetails(), staleTime: 300000 });