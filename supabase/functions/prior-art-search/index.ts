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
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are a patent prior art search expert with access to patent databases. Given an invention idea, search for and identify REAL existing patents.

IMPORTANT INSTRUCTIONS:
1. Search for REAL patents from Google Patents database
2. Use ACTUAL patent numbers that exist (US patents typically: US + 7-11 digits, or US + year + 7 digits like US20230123456A1)
3. All URLs must be in the exact format: https://patents.google.com/patent/[PATENT_NUMBER]/en
4. Find up to 20 conflicting/related patents
5. Include patents from major companies like Google, Apple, Microsoft, Amazon, IBM, Samsung, etc.

PATENT NUMBER FORMATS TO USE:
- US utility patents: US7123456, US8234567, US9345678, US10456789, US11567890
- US published applications: US20200123456A1, US20210234567A1, US20220345678A1, US20230456789A1
- International: WO2020123456A1, EP3456789A1

Return results in this EXACT JSON format:
{
  "priorArt": [
    {
      "patentNumber": "US10123456B2",
      "title": "Exact Patent Title",
      "description": "Detailed description of what this patent covers and how it relates to the proposed invention",
      "date": "2020-03-15",
      "url": "https://patents.google.com/patent/US10123456B2/en",
      "relevanceScore": 85,
      "keyOverlap": "Specific technical feature that overlaps with the proposed invention",
      "assignee": "Company Name"
    }
  ],
  "competitors": [
    {
      "name": "Company Name",
      "description": "What they do in this technology space",
      "patentCount": 25,
      "keyPatent": "US10234567B2",
      "keyPatentUrl": "https://patents.google.com/patent/US10234567B2/en",
      "threatLevel": "high",
      "keyProducts": "Related products they sell"
    }
  ]
}

Find 20 relevant patents if possible. Be thorough and search across all relevant patent classifications.`
          },
          {
            role: 'user',
            content: `Search for prior art patents related to this invention idea. Find up to 20 conflicting or related patents:

INVENTION:
${idea}

Return real patent numbers with working Google Patents URLs.`
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
        // Try to find JSON in the response
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          searchResults = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        } else {
          searchResults = JSON.parse(content);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      searchResults = {
        priorArt: [],
        competitors: []
      };
    }

    // Validate and fix URLs
    if (searchResults.priorArt) {
      searchResults.priorArt = searchResults.priorArt.map((patent: any) => {
        // Ensure URL format is correct
        if (patent.patentNumber && !patent.url) {
          patent.url = `https://patents.google.com/patent/${patent.patentNumber}/en`;
        }
        // Fix URL if it doesn't have the correct format
        if (patent.url && !patent.url.includes('patents.google.com')) {
          patent.url = `https://patents.google.com/patent/${patent.patentNumber}/en`;
        }
        return patent;
      });
    }

    if (searchResults.competitors) {
      searchResults.competitors = searchResults.competitors.map((competitor: any) => {
        if (competitor.keyPatent && !competitor.keyPatentUrl) {
          competitor.keyPatentUrl = `https://patents.google.com/patent/${competitor.keyPatent}/en`;
        }
        return competitor;
      });
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
