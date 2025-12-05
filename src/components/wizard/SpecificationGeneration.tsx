import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Image as ImageIcon, Download, RefreshCw, Edit, Eye } from "lucide-react";
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
  const [editMode, setEditMode] = useState<'provisional' | 'complete' | null>(null);
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

      // Ensure we have strings
      const provisional = typeof specData?.provisional === 'string' 
        ? specData.provisional 
        : specData?.provisional 
          ? JSON.stringify(specData.provisional, null, 2)
          : 'Failed to generate provisional specification.';
      
      const complete = typeof specData?.complete === 'string'
        ? specData.complete
        : specData?.complete
          ? JSON.stringify(specData.complete, null, 2)
          : 'Failed to generate complete specification.';
      
      setSpecifications({
        provisional,
        complete,
        images: specData?.images || []
      });
      
      toast({
        title: "Specifications Generated",
        description: "Patent specifications have been created successfully",
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      setSpecifications({
        provisional: 'Error generating specifications. Please click "Regenerate" to try again.',
        complete: 'Error generating specifications. Please click "Regenerate" to try again.',
        images: []
      });
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
      const { data: imageData, error } = await supabase.functions.invoke('generate-patent-images', {
        body: { idea: data.idea }
      });

      if (error) throw error;
      
      setSpecifications(prev => ({
        ...prev,
        images: imageData?.images || []
      }));
      
      toast({
        title: "Images Generated",
        description: `Generated ${imageData?.images?.length || 0} patent diagrams`,
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
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSpecChange = (type: 'provisional' | 'complete', value: string) => {
    setSpecifications(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const renderSpecContent = (type: 'provisional' | 'complete') => {
    const content = type === 'provisional' ? specifications.provisional : specifications.complete;
    const isEditing = editMode === type;

    if (isEditing) {
      return (
        <Textarea
          value={content}
          onChange={(e) => handleSpecChange(type, e.target.value)}
          className="min-h-[500px] font-mono text-sm bg-background border-border"
          placeholder="Enter specification content..."
        />
      );
    }

    return (
      <Card className="p-6 bg-muted/50 border-border max-h-[500px] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
          {content || 'No content available. Click "Regenerate" to try again.'}
        </pre>
      </Card>
    );
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
            <p className="text-sm text-muted-foreground mt-2">This may take a minute</p>
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
                  Provisional patent application ({specifications.provisional.length} characters)
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditMode(editMode === 'provisional' ? null : 'provisional')}
                  >
                    {editMode === 'provisional' ? (
                      <><Eye className="h-4 w-4 mr-2" />Preview</>
                    ) : (
                      <><Edit className="h-4 w-4 mr-2" />Edit</>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadDocument('provisional')}
                    disabled={!specifications.provisional}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              {renderSpecContent('provisional')}
            </TabsContent>
            
            <TabsContent value="complete" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Complete patent application ({specifications.complete.length} characters)
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditMode(editMode === 'complete' ? null : 'complete')}
                  >
                    {editMode === 'complete' ? (
                      <><Eye className="h-4 w-4 mr-2" />Preview</>
                    ) : (
                      <><Edit className="h-4 w-4 mr-2" />Edit</>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadDocument('complete')}
                    disabled={!specifications.complete}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              {renderSpecContent('complete')}
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
                  {isGeneratingImages ? 'Generating...' : 'Generate Diagrams'}
                </Button>
              </div>
              {isGeneratingImages ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                  <p className="text-muted-foreground">Generating 5 patent diagrams...</p>
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
                    Generate 5 Patent Diagrams
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!isGenerating && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateSpecifications}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate All Specifications
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={isGenerating || !specifications.provisional}
          className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
        >
          Continue to Final Analysis
        </Button>
      </div>
    </div>
  );
};

export default SpecificationGeneration;
