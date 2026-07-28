"use client";

import { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "ttcrm-call-script";

const DEFAULT_SCRIPT = `Hi [First Name], this is [Your Name] with Transform Targets.

I'm reaching out because we work with facility maintenance and IFM teams on [pain point — staffing, response times, preventive maintenance]. Do you have 60 seconds?

If yes:
- Confirm their role / responsibility for facility vendors
- Ask about current pain points with their IFM provider
- Propose a short follow-up meeting

If voicemail:
"Hi [First Name], this is [Your Name] from Transform Targets. I'll follow up by email — talk soon!"

If not interested:
Thank them for their time, ask if there's a better time in the future to reconnect.`;

export function CallScriptPanel() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setScript(saved);
  }, []);

  function handleChange(value: string) {
    setScript(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Call script reference</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Textarea
          value={script}
          onChange={(e) => handleChange(e.target.value)}
          rows={20}
          className="h-full font-mono text-xs leading-relaxed"
        />
      </CardContent>
    </Card>
  );
}
