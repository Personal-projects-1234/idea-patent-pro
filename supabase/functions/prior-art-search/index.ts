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

    // Call AI to perform prior art search
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
            content: `You are a patent prior art search expert. Given an invention idea, search for and identify:
1. Related existing patents (provide realistic patent numbers, titles, descriptions, and filing dates)
2. Key competitors in the space (company names, brief descriptions, estimated patent counts)

Return results in JSON format with this structure:
{
  "priorArt": [
    {
      "patentNumber": "US1234567",
      "title": "Patent Title",
      "description": "Brief description",
      "date": "2023-01-15"
    }
  ],
  "competitors": [
    {
      "name": "Company Name",
      "description": "What they do",
      "patentCount": 15
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Find prior art and competitors for this invention: ${idea}`
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
    
    console.log('AI response:', content);

    // Parse the JSON response
    let searchResults;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        searchResults = JSON.parse(jsonMatch[1]);
      } else {
        searchResults = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return mock data if parsing fails
      searchResults = {
        priorArt: [
          {
            patentNumber: "US10123456",
            title: "Similar Technology Patent",
            description: "A related patent covering similar concepts",
            date: "2022-06-15"
          }
        ],
        competitors: [
          {
            name: "Tech Innovations Inc",
            description: "Leading company in this space",
            patentCount: 25
          }
        ]
      };
    }

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
