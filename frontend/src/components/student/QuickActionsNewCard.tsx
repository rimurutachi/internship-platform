import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare } from "lucide-react";
import Link from "next/link";

export const QuickActionsNewCard = () => {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base justify-start"
          asChild
        >
          <Link href="/dashboard/student/documents">
            <Upload className="w-5 h-5 mr-3" />
            Upload Document
          </Link>
        </Button>
        
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base justify-start"
          asChild
        >
          <Link href="/dashboard/student/messages">
            <MessageSquare className="w-5 h-5 mr-3" />
            Message
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
