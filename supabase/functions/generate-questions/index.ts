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
    const { idea, priorArt, competitors } = await req.json();
    
    if (!idea) {
      throw new Error('No idea provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating questions for patent idea');

    // Call AI to generate targeted yes/no questions
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
            content: `You are a patent attorney assistant. Generate 8-12 targeted yes/no questions to help clarify and strengthen a patent application.
            
Focus on:
- Technical implementation details
- Novelty aspects vs prior art
- Specific use cases and applications
- Manufacturing and practical considerations
- Differentiating features from competitors

Return results in JSON format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Does your invention use machine learning algorithms?",
      "context": "This helps determine if AI-related claims should be included"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Generate questions for this patent idea:

Idea: ${idea}

Prior Art Found: ${JSON.stringify(priorArt || [])}
Competitors: ${JSON.stringify(competitors || [])}

Generate questions that will help differentiate this invention and strengthen the patent claims.`
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
    
    console.log('AI response received');

    // Parse the JSON response
    let questionsResult;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        questionsResult = JSON.parse(jsonMatch[1]);
      } else {
        questionsResult = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return default questions if parsing fails
      questionsResult = {
        questions: [
          {
            id: "q1",
            question: "Does your invention include a physical component or device?",
            context: "This determines if hardware-related claims should be included"
          },
          {
            id: "q2",
            question: "Can your invention be implemented in software?",
            context: "This helps establish software patent eligibility"
          },
          {
            id: "q3",
            question: "Does your invention improve upon existing solutions?",
            context: "This establishes the novelty and non-obviousness"
          }
        ]
      };
    }

    return new Response(
      JSON.stringify(questionsResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
