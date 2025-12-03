import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image as ImageIcon, Download } from "lucide-react";
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
        description: "Both provisional and complete applications are ready",
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
              Generated technical specifications and diagrams
            </p>
          </div>
        </div>

        {isGenerating ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Generating specifications and diagrams...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
          </div>
        ) : (
          <Tabs defaultValue="provisional" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provisional">Provisional</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="images">Diagrams</TabsTrigger>
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
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
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
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                  {specifications.complete}
                </pre>
              </Card>
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Technical diagrams for your patent application
              </p>
              {specifications.images.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {specifications.images.map((image, index) => (
                    <Card key={index} className="p-4 border-border">
                      <img 
                        src={image} 
                        alt={`Patent diagram ${index + 1}`} 
                        className="w-full rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Figure {index + 1}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No diagrams generated</p>
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
