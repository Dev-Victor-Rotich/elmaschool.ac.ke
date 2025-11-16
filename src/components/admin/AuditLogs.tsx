import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export const AuditLogs = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Fetch profile names separately
      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(log => log.action_by).filter(Boolean),
          ...data.map(log => log.target_user).filter(Boolean)
        ])];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds as string[]);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        return data.map(log => ({
          ...log,
          action_by_name: log.action_by ? profileMap.get(log.action_by) || 'System' : 'System',
          target_user_name: log.target_user ? profileMap.get(log.target_user) || 'N/A' : 'N/A'
        }));
      }
      
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No audit logs available
      </div>
    );
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('approve') || action.includes('assign')) return 'default';
    if (action.includes('reject') || action.includes('remove') || action.includes('delete')) return 'destructive';
    if (action.includes('transfer')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Badge variant="outline">Last 100 actions</Badge>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Target User</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log: any) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm">
                {log.created_at ? format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={getActionBadgeVariant(log.action_type)}>
                  {log.action_type.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {log.action_by_name || 'System'}
              </TableCell>
              <TableCell>
                {log.target_user_name || 'N/A'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.details || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};