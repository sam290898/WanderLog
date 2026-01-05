"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Instagram, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { processVideo } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    if (!url.includes("instagram.com")) {
      setError("Please enter a valid Instagram URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await processVideo(url);
      router.push(`/trip/${data.id}`);
    } catch (err: any) { // eslint-disable-line
      console.error(err);
      setError("Failed to process video. Make sure the backend is running.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-2xl w-full space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="p-3 bg-white/5 rounded-2xl glass border border-white/10">
              <MapPin className="w-8 h-8 text-indigo-400" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            WanderLog
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Stop screenshotting. Start traveling. <br />
            Turn Instagram Reels into actionable itineraries in seconds.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="w-full max-w-md mx-auto space-y-4"
        >
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
              <Instagram className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Paste Instagram Reel URL..."
              className="pl-10 h-14 text-lg bg-white/5 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 rounded-xl transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Magic...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Plan My Trip <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}
        </motion.form>
      </motion.div>
    </main>
  );
}
