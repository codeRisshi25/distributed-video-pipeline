import UploadSection from '@/components/UploadSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Sparkles, Video, Zap } from 'lucide-react';

export function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: read the selected file, output format, and resolution from shared state.
      // TODO: submit the selected file, format, and resolution to the API.
      // TODO: store the returned job id and wire it into the job status UI.
      // TODO: surface success/error feedback and reset the form when appropriate.
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <span className="font-medium text-foreground">2 active</span>
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
              {/* TODO: convert this control row into a single controlled form with submit state. */}
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="format">Output format</Label>
                  <Select defaultValue="mp4">
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
                  <Select defaultValue="original">
                    <SelectTrigger id="resolution" className="rounded-md">
                      <SelectValue placeholder="Choose resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Original</SelectItem>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="360p">360p</SelectItem>
                      <SelectItem value="240p">240p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-10 rounded-md bg-neutral-900 px-4 text-white hover:bg-neutral-800"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit upload'}
                </Button>
              </div>

              <UploadSection />
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
                  <span className="font-medium text-foreground">Queued</span>
                </div>
                <Progress value={35} className="h-2" />
                <p className="mt-3 text-sm text-muted-foreground">Waiting for the worker to begin conversion…</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Estimated wait</span>
                  <span className="font-medium text-foreground">~1 min</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Output target</span>
                  <span className="font-medium text-foreground">MP4</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
