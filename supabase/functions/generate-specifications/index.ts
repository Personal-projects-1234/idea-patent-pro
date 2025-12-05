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

    console.log('Generating patent specifications for idea:', idea?.substring(0, 100));

    // Generate Provisional Specification
    const provisionalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert patent attorney. Write a PROVISIONAL PATENT APPLICATION as plain text (NOT JSON).

Write minimum 3000 words with this structure:

PROVISIONAL PATENT APPLICATION
================================

TITLE OF INVENTION
------------------
[Write descriptive title]

CROSS-REFERENCE TO RELATED APPLICATIONS
---------------------------------------
Not Applicable

FIELD OF THE INVENTION
----------------------
[100-200 words about technical field]

BACKGROUND OF THE INVENTION
---------------------------
[400-600 words about prior art and problems]

SUMMARY OF THE INVENTION
------------------------
[300-400 words overview]

BRIEF DESCRIPTION OF THE DRAWINGS
---------------------------------
Figure 1 shows [description]
Figure 2 shows [description]
Figure 3 shows [description]
Figure 4 shows [description]
Figure 5 shows [description]

DETAILED DESCRIPTION OF THE INVENTION
-------------------------------------
[1500-2000 words with technical details, embodiments, components]

CLAIMS
------
1. [First independent claim]
2. The invention of claim 1, wherein [dependent claim]
3. The invention of claim 1, further comprising [dependent claim]
[Continue with 15-25 claims total]

ABSTRACT
--------
[150-250 words summary]

Write in formal patent language. Output as PLAIN TEXT only.`
          },
          {
            role: 'user',
            content: `Draft a PROVISIONAL patent specification for:

INVENTION: ${idea || 'Not provided'}

PRIOR ART: ${JSON.stringify(priorArt?.slice(0, 3) || [])}

ANSWERS: ${JSON.stringify(answers || {})}

Write the complete specification as plain text.`
          }
        ],
      }),
    });

    if (!provisionalResponse.ok) {
      const errText = await provisionalResponse.text();
      console.error('Provisional spec error:', errText);
      throw new Error('Failed to generate provisional specification');
    }

    const provisionalData = await provisionalResponse.json();
    let provisionalSpec = provisionalData.choices[0]?.message?.content || '';
    
    // Ensure it's a string
    if (typeof provisionalSpec !== 'string') {
      provisionalSpec = JSON.stringify(provisionalSpec, null, 2);
    }
    
    console.log('Provisional specification generated, length:', provisionalSpec.length);

    // Generate Complete Specification
    const completeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert patent attorney. Write a COMPLETE PATENT SPECIFICATION as plain text (NOT JSON).

Write minimum 5000 words following USPTO standards:

COMPLETE PATENT SPECIFICATION
==============================

TITLE OF INVENTION
------------------
[Descriptive technical title]

CROSS-REFERENCE TO RELATED APPLICATIONS
---------------------------------------
[If any or "Not Applicable"]

STATEMENT REGARDING FEDERALLY SPONSORED RESEARCH
-------------------------------------------------
Not Applicable

FIELD OF THE INVENTION
----------------------
[150-250 words about technical field]

BACKGROUND OF THE INVENTION

Technical Field
~~~~~~~~~~~~~~~
[200-300 words]

Description of Related Art
~~~~~~~~~~~~~~~~~~~~~~~~~~
[500-700 words discussing existing patents]

Problems with Existing Solutions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
[300-400 words]

SUMMARY OF THE INVENTION

Objects of the Invention
~~~~~~~~~~~~~~~~~~~~~~~~
[200-300 words]

Solution Provided
~~~~~~~~~~~~~~~~~
[300-400 words]

Advantages of the Invention
~~~~~~~~~~~~~~~~~~~~~~~~~~~
[200-300 words]

BRIEF DESCRIPTION OF THE DRAWINGS
---------------------------------
Figure 1 (Reference numeral 100): [detailed description]
Figure 2 (Reference numeral 200): [detailed description]
Figure 3 (Reference numeral 300): [detailed description]
Figure 4 (Reference numeral 400): [detailed description]
Figure 5 (Reference numeral 500): [detailed description]

DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS

Overview
~~~~~~~~
[300-400 words]

First Preferred Embodiment (Figure 1)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
[800-1000 words with reference numerals 10, 12, 14, etc.]

Second Preferred Embodiment (Figure 2)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
[600-800 words]

Third Preferred Embodiment (Figure 3)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
[500-700 words]

Method of Operation
~~~~~~~~~~~~~~~~~~~
[400-600 words]

Materials and Manufacturing
~~~~~~~~~~~~~~~~~~~~~~~~~~~
[300-500 words]

CLAIMS
------
Independent Claims:
1. A [apparatus/method/system] comprising: [comprehensive claim]

Dependent Claims:
2. The [apparatus/method/system] of claim 1, wherein [specific feature]
3. The [apparatus/method/system] of claim 1, further comprising [additional feature]
[Continue with 25-35 total claims]

ABSTRACT
--------
[200-300 words]

Write in formal USPTO patent language. Use reference numerals throughout. Output as PLAIN TEXT only.`
          },
          {
            role: 'user',
            content: `Draft a COMPLETE patent specification for:

INVENTION: ${idea || 'Not provided'}

PRIOR ART: ${JSON.stringify(priorArt?.slice(0, 3) || [])}

COMPETITORS: ${JSON.stringify(competitors?.slice(0, 2) || [])}

ANSWERS: ${JSON.stringify(answers || {})}

Write the complete specification as plain text with all sections.`
          }
        ],
      }),
    });

    if (!completeResponse.ok) {
      const errText = await completeResponse.text();
      console.error('Complete spec error:', errText);
      throw new Error('Failed to generate complete specification');
    }

    const completeData = await completeResponse.json();
    let completeSpec = completeData.choices[0]?.message?.content || '';
    
    // Ensure it's a string
    if (typeof completeSpec !== 'string') {
      completeSpec = JSON.stringify(completeSpec, null, 2);
    }
    
    console.log('Complete specification generated, length:', completeSpec.length);

    return new Response(JSON.stringify({
      provisional: provisionalSpec,
      complete: completeSpec,
      images: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating specifications:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      provisional: 'Error generating provisional specification. Please try again.',
      complete: 'Error generating complete specification. Please try again.',
      images: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
