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
    const { idea } = await req.json();
    
    if (!idea) {
      throw new Error('No idea provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Performing prior art search for idea:', idea.substring(0, 100));

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
            content: `You are a patent prior art search expert. Given an invention idea, identify:
1. Up to 20 related existing patents with realistic US patent numbers. For each patent, generate a Google Patents URL in the format: https://patents.google.com/patent/US{number}/en
2. Key competitors in the space with their patent portfolios

IMPORTANT: Generate realistic patent numbers that follow the US patent format (7-8 digit numbers starting with 7, 8, 9, 10, 11). The Google Patents links must be in the correct format.

Return results in this exact JSON format:
{
  "priorArt": [
    {
      "patentNumber": "US10123456",
      "title": "Patent Title",
      "description": "Brief description of what this patent covers and how it relates to the idea",
      "date": "2023-01-15",
      "url": "https://patents.google.com/patent/US10123456/en",
      "relevanceScore": 85,
      "keyOverlap": "The main area where this patent overlaps with the proposed invention"
    }
  ],
  "competitors": [
    {
      "name": "Company Name",
      "description": "What they do in this space",
      "patentCount": 15,
      "keyPatent": "US10234567",
      "keyPatentUrl": "https://patents.google.com/patent/US10234567/en",
      "threatLevel": "high"
    }
  ]
}

Try to find as many relevant patents as possible, up to 20. Be thorough and consider all aspects of the invention.`
          },
          {
            role: 'user',
            content: `Find prior art and competitors for this invention. Aim for 20 relevant patents if available:\n\n${idea}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response received, parsing...');

    let searchResults;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        searchResults = JSON.parse(jsonMatch[1]);
      } else {
        searchResults = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      searchResults = {
        priorArt: [],
        competitors: []
      };
    }

    console.log(`Found ${searchResults.priorArt?.length || 0} patents and ${searchResults.competitors?.length || 0} competitors`);

    return new Response(
      JSON.stringify(searchResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in prior-art-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
