import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import IdeaInput from "@/components/wizard/IdeaInput";
import PriorArtSearch from "@/components/wizard/PriorArtSearch";
import Questionnaire from "@/components/wizard/Questionnaire";
import SpecificationGeneration from "@/components/wizard/SpecificationGeneration";
import FinalResults from "@/components/wizard/FinalResults";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export type PatentData = {
  idea: string;
  priorArt?: any[];
  competitors?: any[];
  answers?: Record<string, boolean>;
  specifications?: {
    provisional: string;
    complete: string;
    images: string[];
  };
  finalAnalysis?: any;
};

const Wizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [patentData, setPatentData] = useState<PatentData>({ idea: "" });

  const steps = [
    { number: 1, title: "Idea Input", component: IdeaInput },
    { number: 2, title: "Prior Art Search", component: PriorArtSearch },
    { number: 3, title: "Questionnaire", component: Questionnaire },
    { number: 4, title: "Specifications", component: SpecificationGeneration },
    { number: 5, title: "Final Analysis", component: FinalResults }
  ];

  const currentStep = steps.find(s => s.number === step);
  const CurrentStepComponent = currentStep?.component;
  const progress = (step / steps.length) * 100;

  const handleNext = (data: Partial<PatentData>) => {
    setPatentData({ ...patentData, ...data });
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            Patent Application Wizard
          </h1>
          <p className="text-muted-foreground">
            Follow the steps to create your complete patent application
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8 bg-card border-border">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Step {step} of {steps.length}: {currentStep?.title}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`flex flex-col items-center flex-1 ${
                  s.number !== steps.length ? 'border-r border-border' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-smooth ${
                    s.number < step
                      ? 'bg-accent text-accent-foreground'
                      : s.number === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.number}
                </div>
                <span className={`text-xs text-center ${
                  s.number === step ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Current Step Content */}
        <div className="animate-in fade-in duration-500">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={patentData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Wizard;
