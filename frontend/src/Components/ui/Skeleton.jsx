// src/Components/ui/Skeleton.jsx

/** Base shimmer block. */
export const Skeleton = ({ className = "" }) => (
    <div className={`skeleton ${className}`} />
);

/** Loading placeholder that mirrors the job card layout. */
export const JobCardSkeleton = () => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-5 rounded-md" />
        </div>
        <div className="mt-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
    </div>
);

/** Row placeholder for list items with a leading avatar/icon + two text lines
 *  (notifications, applications, simple list rows). */
export const ListRowSkeleton = () => (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <Skeleton className="h-11 w-11 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-4 w-16 rounded" />
    </div>
);

export default Skeleton;
