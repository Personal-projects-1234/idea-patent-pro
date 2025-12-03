import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import { PatentData } from "@/pages/Wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SpecificationGenerationProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

const SpecificationGeneration = ({ data, onNext, onBack }: SpecificationGenerationProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [specifications, setSpecifications] = useState({
    provisional: "",
    complete: "",
    images: [] as string[]
  });

  useEffect(() => {
    generateSpecifications();
  }, []);

  const generateSpecifications = async () => {
    setIsGenerating(true);
    
    try {
      const { data: specData, error } = await supabase.functions.invoke('generate-specifications', {
        body: {
          idea: data.idea,
          priorArt: data.priorArt,
          competitors: data.competitors,
          answers: data.answers
        }
      });

      if (error) throw error;

      // Handle both string and object responses
      const formatSpec = (spec: any) => {
        if (typeof spec === 'string') return spec;
        if (typeof spec === 'object' && spec !== null) {
          return Object.entries(spec)
            .map(([key, value]) => `${key.toUpperCase().replace(/_/g, ' ')}\n\n${value}`)
            .join('\n\n---\n\n');
        }
        return '';
      };
      
      setSpecifications({
        provisional: formatSpec(specData.provisional),
        complete: formatSpec(specData.complete),
        images: specData.images || []
      });
      
      toast({
        title: "Specifications Generated",
        description: `Generated specifications with ${specData.images?.length || 0} patent diagrams`,
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate specifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImages = async () => {
    setIsGeneratingImages(true);
    
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      
      // Call a simplified image generation endpoint
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-patent-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: data.idea })
      });

      if (!response.ok) throw new Error('Failed to generate images');
      
      const imageData = await response.json();
      
      setSpecifications(prev => ({
        ...prev,
        images: imageData.images || []
      }));
      
      toast({
        title: "Images Generated",
        description: `Generated ${imageData.images?.length || 0} patent diagrams`,
      });
      
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleContinue = () => {
    onNext({ specifications });
  };

  const downloadDocument = (type: 'provisional' | 'complete') => {
    const content = type === 'provisional' ? specifications.provisional : specifications.complete;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patent-${type}-application.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `patent-figure-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Patent Specifications
            </h2>
            <p className="text-muted-foreground">
              Generated technical specifications and patent diagrams
            </p>
          </div>
        </div>

        {isGenerating ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Generating detailed specifications...</p>
            <p className="text-sm text-muted-foreground mt-2">Creating comprehensive patent documents and diagrams</p>
          </div>
        ) : (
          <Tabs defaultValue="provisional" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provisional">Provisional</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="images">
                Diagrams ({specifications.images.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="provisional" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Provisional patent application specification
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadDocument('provisional')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <Card className="p-6 bg-muted/50 border-border max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                  {specifications.provisional}
                </pre>
              </Card>
            </TabsContent>
            
            <TabsContent value="complete" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Complete patent application specification
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadDocument('complete')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <Card className="p-6 bg-muted/50 border-border max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                  {specifications.complete}
                </pre>
              </Card>
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Technical diagrams for your patent application
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={regenerateImages}
                  disabled={isGeneratingImages}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingImages ? 'animate-spin' : ''}`} />
                  {isGeneratingImages ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
              {isGeneratingImages ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                  <p className="text-muted-foreground">Generating patent diagrams...</p>
                </div>
              ) : specifications.images.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {specifications.images.map((image, index) => (
                    <Card key={index} className="p-4 border-border">
                      <img 
                        src={image} 
                        alt={`Patent diagram ${index + 1}`} 
                        className="w-full rounded-lg bg-white"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">
                          Figure {index + 1}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadImage(image, index)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">No diagrams generated yet</p>
                  <Button 
                    variant="outline"
                    onClick={regenerateImages}
                    disabled={isGeneratingImages}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Patent Diagrams
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={isGenerating}
          className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
        >
          Continue to Final Analysis
        </Button>
      </div>
    </div>
  );
};

export default SpecificationGeneration;
