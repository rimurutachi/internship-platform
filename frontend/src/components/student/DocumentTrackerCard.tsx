import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock } from "lucide-react";

interface Document {
  name: string;
  status: 'submitted' | 'approved' | 'pending';
}

interface DocumentTrackerCardProps {
  documents?: Document[];
}

const defaultDocuments: Document[] = [
  { name: "MOA", status: "submitted" },
  { name: "Waiver", status: "approved" },
  { name: "OJT Placement Form", status: "submitted" },
  { name: "Training Schedule Form", status: "submitted" },
  { name: "Endorsement Letter", status: "approved" },
];

export const DocumentTrackerCard = ({ documents = defaultDocuments }: DocumentTrackerCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary text-primary-foreground border-0 text-xs">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500 text-white border-0 text-xs">Submitted</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 text-white border-0 text-xs">Pending</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0 text-xs">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Document Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-base text-foreground">{doc.name}</span>
              </div>
              {getStatusBadge(doc.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
