import { Gem } from "lucide-react";
import { MAX_SHARDS, nextShardLabel, useForge } from "@/lib/progress";

export function ShardMeter() {
  const shards = useForge((s) => s.shards);
  const shardAt = useForge((s) => s.shardAt);
  const wait = nextShardLabel(shards, shardAt);
  return (
    <div className="flex items-center gap-2 font-mono text-xs text-copper" title="Hint shards. One returns every 4 hours, up to 5.">
      <Gem className="size-4" aria-hidden="true" />
      <span>
        {shards}/{MAX_SHARDS}
      </span>
      {wait ? <span className="text-muted">+1 in {wait}</span> : null}
    </div>
  );
}
