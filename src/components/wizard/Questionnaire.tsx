import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpCircle } from "lucide-react";
import { PatentData } from "@/pages/Wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface QuestionnaireProps {
  data: PatentData;
  onNext: (data: Partial<PatentData>) => void;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  context: string;
}

const Questionnaire = ({ data, onNext, onBack }: QuestionnaireProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    setIsLoading(true);
    
    try {
      const { data: questionsData, error } = await supabase.functions.invoke('generate-questions', {
        body: { 
          idea: data.idea
        }
      });

      if (error) throw error;

      setQuestions(questionsData.questions || []);
      
      // Initialize answers
      const initialAnswers: Record<string, boolean> = {};
      questionsData.questions?.forEach((q: Question) => {
        initialAnswers[q.id] = false;
      });
      setAnswers(initialAnswers);
      
    } catch (error) {
      console.error('Question generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value === 'yes'
    }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete",
        description: "Please answer all questions before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    
    onNext({ answers });
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg">
            <HelpCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Detailed Questionnaire
            </h2>
            <p className="text-muted-foreground">
              Answer these questions to refine your patent specifications
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-muted-foreground">Generating personalized questions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-6 border-border">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      Question {index + 1} of {questions.length}
                    </p>
                    <p className="text-lg text-foreground mb-2">{question.question}</p>
                    <p className="text-sm text-muted-foreground">{question.context}</p>
                  </div>
                  
                  <RadioGroup
                    value={answers[question.id] === true ? 'yes' : answers[question.id] === false ? 'no' : ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                      <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${question.id}-no`} />
                      <Label htmlFor={`${question.id}-no`} className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading || isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || isSubmitting}
          className="bg-gradient-hero text-white hover:opacity-90 transition-smooth"
        >
          {isSubmitting ? "Processing..." : "Continue to Prior Art Search"}
        </Button>
      </div>
    </div>
  );
};

export default Questionnaire;
