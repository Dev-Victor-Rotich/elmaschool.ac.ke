import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pin, MessageCircle, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import ClubComments from "./ClubComments";

interface ClubPostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    is_pinned: boolean;
    created_at: string;
    author_id: string;
    author_type: "patron" | "student";
    author_name?: string;
    author_role?: string;
    comment_count?: number;
  };
  currentUserId: string;
  currentUserType: "patron" | "student";
  canPin?: boolean;
  onDelete?: (postId: string) => void;
  onTogglePin?: (postId: string, isPinned: boolean) => void;
}

const ClubPostCard = ({
  post,
  currentUserId,
  currentUserType,
  canPin = false,
  onDelete,
  onTogglePin,
}: ClubPostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  
  const isAuthor = 
    (post.author_type === currentUserType && post.author_id === currentUserId) ||
    (currentUserType === "patron");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`${post.is_pinned ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={post.author_type === "patron" ? "bg-primary/20 text-primary" : "bg-secondary/20"}>
                {getInitials(post.author_name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.author_name || "Unknown"}</span>
                {post.author_type === "patron" && (
                  <Badge variant="secondary" className="text-xs">Patron</Badge>
                )}
                {post.author_role && post.author_role !== "member" && (
                  <Badge variant="outline" className="text-xs capitalize">{post.author_role}</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {post.is_pinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
            {(isAuthor || canPin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canPin && onTogglePin && (
                    <DropdownMenuItem onClick={() => onTogglePin(post.id, !post.is_pinned)}>
                      <Pin className="h-4 w-4 mr-2" />
                      {post.is_pinned ? "Unpin" : "Pin"} Post
                    </DropdownMenuItem>
                  )}
                  {isAuthor && onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(post.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post image" 
            className="mt-3 rounded-lg max-h-96 object-cover w-full"
          />
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t flex-col items-stretch gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {post.comment_count || 0} Comments
        </Button>

        {showComments && (
          <ClubComments 
            postId={post.id}
            currentUserId={currentUserId}
            currentUserType={currentUserType}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default ClubPostCard;
