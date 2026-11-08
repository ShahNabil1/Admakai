import { queryOptions } from "@tanstack/react-query";
import { getCareerJobs, getCareerDetail } from "./careers.functions";
export const careerJobsOptions = queryOptions({
  queryKey: ["careers", "public"],
  queryFn: () => getCareerJobs(),
  staleTime: 30000,
});
export const careerDetailOptions = (slug: string) =>
  queryOptions({
    queryKey: ["careers", "public", slug],
    queryFn: () => getCareerDetail({ data: { slug } }),
    staleTime: 30000,
  });
