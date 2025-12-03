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

    console.log('Generating patent specifications for idea:', idea.substring(0, 100));

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
            content: `You are an expert patent attorney drafting a PROVISIONAL PATENT APPLICATION. 
Write a comprehensive provisional specification (minimum 3000 words) with proper patent formatting.

Use this EXACT structure with clear headings:

# PROVISIONAL PATENT APPLICATION

## TITLE OF INVENTION
[Descriptive title]

## CROSS-REFERENCE TO RELATED APPLICATIONS
[State if any or "Not Applicable"]

## FIELD OF THE INVENTION
[Technical field - 100-200 words]

## BACKGROUND OF THE INVENTION
[Prior art discussion, problems with existing solutions - 400-600 words]

## SUMMARY OF THE INVENTION
[Brief overview of the invention and its advantages - 300-400 words]

## BRIEF DESCRIPTION OF THE DRAWINGS
[List figures: Figure 1 shows..., Figure 2 shows..., etc. - at least 5 figures]

## DETAILED DESCRIPTION OF THE INVENTION
[Comprehensive technical description - 1500-2000 words minimum, including:
- Preferred embodiments
- Alternative embodiments
- Technical specifications
- How it works
- Materials and components]

## CLAIMS
[Write 15-25 claims in proper patent claim format:
1. Independent claims (broad)
2. Dependent claims (specific features)
Each claim must be a single sentence starting with "A..." or "The..." for dependent claims]

## ABSTRACT
[150-250 words summarizing the invention]

Write in formal patent language. Be thorough and technical.`
          },
          {
            role: 'user',
            content: `Draft a PROVISIONAL patent specification for this invention:

INVENTION IDEA:
${idea}

PRIOR ART FOUND:
${JSON.stringify(priorArt?.slice(0, 5) || [])}

QUESTIONNAIRE ANSWERS:
${JSON.stringify(answers || {})}

Write a complete, detailed provisional specification with all required sections.`
          }
        ],
      }),
    });

    if (!provisionalResponse.ok) {
      console.error('Provisional spec error:', await provisionalResponse.text());
      throw new Error('Failed to generate provisional specification');
    }

    const provisionalData = await provisionalResponse.json();
    const provisionalSpec = provisionalData.choices[0].message.content;
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
            content: `You are an expert patent attorney drafting a COMPLETE PATENT SPECIFICATION following USPTO standards.
Write an exhaustive complete specification (minimum 5000 words) with proper patent formatting.

Use this EXACT structure with clear headings:

# COMPLETE PATENT SPECIFICATION

## TITLE OF INVENTION
[Descriptive technical title]

## CROSS-REFERENCE TO RELATED APPLICATIONS
[Reference any related applications or state "Not Applicable"]

## STATEMENT REGARDING FEDERALLY SPONSORED RESEARCH
[State if applicable or "Not Applicable"]

## FIELD OF THE INVENTION
[Technical field classification - 150-250 words]

## BACKGROUND OF THE INVENTION

### Technical Field
[Detailed technical context - 200-300 words]

### Description of Related Art
[Comprehensive prior art analysis - 500-700 words discussing existing patents, their limitations, and problems]

### Problems with Existing Solutions
[Specific technical problems - 300-400 words]

## SUMMARY OF THE INVENTION

### Objects of the Invention
[Primary and secondary objectives - 200-300 words]

### Solution Provided
[How the invention solves the problems - 300-400 words]

### Advantages of the Invention
[Technical and commercial advantages - 200-300 words]

## BRIEF DESCRIPTION OF THE DRAWINGS
[Detailed figure descriptions:
- Figure 1: [detailed description]
- Figure 2: [detailed description]
- Figure 3: [detailed description]
- Figure 4: [detailed description]
- Figure 5: [detailed description]
Include reference numerals]

## DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS

### Overview
[General description - 300-400 words]

### First Preferred Embodiment
[Detailed technical description with reference numerals - 800-1000 words]

### Second Preferred Embodiment
[Alternative implementation - 600-800 words]

### Third Preferred Embodiment
[Another variation - 500-700 words]

### Method of Operation
[Step-by-step operation - 400-600 words]

### Materials and Manufacturing
[Specific materials, dimensions, manufacturing methods - 300-500 words]

### Modifications and Variations
[Possible modifications within scope - 300-400 words]

## CLAIMS

### Independent Claims
[Write 5-8 independent claims covering different aspects:
- Apparatus/device claim
- Method claim
- System claim
Each must be comprehensive and stand alone]

### Dependent Claims
[Write 15-25 dependent claims:
- Claims 2-5 depend on Claim 1
- Claims 7-10 depend on Claim 6
- etc.
Each adds specific features]

## ABSTRACT
[200-300 words - comprehensive summary]

## SEQUENCE LISTING
[If applicable, or omit]

Write in formal USPTO patent language. Use reference numerals (10, 20, 30, etc.) throughout. Be exhaustive and technically precise.`
          },
          {
            role: 'user',
            content: `Draft a COMPLETE patent specification for this invention:

INVENTION IDEA:
${idea}

PRIOR ART FOUND:
${JSON.stringify(priorArt?.slice(0, 5) || [])}

COMPETITORS:
${JSON.stringify(competitors?.slice(0, 3) || [])}

QUESTIONNAIRE ANSWERS:
${JSON.stringify(answers || {})}

Write an exhaustive, detailed complete specification with all required sections. Use reference numerals. Be thorough.`
          }
        ],
      }),
    });

    if (!completeResponse.ok) {
      console.error('Complete spec error:', await completeResponse.text());
      throw new Error('Failed to generate complete specification');
    }

    const completeData = await completeResponse.json();
    const completeSpec = completeData.choices[0].message.content;
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
      provisional: '',
      complete: '',
      images: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
