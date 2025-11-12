import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ProcessingStep {
  id: number;
  icon: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  color: string;
}

interface FeatureScore {
  name: string;
  score: number;
  color: string;
}

interface SentimentScore {
  emotion: string;
  confidence: number;
  color: string;
}

export const AIProcessingVisualization = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 1, icon: "📝", label: "Input Text", status: "pending", color: "hsl(var(--primary))" },
    { id: 2, icon: "🔧", label: "LLT Processing", status: "pending", color: "hsl(var(--ai-primary))" },
    { id: 3, icon: "💝", label: "Sentiment Analysis", status: "pending", color: "hsl(var(--success))" },
    { id: 4, icon: "🎯", label: "Fusion Algorithm", status: "pending", color: "hsl(var(--warning))" },
    { id: 5, icon: "🎓", label: "Grade Output", status: "pending", color: "hsl(var(--destructive))" },
  ]);

  const [inputText, setInputText] = useState(
    "John has demonstrated exceptional technical skills throughout his internship. His ability to solve complex problems and collaborate with the team has been outstanding. He consistently delivers high-quality work and shows great initiative."
  );

  const [features, setFeatures] = useState<FeatureScore[]>([
    { name: "Technical Skills", score: 0, color: "hsl(var(--success))" },
    { name: "Communication", score: 0, color: "hsl(var(--primary))" },
    { name: "Work Ethic", score: 0, color: "hsl(var(--success))" },
    { name: "Problem Solving", score: 0, color: "hsl(var(--ai-primary))" },
  ]);

  const [sentiments, setSentiments] = useState<SentimentScore[]>([
    { emotion: "Positive", confidence: 0, color: "hsl(var(--success))" },
    { emotion: "Professional", confidence: 0, color: "hsl(var(--primary))" },
    { emotion: "Enthusiastic", confidence: 0, color: "hsl(var(--ai-secondary))" },
  ]);

  const [finalGrade, setFinalGrade] = useState<string>("");
  const [gradeConfidence, setGradeConfidence] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing) {
      timer = setInterval(() => {
        setProcessingTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const startProcessing = async () => {
    setIsProcessing(true);
    setProcessingTime(0);
    setFinalGrade("");
    setGradeConfidence(0);

    // Reset all steps
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })));
    setFeatures((prev) => prev.map((f) => ({ ...f, score: 0 })));
    setSentiments((prev) => prev.map((s) => ({ ...s, confidence: 0 })));

    // Process each step
    for (let i = 0; i < steps.length; i++) {
      setSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          status: idx === i ? "processing" : idx < i ? "completed" : "pending",
        }))
      );

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Animate features and sentiments during LLT and Sentiment steps
      if (i === 1) {
        // LLT Processing - animate features
        await animateScores(setFeatures, [0.92, 0.85, 0.89, 0.88]);
      } else if (i === 2) {
        // Sentiment Analysis - animate sentiments
        await animateScores(setSentiments, [0.94, 0.87, 0.79]);
      } else if (i === 4) {
        // Final grade
        await animateGrade();
      }

      setSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          status: idx <= i ? "completed" : "pending",
        }))
      );
    }

    setIsProcessing(false);
  };

  const animateScores = async <T extends FeatureScore | SentimentScore>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    targetScores: number[]
  ) => {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setter((prev) =>
        prev.map((item, idx) => ({
          ...item,
          score: targetScores[idx] ? (targetScores[idx] * i) / steps : 0,
          confidence: targetScores[idx] ? (targetScores[idx] * i) / steps : 0,
        })) as T[]
      );
    }
  };

  const animateGrade = async () => {
    const grades = ["B", "B+", "A-", "A"];
    for (let i = 0; i < grades.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setFinalGrade(grades[i]);
      setGradeConfidence(((i + 1) / grades.length) * 94);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Processing Pipeline */}
      <Card className="border-2 border-ai-primary/20 bg-gradient-to-br from-background via-ai-accent/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Processing Pipeline
            {isProcessing && (
              <Badge variant="outline" className="ml-auto animate-pulse">
                Processing: {processingTime.toFixed(1)}s
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 min-w-fit">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ${
                      step.status === "processing"
                        ? "animate-pulse scale-110 shadow-lg shadow-ai-primary/50"
                        : step.status === "completed"
                        ? "scale-100"
                        : "opacity-50 scale-90"
                    }`}
                    style={{
                      background:
                        step.status === "completed" || step.status === "processing"
                          ? `linear-gradient(135deg, ${step.color}, hsl(var(--ai-secondary)))`
                          : "hsl(var(--muted))",
                    }}
                  >
                    {step.status === "processing" ? (
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    ) : step.status === "completed" ? (
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    ) : (
                      <span>{step.icon}</span>
                    )}
                    {step.status === "processing" && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-primary animate-spin opacity-30" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-center max-w-[80px]">{step.label}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 min-w-[40px] h-1 rounded-full bg-muted relative overflow-hidden">
                    {step.status === "completed" && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-ai-primary to-ai-secondary animate-fade-in"
                        style={{ animation: "fade-in 0.5s ease-out" }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Evaluation Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px] font-mono text-sm"
            placeholder="Enter evaluation text..."
          />
          <Button
            onClick={startProcessing}
            disabled={isProcessing || !inputText.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Start AI Analysis"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Real-time Analysis Panel */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LLT Feature Extraction */}
        <Card className="border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🔧</span>
              LLT Feature Extraction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature) => (
              <div key={feature.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{feature.name}</span>
                  <span
                    className="font-bold"
                    style={{ color: feature.score > 0.8 ? feature.color : "hsl(var(--muted-foreground))" }}
                  >
                    {feature.score > 0 ? feature.score.toFixed(2) : "--"}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={feature.score * 100} className="h-2" />
                  {feature.score > 0 && (
                    <div
                      className="absolute inset-0 h-2 rounded-full opacity-50 animate-pulse"
                      style={{ background: feature.color, width: `${feature.score * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="border-ai-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💝</span>
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentiments.map((sentiment) => (
              <div key={sentiment.emotion} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{sentiment.emotion}</span>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: sentiment.confidence > 0 ? sentiment.color : "hsl(var(--border))",
                      color: sentiment.confidence > 0 ? sentiment.color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {sentiment.confidence > 0 ? `${(sentiment.confidence * 100).toFixed(0)}%` : "--"}
                  </Badge>
                </div>
                <div className="relative">
                  <Progress value={sentiment.confidence * 100} className="h-2" />
                  {sentiment.confidence > 0 && (
                    <div
                      className="absolute inset-0 h-2 rounded-full opacity-50 animate-pulse"
                      style={{ background: sentiment.color, width: `${sentiment.confidence * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Final Grade Display */}
      {finalGrade && (
        <Card className="border-2 border-ai-primary/30 bg-gradient-to-br from-ai-primary/5 via-background to-ai-secondary/5 animate-scale-in">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-block">
                <div className="relative">
                  <div className="text-8xl font-bold bg-gradient-to-br from-ai-primary via-ai-secondary to-success bg-clip-text text-transparent animate-pulse">
                    {finalGrade}
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-ai-primary/20 via-ai-secondary/20 to-success/20 blur-xl rounded-full -z-10 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-ai-primary to-ai-secondary">
                  Predicted Grade: {finalGrade}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  AI Confidence: <span className="font-bold text-success">{gradeConfidence.toFixed(0)}%</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Processing Time: <span className="font-mono">{processingTime.toFixed(2)}s</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
