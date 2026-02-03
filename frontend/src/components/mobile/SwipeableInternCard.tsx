import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface InternData {
  id: number;
  name: string;
  position: string;
  university: string;
  progress: number;
  avatar?: string;
}

interface SwipeableInternCardProps {
  intern: InternData;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export const SwipeableInternCard = ({ 
  intern, 
  isSelected, 
  onSelect 
}: SwipeableInternCardProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      console.log("Swiped left");
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right
      console.log("Swiped right");
    }
  };

  const initials = intern.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 touch-manipulation ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-card' 
          : 'hover:border-primary/50'
      }`}
      onClick={() => onSelect(intern.id)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-14 h-14 border-2 border-border">
            <AvatarImage src={intern.avatar} />
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground truncate">{intern.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{intern.position}</p>
                <p className="text-xs text-muted-foreground mt-1">{intern.university}</p>
              </div>
              
              {isSelected && (
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 ml-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{intern.progress}%</span>
              </div>
              <Progress value={intern.progress} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
