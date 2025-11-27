import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, priorArt, competitors, answers } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating patent specifications');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Generate complete patent specifications in professional format. Include:
- Title
- Background
- Summary of Invention
- Detailed Description
- Claims (numbered)
- Abstract

Return JSON: {"provisional": "text", "complete": "text", "images": []}`
          },
          {
            role: 'user',
            content: `Idea: ${idea}\nPrior Art: ${JSON.stringify(priorArt)}\nAnswers: ${JSON.stringify(answers)}`
          }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      result = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
    } catch {
      result = {
        provisional: content,
        complete: content,
        images: []
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
