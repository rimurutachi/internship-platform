import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, FileText, Zap } from "lucide-react";

export const QuickActionsCard = () => {
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-warning" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start bg-gradient-primary hover:opacity-90">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
        
        <Button variant="outline" className="w-full justify-start">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message Supervisor
        </Button>
        
        <div className="pt-2 border-t border-border">
          <Button variant="link" className="w-full justify-start h-auto p-0 text-primary">
            <FileText className="w-4 h-4 mr-2" />
            View Full Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};