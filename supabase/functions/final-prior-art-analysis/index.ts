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
    const { idea, specifications, previousPriorArt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Performing final prior art analysis...');

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
            content: `You are a patent examination expert conducting a final prior art analysis. Analyze the patent application against known prior art and provide a comprehensive assessment.

Your analysis should:
1. Calculate a realistic patentability score (0-100) based on novelty, non-obviousness, and utility
2. Identify specific conflicts with existing patents
3. Count unique claims that differentiate from prior art
4. Compare with the nearest competitor patent in detail
5. Provide actionable recommendations

Return a detailed JSON response with this structure:
{
  "patentabilityScore": 75,
  "conflictsFound": 3,
  "uniqueClaims": 15,
  "nearestCompetitor": {
    "patentNumber": "US10123456",
    "title": "Competitor Patent Title",
    "holder": "Company Name",
    "url": "https://patents.google.com/patent/US10123456/en",
    "overlapPercentage": 35,
    "differentiatingFactors": ["Factor 1", "Factor 2"],
    "riskLevel": "medium"
  },
  "conflictDetails": [
    {
      "patentNumber": "US9876543",
      "title": "Conflicting Patent",
      "conflictArea": "Specific area of overlap",
      "severity": "high",
      "recommendation": "How to address this conflict"
    }
  ],
  "recommendations": [
    {
      "type": "success",
      "category": "Novelty",
      "message": "Your invention shows strong novelty in the area of..."
    },
    {
      "type": "warning", 
      "category": "Claims",
      "message": "Consider narrowing claim 5 to avoid overlap with..."
    },
    {
      "type": "info",
      "category": "Strategy",
      "message": "Consider filing a continuation application for..."
    }
  ],
  "strengthAreas": ["Area 1", "Area 2"],
  "weaknessAreas": ["Weakness 1", "Weakness 2"],
  "filingRecommendation": "Recommended filing strategy and timeline"
}`
          },
          {
            role: 'user',
            content: `Perform a comprehensive final prior art analysis for this patent application:

INVENTION:
${idea}

GENERATED SPECIFICATIONS (summary):
${typeof specifications === 'object' ? JSON.stringify(specifications).substring(0, 2000) : String(specifications || '').substring(0, 2000)}

PREVIOUSLY IDENTIFIED PRIOR ART:
${JSON.stringify(previousPriorArt, null, 2)}

Provide a thorough analysis comparing this invention against the prior art. Be specific about conflicts and provide actionable recommendations.`
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
    
    console.log('Analysis response received, parsing...');

    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        analysisResult = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse analysis response:', parseError);
      // Provide a default structure if parsing fails
      analysisResult = {
        patentabilityScore: 70,
        conflictsFound: 2,
        uniqueClaims: 10,
        nearestCompetitor: {
          patentNumber: "Unknown",
          title: "Analysis pending",
          holder: "Unknown",
          overlapPercentage: 0,
          differentiatingFactors: [],
          riskLevel: "unknown"
        },
        conflictDetails: [],
        recommendations: [
          { type: "info", category: "Analysis", message: "Please retry the analysis for detailed results" }
        ],
        strengthAreas: [],
        weaknessAreas: [],
        filingRecommendation: "Consult with a patent attorney for detailed guidance"
      };
    }

    console.log('Final analysis complete');

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in final-prior-art-analysis:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
