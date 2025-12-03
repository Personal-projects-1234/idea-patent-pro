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

    console.log('Generating patent diagrams for idea:', idea.substring(0, 100));

    const figureDescriptions = [
      { title: "System Architecture Overview", description: `A technical system architecture diagram showing the main components and their connections for: ${idea.substring(0, 300)}` },
      { title: "Process Flow Diagram", description: `A detailed process flow diagram showing the step-by-step method for: ${idea.substring(0, 300)}` },
      { title: "Component Detail View", description: `A detailed component breakdown diagram showing key elements and their relationships for: ${idea.substring(0, 300)}` }
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
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: `Generate a clean, professional patent diagram in black and white line art style suitable for a US patent application.

Requirements:
- Black lines on pure white background
- Include numbered reference markers (10, 20, 30, etc.) pointing to key components
- Professional technical/engineering drawing style
- Clear labels and annotations
- No colors, gradients, or shading - only black line art
- Similar to diagrams found in official USPTO patent filings

Diagram Type: ${figure.title}
Subject: ${figure.description}`
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
          }
        } else {
          console.error(`Failed to generate Figure ${i + 1}:`, await imageResponse.text());
        }
      } catch (imgError) {
        console.error(`Error generating figure ${i + 1}:`, imgError);
      }
    }

    console.log(`Generated ${images.length} patent diagrams`);

    return new Response(JSON.stringify({ images }), {
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
