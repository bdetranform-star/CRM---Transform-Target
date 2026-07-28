import { listSmsTemplates } from "@/app/actions/sms-templates";
import { TemplateManager } from "@/components/sms-templates/template-manager";

export default async function SmsTemplatesPage() {
  const templates = await listSmsTemplates();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">SMS Templates</h1>
        <p className="text-sm text-muted-foreground">
          Reusable message templates. Use {"{{firstName}}"}, {"{{company}}"}, and{" "}
          {"{{industryDetail}}"} tokens — they&apos;re replaced with the contact&apos;s real
          data when composing.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <TemplateManager initialTemplates={templates} />
      </div>
    </div>
  );
}
