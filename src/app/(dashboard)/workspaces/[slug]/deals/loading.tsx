import { Skeleton } from "@/components/ui/skeleton";

export default function DealsLoading() {
  return (
    <div className="flex h-full flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full gap-4 min-w-max pb-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="w-[300px] flex-shrink-0 flex flex-col gap-3 bg-muted/30 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-card border rounded-md p-4 shadow-sm">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
