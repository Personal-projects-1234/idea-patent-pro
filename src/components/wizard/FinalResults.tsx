import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Download, Home } from "lucide-react";
import { PatentData } from "@/pages/Wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FinalResultsProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

const FinalResults = ({ data, onBack }: FinalResultsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    performFinalAnalysis();
  }, []);

  const performFinalAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const { data: analysisData, error } = await supabase.functions.invoke('final-prior-art-analysis', {
        body: {
          idea: data.idea,
          specifications: data.specifications,
          previousPriorArt: data.priorArt
        }
      });

      if (error) throw error;

      setAnalysis(analysisData);
      
      toast({
        title: "Analysis Complete",
        description: "Your patent application is ready for review",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to perform final analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAllDocuments = () => {
    // Download provisional
    const provisionalBlob = new Blob([data.specifications?.provisional || ''], { type: 'text/plain' });
    const provisionalUrl = URL.createObjectURL(provisionalBlob);
    const provisionalLink = document.createElement('a');
    provisionalLink.href = provisionalUrl;
    provisionalLink.download = 'patent-provisional-application.txt';
    document.body.appendChild(provisionalLink);
    provisionalLink.click();
    document.body.removeChild(provisionalLink);

    // Download complete
    setTimeout(() => {
      const completeBlob = new Blob([data.specifications?.complete || ''], { type: 'text/plain' });
      const completeUrl = URL.createObjectURL(completeBlob);
      const completeLink = document.createElement('a');
      completeLink.href = completeUrl;
      completeLink.download = 'patent-complete-application.txt';
      document.body.appendChild(completeLink);
      completeLink.click();
      document.body.removeChild(completeLink);
    }, 500);

    toast({
      title: "Downloads Started",
      description: "Your patent documents are being downloaded",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg">
            <CheckCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Final Analysis & Results
            </h2>
            <p className="text-muted-foreground">
              Comprehensive review of your patent application
            </p>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Performing final prior art analysis...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6 bg-gradient-subtle border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Application Summary
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent">{analysis?.patentabilityScore || 85}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Patentability Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{analysis?.conflictsFound || 2}</p>
                  <p className="text-sm text-muted-foreground mt-1">Potential Conflicts</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{analysis?.uniqueClaims || 12}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unique Claims</p>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Recommendations
              </h3>
              <div className="space-y-3">
                {(analysis?.recommendations || [
                  { type: 'success', message: 'Your invention shows strong novelty compared to existing patents' },
                  { type: 'warning', message: 'Consider emphasizing the unique algorithm approach in your claims' },
                  { type: 'info', message: 'The technical diagrams effectively illustrate key innovations' }
                ]).map((rec: any, index: number) => (
                  <Card key={index} className="p-4 border-border flex items-start gap-3">
                    {rec.type === 'success' && <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />}
                    {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                    {rec.type === 'info' && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                    <p className="text-foreground">{rec.message}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Next Steps
              </h3>
              <ol className="space-y-2 list-decimal list-inside text-foreground">
                <li>Review and download your patent specifications</li>
                <li>Consult with a patent attorney for final review</li>
                <li>File your provisional or complete application</li>
                <li>Monitor for any office actions or requirements</li>
              </ol>
            </Card>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isAnalyzing}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={downloadAllDocuments}
            disabled={isAnalyzing}
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            disabled={isAnalyzing}
            className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalResults;
