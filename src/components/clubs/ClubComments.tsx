import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ClubCommentsProps {
  postId: string;
  currentUserId: string;
  currentUserType: "patron" | "student";
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_type: "patron" | "student";
  content: string;
  created_at: string;
  author_name?: string;
}

const ClubComments = ({ postId, currentUserId, currentUserType }: ClubCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  // Fetch comments for this post
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["club-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch author names
      const commentsWithNames = await Promise.all(
        (data || []).map(async (comment) => {
          let authorName = "Unknown";
          
          if (comment.author_type === "patron") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", comment.author_id)
              .single();
            authorName = profile?.full_name || "Patron";
          } else {
            const { data: student } = await supabase
              .from("students_data")
              .select("full_name")
              .eq("id", comment.author_id)
              .single();
            authorName = student?.full_name || "Student";
          }

          return { ...comment, author_name: authorName };
        })
      );

      return commentsWithNames as Comment[];
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("club_comments").insert({
        post_id: postId,
        author_id: currentUserId,
        author_type: currentUserType,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["club-posts"] });
      setNewComment("");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("club_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["club-posts"] });
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const canDelete = (comment: Comment) => {
    return (
      (comment.author_type === currentUserType && comment.author_id === currentUserId) ||
      currentUserType === "patron"
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Comments List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(comment.author_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
            {canDelete(comment) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => deleteCommentMutation.mutate(comment.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={addCommentMutation.isPending}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!newComment.trim() || addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ClubComments;
