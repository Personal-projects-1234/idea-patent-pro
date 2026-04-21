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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating 5 patent diagrams for idea:', idea.substring(0, 100));

    const figureDescriptions = [
      { 
        title: "Figure 1 - System Overview", 
        description: `A comprehensive system architecture diagram showing all main components, their connections, and the overall structure of the invention. Include reference numerals (10, 20, 30, etc.) for each major component.`
      },
      { 
        title: "Figure 2 - Main Component Detail", 
        description: `A detailed cross-sectional or exploded view of the primary component showing internal structure, sub-components, and assembly relationships. Label all parts with reference numerals (100, 110, 120, etc.).`
      },
      { 
        title: "Figure 3 - Process Flow Diagram", 
        description: `A flowchart showing the method of operation with clear process steps, decision points, and flow arrows. Include step numbers (S1, S2, S3, etc.).`
      },
      { 
        title: "Figure 4 - Alternative Embodiment", 
        description: `An alternative implementation or embodiment showing variations in design or configuration. Use different reference numerals (200, 210, 220, etc.).`
      },
      { 
        title: "Figure 5 - Functional Block Diagram", 
        description: `A functional block diagram showing the interaction between different modules, data flow, and control signals. Include input/output arrows and functional labels.`
      }
    ];

    const images: string[] = [];

    for (let i = 0; i < figureDescriptions.length; i++) {
      const figure = figureDescriptions[i];
      try {
        console.log(`Generating Figure ${i + 1}: ${figure.title}`);
        
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: `Generate a professional USPTO-style patent diagram. The diagram must be:

STRICT REQUIREMENTS:
- Pure black lines on white background ONLY
- NO colors, NO gradients, NO shading, NO gray tones
- Clean, precise technical line art
- Include numbered reference markers (10, 20, 30, 40, etc.) pointing to components with leader lines
- Professional engineering/technical drawing style
- Similar to diagrams in official USPTO patent filings
- Include a title at the bottom: "${figure.title}"

INVENTION: ${idea.substring(0, 500)}

DIAGRAM TYPE: ${figure.title}
SPECIFIC CONTENT: ${figure.description}

Generate a clean, professional patent figure suitable for a patent application filing.`
            }],
            modalities: ['image', 'text']
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageUrl) {
            images.push(imageUrl);
            console.log(`Successfully generated Figure ${i + 1}`);
          } else {
            console.error(`No image returned for Figure ${i + 1}:`, JSON.stringify(imageData).substring(0, 500));
          }
        } else {
          const errText = await imageResponse.text();
          console.error(`Failed to generate Figure ${i + 1} (${imageResponse.status}):`, errText);
          if (imageResponse.status === 402) {
            return new Response(JSON.stringify({
              error: 'You have run out of AI credits. Please add more in Settings → Workspace → Usage.',
              images
            }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      } catch (imgError) {
        console.error(`Error generating figure ${i + 1}:`, imgError);
      }
    }

    console.log(`Generated ${images.length} of 5 patent diagrams`);

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      images: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
