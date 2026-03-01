import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, boardContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت مساعد ذكي متخصص في مساعدة الطلاب وإدارة اللوحة الدراسية.
قدراتك:
- تحليل محتوى اللوحة (ملاحظات، مهام، صور، خرائط ذهنية)
- اقتراح تحسينات تلقائية (ترتيب المهام، تجميع الملاحظات)
- الإجابة على أسئلة الطلاب واقتراح محتوى تعليمي
- توليد عناصر جديدة وتعديل العناصر الحالية وحذفها
- ترتيب عناصر اللوحة تلقائيًا لتقليل الازدحام

عند تنفيذ أي إجراء على اللوحة استخدم تنسيق ACTION فقط:
[ACTION:CREATE_TODO]{"title":"عنوان","items":["مهمة 1","مهمة 2"]}[/ACTION]
[ACTION:CREATE_NOTE]{"title":"عنوان","content":"محتوى"}[/ACTION]
[ACTION:CREATE_MINDMAP]{"title":"عنوان","nodes":["فكرة 1","فكرة 2","فكرة 3"]}[/ACTION]
[ACTION:UPDATE_ELEMENT]{"id":"element-id","updates":{"title":"عنوان جديد","content":"محتوى"}}[/ACTION]
[ACTION:DELETE_ELEMENT]{"id":"element-id"}[/ACTION]
[ACTION:ARRANGE_BOARD]{"mode":"balanced"}[/ACTION]

تعليمات مهمة:
- لا تستخدم رموز مشوهة أو نص غير مفهوم.
- اجعل الرد الطبيعي مختصرًا وواضحًا، ثم أضف ACTION blocks عند الحاجة.
- إذا لم تتوفر id دقيقة، اطلب من الطالب تأكيد العنصر قبل الحذف/التعديل.
- أجب دائمًا باللغة التي يستخدمها الطالب.
${boardContext ? `\nمحتوى اللوحة الحالية:\n${boardContext}` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
