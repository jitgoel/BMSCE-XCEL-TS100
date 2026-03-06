import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, Calendar, Brain, CheckCircle, Loader2, Trash2, LogOut } from "lucide-react";
import meetingService from "@/services/meetingService";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  _id: string;
  title: string;
  meetUrl?: string;
  status: string;
  jiraIssuesCreated: boolean;
  summary?: {
    decisions: string[];
    action_items: any[];
  };
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMeetUrl, setNewMeetUrl] = useState("");
  const [newTranscript, setNewTranscript] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetings();
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load meetings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const data = await meetingService.createMeeting({
        title: newTitle,
        meetUrl: newMeetUrl || undefined,
        transcript: newTranscript || undefined
      });

      if (data.success) {
        toast({ title: "Success", description: "Meeting created!" });
        setNewTitle("");
        setNewMeetUrl("");
        setNewTranscript("");
        setShowNewMeeting(false);
        fetchMeetings();

        // Navigate to the meeting detail if transcript was provided
        if (newTranscript) {
          navigate(`/meeting/${data.meeting._id}`);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create meeting", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this meeting?")) return;

    try {
      await meetingService.deleteMeeting(id);
      toast({ title: "Deleted", description: "Meeting removed" });
      fetchMeetings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getStatusBadge = (meeting: Meeting) => {
    if (meeting.status === "analyzed") {
      return { label: "Analyzed", className: "bg-green-500/20 text-green-400" };
    }
    if (meeting.status === "completed") {
      return { label: "Has Transcript", className: "bg-blue-500/20 text-blue-400" };
    }
    return { label: "Scheduled", className: "bg-yellow-500/20 text-yellow-400" };
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage meetings, analyze transcripts, and auto-create Jira tasks
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

        {/* New Meeting Section */}
        <Card className="mb-8 border-primary/20 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Meeting
            </CardTitle>
            <CardDescription>
              Create a meeting and paste a transcript to get AI-powered summaries and Jira tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showNewMeeting ? (
              <Button
                onClick={() => setShowNewMeeting(true)}
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Meeting
              </Button>
            ) : (
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      id="title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Sprint Planning - March 6"
                      required
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meetUrl">Google Meet URL (optional)</Label>
                    <Input
                      id="meetUrl"
                      value={newMeetUrl}
                      onChange={(e) => setNewMeetUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="transcript">Paste Transcript (optional — can add later)</Label>
                  <Textarea
                    id="transcript"
                    value={newTranscript}
                    onChange={(e) => setNewTranscript(e.target.value)}
                    placeholder="Paste the meeting transcript here..."
                    rows={6}
                    className="bg-background/50 border-border/50 font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
                  >
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Meeting
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewMeeting(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Meetings Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Recent Meetings {!loading && `(${meetings.length})`}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : meetings.length === 0 ? (
            <Card className="border-dashed border-primary/20">
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No meetings yet</p>
                <p className="text-sm text-muted-foreground">Create a meeting above to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {meetings.map((meeting) => {
                const status = getStatusBadge(meeting);
                const actionCount = meeting.summary?.action_items?.length || 0;
                const decisionCount = meeting.summary?.decisions?.length || 0;

                return (
                  <Card
                    key={meeting._id}
                    className="border-primary/20 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                    onClick={() => navigate(`/meeting/${meeting._id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {meeting.title}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                            onClick={(e) => handleDelete(meeting._id, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getTimeAgo(meeting.updatedAt || meeting.createdAt)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {meeting.status === "analyzed" && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                            {decisionCount} decisions
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5 text-primary" />
                            {actionCount} tasks
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        {meeting.jiraIssuesCreated && (
                          <span className="text-xs text-muted-foreground">🎫 Jira synced</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;