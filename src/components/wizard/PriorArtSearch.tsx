import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, AlertCircle, Shield } from "lucide-react";
import { PatentData } from "@/pages/Wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriorArtSearchProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

const PriorArtSearch = ({ data, onNext, onBack }: PriorArtSearchProps) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);

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

      setResults(searchData.priorArt || []);
      setCompetitors(searchData.competitors || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${searchData.priorArt?.length || 0} related patents and ${searchData.competitors?.length || 0} competitors`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "There was an error performing the prior art search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleContinue = () => {
    onNext({ priorArt: results, competitors });
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
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
            <p className="text-muted-foreground">Searching Google Patents database...</p>
            <p className="text-sm text-muted-foreground mt-2">Finding up to 20 relevant patents</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Prior Art Results */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Related Patents ({results.length})
              </h3>
              {results.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {results.map((result, index) => (
                    <Card key={index} className="p-4 border-border hover:shadow-card transition-smooth">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{result.title}</h4>
                            {result.relevanceScore && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                                {result.relevanceScore}% relevant
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                          {result.keyOverlap && (
                            <p className="text-xs text-amber-600 mb-2">
                              <strong>Key Overlap:</strong> {result.keyOverlap}
                            </p>
                          )}
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Patent: {result.patentNumber}</span>
                            <span>•</span>
                            <span>Filed: {result.date}</span>
                          </div>
                        </div>
                        <a 
                          href={result.url || `https://patents.google.com/patent/${result.patentNumber}/en`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No directly related patents found</p>
                </div>
              )}
            </div>

            {/* Competitors */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Identified Competitors ({competitors.length})
              </h3>
              {competitors.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {competitors.map((competitor, index) => (
                    <Card key={index} className="p-4 border-border hover:shadow-card transition-smooth">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{competitor.name}</h4>
                            {competitor.threatLevel && (
                              <Shield className={`h-4 w-4 ${getThreatColor(competitor.threatLevel)}`} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{competitor.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Patents: {competitor.patentCount}
                            {competitor.threatLevel && (
                              <span className={`ml-2 ${getThreatColor(competitor.threatLevel)}`}>
                                • {competitor.threatLevel} threat
                              </span>
                            )}
                          </p>
                        </div>
                        {competitor.keyPatentUrl && (
                          <a 
                            href={competitor.keyPatentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No direct competitors identified</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSearching}>
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={isSearching}
          className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
        >
          Continue to Questionnaire
        </Button>
      </div>
    </div>
  );
};

export default PriorArtSearch;
