import { notFound } from "next/navigation";

import { getContactDetail } from "@/app/actions/contacts";
import { getContactChatMessages } from "@/app/actions/contact-insights";
import { ContactDetailPageView } from "@/components/contact-detail/contact-detail-page-view";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactDetail(id);
  if (!contact) notFound();

  const chatMessages = await getContactChatMessages(id);

  return <ContactDetailPageView contact={contact} initialChatMessages={chatMessages} />;
}
