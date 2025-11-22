import { useState, useEffect } from 'react';
import { Loader2, MessageSquare, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { DocumentComment } from '@/types/documents';

interface CommentsTabProps {
  documentId: string;
}

export function CommentsTab({ documentId }: CommentsTabProps) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAPI.getComments(documentId);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (comment: DocumentComment, isReply: boolean = false) => (
    <Card key={comment.id} className={isReply ? 'ml-8 mt-2' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm">
                  {comment.user?.first_name} {comment.user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{comment.user?.email}</p>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(comment.created_at)}
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => renderComment(comment))}
    </div>
  );
}
