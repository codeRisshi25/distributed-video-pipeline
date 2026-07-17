import UploadSection from '@/components/UploadSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Sparkles, Video, Zap } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { uploadVideo, getJobStatus } from './lib/client';
import type { Format, Resolution } from '@vid_converter/shared';

export function App() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<Format>('mp4');
  const [resolution, setResolution] = useState<Resolution>('original');
  const [jobId, setJobId] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadVideo,
    onSuccess: (data) => {
      setJobId(data.jobId);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    }
  });

  const jobQuery = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return (state === 'completed' || state === 'failed') ? false : 2000;
    },
  });

  const handleSubmit = () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }
    uploadMutation.mutate({ file, format, resolution });
  };

  const isSubmitting = uploadMutation.isPending;
  const status = jobQuery.data?.state || (jobId ? 'Queued' : 'Idle');
  const progress = jobQuery.data?.progress || 0;
  const errorMsg = jobQuery.data?.error || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:px-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Clean video conversion workspace
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Convert videos with a simple, focused workflow.
                </h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  Upload a file, choose your output settings, and let the background worker take care of the rest.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground sm:min-w-[260px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Queue status
                </span>
                <span className="font-medium text-foreground">Operational</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Supported formats
                </span>
                <span className="font-medium text-foreground">MP4 / MPEG / WebM</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Upload your clip</CardTitle>
              <CardDescription>
                Drop a file, pick your output format, and launch the job.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="format">Output format</Label>
                  <Select value={format} onValueChange={(val) => setFormat(val as Format)}>
                    <SelectTrigger id="format" className="rounded-md">
                      <SelectValue placeholder="Choose format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="mpeg">MPEG</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={(val) => setResolution(val as Resolution)}>
                    <SelectTrigger id="resolution" className="rounded-md">
                      <SelectValue placeholder="Choose resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="1280x720">720p</SelectItem>
                      <SelectItem value="480x270">480p</SelectItem>
                      <SelectItem value="360x202">360p</SelectItem>
                      <SelectItem value="240x135">240p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !file}
                  className="h-10 rounded-md bg-neutral-900 px-4 text-white hover:bg-neutral-800"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit upload'}
                </Button>
              </div>

              <UploadSection file={file} onFileChange={setFile} />
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Job snapshot</CardTitle>
              <CardDescription>
                A calm preview of the current state while the worker processes your video.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/60 p-4">
                <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Processing status</span>
                  <span className="font-medium text-foreground capitalize">{status}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {status === 'Idle' && 'Waiting for upload to begin...'}
                  {(status === 'Queued' || status === 'waiting') && 'Waiting for the worker to begin conversion...'}
                  {status === 'active' && `Converting video... ${progress}%`}
                  {status === 'completed' && 'Conversion completed successfully!'}
                  {status === 'failed' && `Conversion failed: ${errorMsg}`}
                </p>
                {jobQuery.data?.result?.outputPath && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Output saved to: {jobQuery.data.result.outputPath}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Target Format</span>
                  <span className="font-medium text-foreground uppercase">{format}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Target Resolution</span>
                  <span className="font-medium text-foreground">{resolution}</span>
                </div>
                {jobId && (
                  <div className="mt-2 flex items-center justify-between">
                    <span>Job ID</span>
                    <span className="font-medium text-foreground text-xs">{jobId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
