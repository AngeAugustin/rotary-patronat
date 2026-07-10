import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import { fetchFeed, togglePostLike } from '../api';
import { CreatePostForm } from '../components/CreatePostForm';
import { PostCard } from '../components/PostCard';
import { PostCommentsPanel } from '../components/PostCommentsPanel';
import { queryKeys } from '@/lib/query-keys';
import { connectRealtime } from '@/lib/realtime-client';
import { fadeInUp, staggerChildren } from '@/design-system/motion';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';

export function FeedPage() {
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.feed.list(''),
    queryFn: () => fetchFeed({ page: 1 }),
  });

  useEffect(() => {
    const socket = connectRealtime();
    const onFeedUpdate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
    };
    socket.on('feed:updated', onFeedUpdate);
    return () => {
      socket.off('feed:updated', onFeedUpdate);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list('') });
    },
  });

  if (isLoading) {
    return (
      <DashboardPageShell width="narrow">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-40" />
          ))}
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell width="narrow">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <DashboardPageHeader
            eyebrow="Vie du club"
            title="Fil d'actualité"
            description="Publications, annonces et événements du club."
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <CreatePostForm />
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          {data?.data.map((post) => (
            <div key={post.id} className="space-y-3">
              <PostCard
                post={post}
                onLike={() => likeMutation.mutate(post.id)}
                onComment={() =>
                  setOpenCommentsPostId((current) =>
                    current === post.id ? null : post.id,
                  )
                }
                liking={likeMutation.isPending}
              />
              {openCommentsPostId === post.id && (
                <PostCommentsPanel
                  postId={post.id}
                  onClose={() => setOpenCommentsPostId(null)}
                />
              )}
            </div>
          ))}
          {data?.data.length === 0 && (
            <DashboardEmptyState
              message="Aucune publication pour le moment"
              description="Soyez le premier à partager une actualité avec le club."
              icon={Newspaper}
            />
          )}
        </motion.div>
      </motion.div>
    </DashboardPageShell>
  );
}
