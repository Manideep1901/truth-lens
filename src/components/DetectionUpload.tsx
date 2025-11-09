import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DetectionResult {
  isReal: boolean;
  score: number;
  imageUrl: string;
  filename: string;
}

interface DetectionUploadProps {
  onDetectionComplete: () => void;
}

const DetectionUpload = ({ onDetectionComplete }: DetectionUploadProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setReview('');
    }
  };

  const analyzeImage = async () => {
    if (!file || !user) return;

    try {
      setAnalyzing(true);

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('detections')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('detections')
        .getPublicUrl(fileName);

      // Call edge function for detection
      const { data: detectionData, error: detectionError } = await supabase.functions.invoke('analyze-deepfake', {
        body: { imageUrl: publicUrl }
      });

      if (detectionError) throw detectionError;

      const isReal = detectionData.isReal;
      const score = detectionData.score;

      // Save to database
      const { error: dbError } = await supabase
        .from('detections')
        .insert({
          user_id: user.id,
          filename: file.name,
          is_real: isReal,
          prediction_score: score,
          image_url: publicUrl,
        });

      if (dbError) throw dbError;

      setResult({
        isReal,
        score,
        imageUrl: publicUrl,
        filename: file.name,
      });

      toast.success('Analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const submitReview = async () => {
    if (!result || !user || !review.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmittingReview(true);

      const { error } = await supabase
        .from('detections')
        .update({ user_review: review })
        .eq('image_url', result.imageUrl)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Review submitted!');
      setReview('');
      setFile(null);
      setPreview(null);
      setResult(null);
      onDetectionComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Upload Image for Detection</CardTitle>
          <CardDescription>
            Upload an image to detect if it's real or AI-generated/deepfake
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            )}
          </div>

          {file && !result && (
            <Button
              onClick={analyzeImage}
              disabled={analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Image'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={`border-2 ${result.isReal ? 'border-success' : 'border-warning'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.isReal ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <AlertCircle className="h-8 w-8 text-warning" />
              )}
              <div>
                <CardTitle>
                  {result.isReal ? 'Real Image' : 'Potential Deepfake'}
                </CardTitle>
                <CardDescription>
                  Confidence Score: {result.score.toFixed(2)}%
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={result.score} className="h-2" />
            
            <div className="space-y-2">
              <Label htmlFor="review">Share your feedback (optional)</Label>
              <Textarea
                id="review"
                placeholder="Was this detection accurate? Any comments?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={submitReview}
              disabled={submittingReview}
              className="w-full"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetectionUpload;
