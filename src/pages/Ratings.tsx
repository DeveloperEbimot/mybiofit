import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RatingRow {
  id: string;
  rating: number;
  user_id: string | null;
  created_at: string;
}

export default function Ratings() {
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ratings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRatings((data as RatingRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : "—";

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="font-display text-3xl font-bold text-foreground">User Ratings</h1>

      {loading ? (
        <div className="glass-card p-8 animate-pulse h-40" />
      ) : ratings.length === 0 ? (
        <p className="text-muted-foreground">No ratings yet.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="glass-card p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="font-display text-5xl font-bold text-foreground">{avg}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(Number(avg)) ? "text-biofit-amber fill-biofit-amber" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{ratings.length} rating{ratings.length !== 1 && "s"}</p>
            </div>

            <div className="flex-1 space-y-1">
              {distribution.map(({ star, count }) => {
                const pct = ratings.length ? (count / ratings.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-right text-muted-foreground">{star}</span>
                    <Star className="w-3 h-3 text-biofit-amber fill-biofit-amber" />
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-biofit-amber" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-xs text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual ratings */}
          <div className="space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= r.rating ? "text-biofit-amber fill-biofit-amber" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
