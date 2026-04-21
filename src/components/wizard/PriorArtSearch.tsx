import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, AlertTriangle, CheckCircle, Building2 } from "lucide-react";
import { PatentData } from "@/pages/Wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriorArtResult {
  patentNumber: string;
  title: string;
  description: string;
  date: string;
  url: string;
  relevanceScore: number;
  keyOverlap: string;
  assignee?: string;
}

interface Competitor {
  name: string;
  description: string;
  patentCount: number;
  keyPatent: string;
  keyPatentUrl: string;
  threatLevel: string;
  keyProducts?: string;
}

interface PriorArtSearchProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

const PriorArtSearch = ({ data, onNext, onBack }: PriorArtSearchProps) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(true);
  const [priorArt, setPriorArt] = useState<PriorArtResult[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      const { data: searchData, error } = await supabase.functions.invoke('prior-art-search', {
        body: { idea: data.idea }
      });

      if (error) throw error;

      setPriorArt(searchData.priorArt || []);
      setCompetitors(searchData.competitors || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${searchData.priorArt?.length || 0} related patents and ${searchData.competitors?.length || 0} competitors`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to complete prior art search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinue = () => {
    onNext({ priorArt, competitors });
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Search className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Prior Art Search
            </h2>
            <p className="text-muted-foreground">
              Searching for up to 20 conflicting patents and competitors
            </p>
          </div>
        </div>

        {isSearching ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Searching patent databases for up to 20 related patents...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Prior Art Results */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Conflicting Patents ({priorArt.length} found)
              </h3>
              {priorArt.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {priorArt.map((result, index) => (
                    <Card key={index} className="p-4 bg-muted/50 border-border hover:border-accent/50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-accent hover:underline flex items-center gap-1"
                            >
                              {result.patentNumber}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <span className={`text-sm font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                              {result.relevanceScore}% match
                            </span>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">{result.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                          {result.keyOverlap && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              <strong>Key Overlap:</strong> {result.keyOverlap}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Filed: {result.date}</span>
                            {result.assignee && <span>• {result.assignee}</span>}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Patent
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 bg-green-500/10 border-green-500/30 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 dark:text-green-400">No directly conflicting patents found</p>
                </Card>
              )}
            </div>

            {/* Competitors */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Key Competitors ({competitors.length})
              </h3>
              {competitors.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {competitors.map((competitor, index) => (
                    <Card key={index} className="p-4 bg-muted/50 border-border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground">{competitor.name}</h4>
                        <Badge className={getThreatLevelColor(competitor.threatLevel)}>
                          {competitor.threatLevel} threat
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{competitor.description}</p>
                      {competitor.keyProducts && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Products:</strong> {competitor.keyProducts}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{competitor.patentCount} patents</span>
                        <a 
                          href={competitor.keyPatentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent hover:underline flex items-center gap-1"
                        >
                          Key: {competitor.keyPatent}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No major competitors identified</p>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSearching}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={performSearch} 
            disabled={isSearching}
          >
            Re-search
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={isSearching}
            className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
          >
            Continue to Specifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PriorArtSearch;
