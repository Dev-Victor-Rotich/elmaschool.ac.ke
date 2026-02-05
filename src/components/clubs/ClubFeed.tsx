import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Loader2, Send, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import ClubPostCard from "./ClubPostCard";

interface ClubFeedProps {
  clubId: string;
  currentUserId: string;
  currentUserType: "patron" | "student";
  currentStudentId?: string;
  memberRole?: string;
}

interface Post {
  id: string;
  club_id: string;
  author_id: string;
  author_type: "patron" | "student";
  content: string;
  image_url?: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  author_role?: string;
  comment_count?: number;
}

const ClubFeed = ({ 
  clubId, 
  currentUserId, 
  currentUserType, 
  currentStudentId,
  memberRole 
}: ClubFeedProps) => {
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const queryClient = useQueryClient();

  // Fetch posts for this club
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["club-posts", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_posts")
        .select("*")
        .eq("club_id", clubId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch author names and comment counts
      const postsWithDetails = await Promise.all(
        (data || []).map(async (post) => {
          let authorName = "Unknown";
          let authorRole = "member";
          
          if (post.author_type === "patron") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", post.author_id)
              .single();
            authorName = profile?.full_name || "Patron";
            authorRole = "patron";
          } else {
            const { data: student } = await supabase
              .from("students_data")
              .select("full_name")
              .eq("id", post.author_id)
              .single();
            authorName = student?.full_name || "Student";
            
            // Get member role
            const { data: member } = await supabase
              .from("club_members")
              .select("role")
              .eq("club_id", clubId)
              .eq("student_id", post.author_id)
              .single();
            authorRole = member?.role || "member";
          }

          // Get comment count
          const { count } = await supabase
            .from("club_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          return { 
            ...post, 
            author_name: authorName, 
            author_role: authorRole,
            comment_count: count || 0 
          };
        })
      );

      return postsWithDetails as Post[];
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      const authorId = currentUserType === "patron" ? currentUserId : currentStudentId;
      if (!authorId) throw new Error("No author ID");

      const { error } = await supabase.from("club_posts").insert({
        club_id: clubId,
        author_id: authorId,
        author_type: currentUserType,
        content: newPostContent.trim(),
        image_url: newPostImage || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-posts", clubId] });
      setNewPostContent("");
      setNewPostImage("");
      setShowImageUpload(false);
      toast.success("Post created!");
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("club_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-posts", clubId] });
      toast.success("Post deleted");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from("club_posts")
        .update({ is_pinned: isPinned })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-posts", clubId] });
      toast.success("Post updated");
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    createPostMutation.mutate();
  };

  const canPin = currentUserType === "patron" || memberRole === "chairperson";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create a Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Share something with your club..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
            />
            
            {showImageUpload && (
              <ImageUploader
                bucket="general-assets"
                folder="clubs/posts"
                onUpload={(url) => setNewPostImage(url)}
                defaultValue={newPostImage}
              />
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageUpload(!showImageUpload)}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {showImageUpload ? "Hide" : "Add"} Image
              </Button>
              
              <Button
                type="submit"
                disabled={!newPostContent.trim() || createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <ClubPostCard
            key={post.id}
            post={post}
            currentUserId={currentUserType === "patron" ? currentUserId : currentStudentId || ""}
            currentUserType={currentUserType}
            canPin={canPin}
            onDelete={(postId) => deletePostMutation.mutate(postId)}
            onTogglePin={(postId, isPinned) => togglePinMutation.mutate({ postId, isPinned })}
          />
        ))}

        {posts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No posts yet. Be the first to share something!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubFeed;
