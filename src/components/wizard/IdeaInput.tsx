import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb } from "lucide-react";
import { PatentData } from "@/pages/Wizard";

interface IdeaInputProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

const IdeaInput = ({ data, onNext }: IdeaInputProps) => {
  const [idea, setIdea] = useState(data.idea || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!idea.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    
    onNext({ idea });
  };

  return (
    <Card className="p-8 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Lightbulb className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Describe Your Innovation
          </h2>
          <p className="text-muted-foreground">
            Share your invention idea in as much detail as possible
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="idea" className="text-base">
            Your Patent Idea
          </Label>
          <Textarea
            id="idea"
            placeholder="Describe your invention, including what problem it solves, how it works, and what makes it unique. Be as detailed as possible..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[300px] resize-none"
          />
          <p className="text-sm text-muted-foreground">
            Minimum 50 characters recommended for best results
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-foreground">💡 Tips for a great description:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Explain the problem your invention solves</li>
            <li>Describe how your solution works</li>
            <li>Highlight what makes it unique or innovative</li>
            <li>Include technical details if applicable</li>
            <li>Mention any key components or processes</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={idea.trim().length < 20 || isSubmitting}
            className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
          >
            {isSubmitting ? "Processing..." : "Continue to Prior Art Search"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default IdeaInput;
