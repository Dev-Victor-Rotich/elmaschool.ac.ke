import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserX, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ImpersonationBannerProps {
  userName: string;
  userRole: string;
  onExitImpersonation: () => void;
}

export const ImpersonationBanner = ({ userName, userRole, onExitImpersonation }: ImpersonationBannerProps) => {
  const navigate = useNavigate();

  const handleExit = () => {
    onExitImpersonation();
    navigate('/dashboard/superadmin');
  };

  return (
    <Alert className="bg-amber-500/10 border-amber-500 mb-4 sticky top-0 z-50">
      <Eye className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-900 dark:text-amber-100 font-medium">
          You are viewing as: <strong>{userName}</strong> ({userRole.replace('_', ' ').toUpperCase()})
        </span>
        <Button
          onClick={handleExit}
          variant="outline"
          size="sm"
          className="border-amber-500 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20"
        >
          <UserX className="h-4 w-4 mr-2" />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
};
