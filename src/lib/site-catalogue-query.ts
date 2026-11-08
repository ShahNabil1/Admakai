import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getSiteCatalogue } from './site-content.functions';
import { applyCatalogue } from './site-content';
export const siteCatalogueQueryKey = ['site-catalogue'] as const;
/** Short freshness so admin edits show up on the next page load or refresh. */
export const siteCatalogueQueryOptions = queryOptions({ queryKey: siteCatalogueQueryKey, queryFn: () => getSiteCatalogue(), staleTime: 30_000 });
/** Primes and applies the editable service/plan catalogue before any loader, head or component reads it. */
export async function ensureCatalogue(queryClient: QueryClient) {
  const catalogue = await queryClient.ensureQueryData(siteCatalogueQueryOptions);
  applyCatalogue(catalogue);
  return catalogue;
}
