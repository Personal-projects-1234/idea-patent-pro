import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Download, Home, ExternalLink, Info, Shield } from "lucide-react";
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
    const provisionalBlob = new Blob([data.specifications?.provisional || ''], { type: 'text/plain' });
    const provisionalUrl = URL.createObjectURL(provisionalBlob);
    const provisionalLink = document.createElement('a');
    provisionalLink.href = provisionalUrl;
    provisionalLink.download = 'patent-provisional-application.txt';
    document.body.appendChild(provisionalLink);
    provisionalLink.click();
    document.body.removeChild(provisionalLink);

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
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
            <p className="text-sm text-muted-foreground mt-2">Comparing with nearest competitors</p>
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
                  <p className={`text-3xl font-bold ${getScoreColor(analysis?.patentabilityScore || 0)}`}>
                    {analysis?.patentabilityScore || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Patentability Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{analysis?.conflictsFound || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Potential Conflicts</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{analysis?.uniqueClaims || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unique Claims</p>
                </div>
              </div>
            </Card>

            {/* Nearest Competitor Analysis */}
            {analysis?.nearestCompetitor && (
              <Card className="p-6 border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Nearest Competitor Patent
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{analysis.nearestCompetitor.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {analysis.nearestCompetitor.patentNumber} • {analysis.nearestCompetitor.holder}
                      </p>
                    </div>
                    {analysis.nearestCompetitor.url && (
                      <a href={analysis.nearestCompetitor.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Overlap</p>
                      <p className="text-lg font-semibold text-foreground">
                        {analysis.nearestCompetitor.overlapPercentage || 0}%
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getRiskColor(analysis.nearestCompetitor.riskLevel)}`}>
                        {analysis.nearestCompetitor.riskLevel || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {analysis.nearestCompetitor.differentiatingFactors?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Differentiating Factors:</p>
                      <ul className="list-disc list-inside text-sm text-foreground">
                        {analysis.nearestCompetitor.differentiatingFactors.map((factor: string, i: number) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Conflict Details */}
            {analysis?.conflictDetails?.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Conflict Details
                </h3>
                <div className="space-y-3">
                  {analysis.conflictDetails.map((conflict: any, index: number) => (
                    <Card key={index} className="p-4 border-border">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          conflict.severity === 'high' ? 'text-red-500' : 
                          conflict.severity === 'medium' ? 'text-amber-500' : 'text-green-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {conflict.patentNumber}: {conflict.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{conflict.conflictArea}</p>
                          <p className="text-sm text-primary mt-2">
                            <strong>Recommendation:</strong> {conflict.recommendation}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Recommendations
              </h3>
              <div className="space-y-3">
                {(analysis?.recommendations || []).map((rec: any, index: number) => (
                  <Card key={index} className="p-4 border-border flex items-start gap-3">
                    {rec.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                    {rec.type === 'info' && <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                    <div>
                      {rec.category && (
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                          {rec.category}
                        </p>
                      )}
                      <p className="text-foreground">{rec.message}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            {(analysis?.strengthAreas?.length > 0 || analysis?.weaknessAreas?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {analysis?.strengthAreas?.length > 0 && (
                  <Card className="p-4 border-green-500/30 bg-green-500/5">
                    <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {analysis.strengthAreas.map((strength: string, i: number) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </Card>
                )}
                {analysis?.weaknessAreas?.length > 0 && (
                  <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                    <h4 className="font-semibold text-amber-600 mb-2">Areas to Improve</h4>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {analysis.weaknessAreas.map((weakness: string, i: number) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {/* Filing Recommendation */}
            {analysis?.filingRecommendation && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Filing Recommendation
                </h3>
                <p className="text-foreground">{analysis.filingRecommendation}</p>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="p-6 bg-muted/50 border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Next Steps
              </h3>
              <ol className="space-y-2 list-decimal list-inside text-foreground">
                <li>Review and download your patent specifications</li>
                <li>Address any high-severity conflicts identified above</li>
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
