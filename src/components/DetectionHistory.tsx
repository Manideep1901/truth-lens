import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Detection {
  id: string;
  filename: string;
  uploaded_at: string;
  is_real: boolean;
  prediction_score: number;
  user_review: string | null;
  image_url: string;
}

const DetectionHistory = () => {
  const { user } = useAuth();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDetections(data || []);
    } catch (error: any) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No detections yet</p>
          <p className="text-sm text-muted-foreground">Upload your first image to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Detection History</CardTitle>
          <CardDescription>
            View all your previous image analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {detections.map((detection) => (
                <Card key={detection.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <img
                        src={detection.image_url}
                        alt={detection.filename}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{detection.filename}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(detection.uploaded_at).toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            variant={detection.is_real ? 'default' : 'destructive'}
                            className="gap-1"
                          >
                            {detection.is_real ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {detection.is_real ? 'Real' : 'Fake'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Score:</span>
                          <span className="font-medium">{detection.prediction_score.toFixed(2)}%</span>
                        </div>

                        {detection.user_review && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Your Review:</p>
                            <p className="text-sm">{detection.user_review}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetectionHistory;
