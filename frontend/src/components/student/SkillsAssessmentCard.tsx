import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Code, MessageCircle, Clock } from "lucide-react";

const skills = [
  {
    name: "Technical Skills",
    value: 90,
    icon: Code,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    name: "Communication",
    value: 85,
    icon: MessageCircle,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    name: "Work Ethic",
    value: 88,
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10"
  }
];

export const SkillsAssessmentCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-ai" />
          <span>Skills Assessment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${skill.bgColor}`}>
                  <skill.icon className={`w-4 h-4 ${skill.color}`} />
                </div>
                <span className="font-medium text-foreground">{skill.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{skill.value}%</span>
            </div>
            <Progress value={skill.value} className="w-full" />
          </div>
        ))}
        
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Last updated: 3 days ago • Based on supervisor feedback and AI analysis
          </p>
        </div>
      </CardContent>
    </Card>
  );
};