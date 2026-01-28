import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, DollarSign, Calendar, MessageSquare, Mail, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatBalance } from "@/lib/fee-utils";

interface DashboardOverviewProps {
  studentData: any;
  events: any[];
  messages: any[];
  cumulativeData: {
    totalFees: number;
    totalPaid: number;
    finalBalance: number;
    status: 'cleared' | 'due' | 'credit';
  };
  onOpenMessage: (msg: any) => void;
}

const DashboardOverview = ({ 
  studentData, 
  events, 
  messages, 
  cumulativeData, 
  onOpenMessage 
}: DashboardOverviewProps) => {
  const unreadCount = messages.filter((m: any) => !m.is_read).length;
  const balanceFormatted = formatBalance(cumulativeData.finalBalance);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Parent Name</p>
              <p className="font-medium">{studentData.parent_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parent Phone</p>
              <p className="font-medium">{studentData.parent_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Fee Status */}
        <Card className={`${
          cumulativeData.finalBalance < 0 
            ? 'border-green-500/50 bg-green-500/5' 
            : cumulativeData.finalBalance > 0 
              ? 'border-amber-500/50 bg-amber-500/5' 
              : 'border-primary/50'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                {cumulativeData.finalBalance < 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : cumulativeData.finalBalance > 0 ? (
                  <TrendingDown className="w-6 h-6 text-amber-600" />
                ) : null}
                <span className={`text-2xl font-bold ${balanceFormatted.className}`}>
                  {cumulativeData.finalBalance < 0 
                    ? `Credit: KES ${Math.abs(cumulativeData.finalBalance).toLocaleString()}`
                    : cumulativeData.finalBalance > 0 
                      ? `Due: KES ${cumulativeData.finalBalance.toLocaleString()}`
                      : "Cleared"
                  }
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Total Fees: KES {cumulativeData.totalFees.toLocaleString()} • 
                Total Paid: KES {cumulativeData.totalPaid.toLocaleString()}
              </p>
              {cumulativeData.finalBalance < 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Credit applies to future fees
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="border-l-2 border-primary pl-2">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <div className="space-y-2">
                {messages.slice(0, 3).map((msg: any) => (
                  <div 
                    key={msg.id} 
                    className={`p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                      !msg.is_read ? "bg-primary/10 border-l-2 border-primary" : "bg-muted/30"
                    }`}
                    onClick={() => onOpenMessage(msg)}
                  >
                    <div className="flex items-center gap-2">
                      {!msg.is_read ? (
                        <Mail className="w-3 h-3 text-primary" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                      <p className="text-sm font-medium truncate">{msg.class_messages?.subject}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {messages.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{messages.length - 3} more messages
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No messages</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Messages Section */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              All Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {messages.map((msg: any) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors border ${
                      !msg.is_read ? "bg-primary/5 border-primary/30" : "border-transparent"
                    }`}
                    onClick={() => onOpenMessage(msg)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!msg.is_read ? (
                          <Mail className="w-4 h-4 text-primary" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <p className="font-medium">{msg.class_messages?.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {msg.class_messages?.message}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
