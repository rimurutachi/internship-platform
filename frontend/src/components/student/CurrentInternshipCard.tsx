import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, MapPin } from "lucide-react";

export const CurrentInternshipCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Current Internship</span>
          </CardTitle>
          <Badge className="bg-gradient-ai text-white border-0">
            AI MONITORED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">TechCorp Solutions</h3>
          <p className="text-lg text-muted-foreground">Software Developer Intern</p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>March 2024 - June 2024</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>San Francisco, CA</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">75% Complete</span>
          </div>
          <Progress value={75} className="w-full" />
          <p className="text-xs text-muted-foreground">
            3 weeks remaining • On track for completion
          </p>
        </div>
      </CardContent>
    </Card>
  );
};