import { createFileRoute } from "@tanstack/react-router";
import { Route as ApplyRoute } from "./_site.careers.$slug.apply";
import { ApplicationPage } from "@/components/careers/ApplicationPage";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/_site/careers/$slug/apply/")({
  head: ({ params }) =>
    seoHead({
      title: "Apply for a role | Admakai",
      description:
        "Your secure seven-step Admakai application with portfolio, practical task and signature.",
      path: `/careers/${params.slug}/apply`,
      noindex: true,
    }),
  component: () => {
    const { slug } = Route.useParams();
    const { settings, title } = ApplyRoute.useLoaderData();
    return (
      <ApplicationPage
        slug={slug}
        googleEnabled={settings.google_login_enabled}
        publicTitle={title}
        whatsappHelpUrl={'whatsapp_help_url' in settings ? settings.whatsapp_help_url : null}
      />
    );
  },
});
