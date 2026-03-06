import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, CheckCircle, Clock, FileText, Loader2, AlertTriangle } from "lucide-react";
import meetingService from "@/services/meetingService";
import { useToast } from "@/hooks/use-toast";

interface ActionItem {
  Summary: string;
  Assignee: string;
  Priority: string;
  "Due date": string;
  jiraIssueKey?: string;
}

interface Meeting {
  _id: string;
  title: string;
  meetUrl?: string;
  transcript: string;
  summary: {
    decisions: string[];
    action_items: ActionItem[];
  };
  status: string;
  jiraIssuesCreated: boolean;
  createdAt: string;
}

const MeetingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [savingTranscript, setSavingTranscript] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetingById(id!);
      if (data.success) {
        setMeeting(data.meeting);
        setTranscriptText(data.meeting.transcript || "");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load meeting", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTranscript = async () => {
    try {
      setSavingTranscript(true);
      const data = await meetingService.addTranscript(id!, transcriptText);
      if (data.success) {
        setMeeting(data.meeting);
        setEditingTranscript(false);
        toast({ title: "Success", description: "Transcript saved" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save transcript", variant: "destructive" });
    } finally {
      setSavingTranscript(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      toast({ title: "Analyzing...", description: "AI is processing the transcript. This may take a minute." });
      const data = await meetingService.analyzeMeeting(id!);
      if (data.success) {
        setMeeting(data.meeting);
        toast({ title: "Analysis Complete", description: "Decisions and action items extracted. Jira tickets created!" });
      } else {
        toast({ title: "Error", description: data.message || "Analysis failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze meeting", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Highest": return "bg-red-500/20 text-red-400";
      case "High": return "bg-orange-500/20 text-orange-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Low": return "bg-blue-500/20 text-blue-400";
      case "Lowest": return "bg-gray-500/20 text-gray-400";
      default: return "bg-primary/20 text-primary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "analyzed": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "completed": return <FileText className="h-4 w-4 text-blue-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <p className="text-muted-foreground">Meeting not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {meeting.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {getStatusIcon(meeting.status)}
                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)} · {new Date(meeting.createdAt).toLocaleDateString()}
              </p>
            </div>
            {meeting.transcript && meeting.status !== "analyzed" && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
              >
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" /> Analyze with AI</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Transcript Section */}
        <Card className="mb-6 border-primary/20 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transcript
              </CardTitle>
              {!editingTranscript && (
                <Button variant="outline" size="sm" onClick={() => setEditingTranscript(true)}>
                  {meeting.transcript ? "Edit" : "Add Transcript"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingTranscript ? (
              <div className="space-y-3">
                <Textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste your meeting transcript here..."
                  rows={12}
                  className="bg-background/50 border-border/50 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTranscript}
                    disabled={savingTranscript}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    {savingTranscript ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Transcript
                  </Button>
                  <Button variant="outline" onClick={() => { setEditingTranscript(false); setTranscriptText(meeting.transcript || ""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : meeting.transcript ? (
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-background/30 rounded-lg p-4 max-h-60 overflow-y-auto font-mono">
                {meeting.transcript}
              </pre>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-yellow-400 mb-3" />
                <p className="text-muted-foreground">No transcript yet. Add one to enable AI analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Summary Section */}
        {meeting.summary && (meeting.summary.decisions?.length > 0 || meeting.summary.action_items?.length > 0) && (
          <>
            {/* Decisions */}
            {meeting.summary.decisions?.length > 0 && (
              <Card className="mb-6 border-green-500/20 shadow-xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    Decisions ({meeting.summary.decisions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.summary.decisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-3 bg-background/30 rounded-lg p-3">
                        <span className="text-green-400 font-bold text-sm mt-0.5">{i + 1}.</span>
                        <span className="text-sm">{d}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            {meeting.summary.action_items?.length > 0 && (
              <Card className="mb-6 border-primary/20 shadow-xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Action Items ({meeting.summary.action_items.length})
                  </CardTitle>
                  <CardDescription>
                    {meeting.jiraIssuesCreated && "✅ Jira tickets created for all items"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Task</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Assignee</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Priority</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meeting.summary.action_items.map((item, i) => (
                          <tr key={i} className="border-b border-border/20 hover:bg-background/30 transition-colors">
                            <td className="py-3 px-2">{item.Summary}</td>
                            <td className="py-3 px-2 text-muted-foreground">{item.Assignee}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.Priority)}`}>
                                {item.Priority}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">{item["Due date"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingDetail;
