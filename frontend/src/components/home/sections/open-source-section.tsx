import { SectionHeader } from '@/components/home/section-header';
import { siteConfig } from '@/lib/home';
import { Github } from 'lucide-react';
import Link from 'next/link';

export function OpenSourceSection() {
  return (
    <section
      id="open-source"
      className="flex flex-col items-center justify-center w-full relative pb-18"
    >
      <div className="w-full max-w-6xl mx-auto px-6">
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            100% Open Source
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            OMNI Operator is fully open source. Join our community and help shape the
            future of AI.
          </p>
        </SectionHeader>

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 gap-6">
          <div className="group rounded-xl border bg-card text-card-foreground shadow-md p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Github className="h-6 w-6 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    <span>omni-ai/operator</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The open source generalist AI agent
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  TypeScript
                </span>
              </div>
              <Link
                href="https://github.com/omni-ai/operator"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View on GitHub
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
