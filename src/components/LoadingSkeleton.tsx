import React from 'react';

const LoadingSkeleton = () => (
    <main className="flex-1 pt-24 pb-12 flex justify-center px-6">
        <div className="w-full max-w-[720px] flex flex-col items-center">
            <div className="w-full space-y-4 mb-12">
                <div className="h-10 w-3/4 mx-auto rounded-lg bg-slate-200 dark:bg-slate-800 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
                <div className="h-4 w-32 mx-auto rounded bg-slate-200 dark:bg-slate-800/60 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
            </div>
            <div className="w-full space-y-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
                        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
                        <div className="h-4 w-[96%] rounded bg-slate-200 dark:bg-slate-800 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
                        <div className="h-4 w-[60%] rounded bg-slate-200 dark:bg-slate-800 sepia:bg-sepia-secondary/10 skeleton-shimmer"></div>
                    </div>
                ))}
            </div>
        </div>
    </main>
);

export default LoadingSkeleton;
