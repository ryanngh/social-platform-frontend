import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Heart, MessageCircle, MessageSquare, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import type { User, PostResponse, PostVisibility, CommentResponse } from '../../types';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import { securityError } from '../../services/accountSecurity';
import { extractHashtags } from '../../utils/text';
import { getMediaUrl } from '../../utils/media';
import PostCard, { formatRelativeTime } from '../post/PostCard';
import PostMediaLightbox from '../post/PostMediaLightbox';
import CommentMediaLightbox from '../post/CommentMediaLightbox';
import PostComposer from '../feed/PostComposer';
import CreatePostModal from '../feed/CreatePostModal';
import UserAvatar from '../common/UserAvatar';

interface Props { activeTab: string; user: User; isOwnProfile: boolean; isPrivate?: boolean }
interface Page<T> { content: T[]; last: boolean }

export function ProfileTabs(props: Props) {
  return <ProfileTabContent key={`${props.user.id}-${props.activeTab}`} {...props} />;
}

function ProfileReplyCard({
  reply,
  fallbackUser,
  language,
  text,
  onOpenMedia,
}: {
  reply: CommentResponse;
  fallbackUser: User;
  language: string;
  text: (vi: string, en: string) => string;
  onOpenMedia: (media: { url: string; type: 'IMAGE' | 'VIDEO'; authorName?: string }) => void;
}) {
  const [isLiked, setIsLiked] = useState(reply.isLiked ?? reply.liked ?? false);
  const [likeCount, setLikeCount] = useState(reply.likeCount ?? 0);

  const author = reply.author || {
    id: fallbackUser.id,
    username: fallbackUser.username,
    firstName: fallbackUser.firstName,
    lastName: fallbackUser.lastName,
    avatarUrl: fallbackUser.avatarUrl,
  };
  const authorName = [author.firstName, author.lastName].filter(Boolean).join(' ') || author.username || 'User';

  const handleLike = async () => {
    if (!reply.id) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      if (next) await commentService.likeComment(reply.id);
      else await commentService.unlikeComment(reply.id);
    } catch {
      setIsLiked(!next);
      setLikeCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    }
  };

  return (
    <article className="bg-white dark:bg-[#121212] rounded-3xl border border-gray-100 dark:border-[#262626] p-4 sm:p-5 shadow-2xs hover:border-gray-200 dark:hover:border-[#333333] transition duration-200 space-y-3">
      {/* Context banner */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-[#A8A8A8] pb-2 border-b border-gray-100 dark:border-[#222222]">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-[#004AC6] dark:text-[#0095F6] shrink-0" />
          <span className="truncate">{text('Đã bình luận trên', 'Commented on')}</span>
          <Link
            to={`/posts/${reply.postId}`}
            className="font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline shrink-0"
          >
            {text('bài viết', 'a post')}
          </Link>
        </div>
        <Link
          to={`/posts/${reply.postId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#004AC6] dark:text-[#A8A8A8] dark:hover:text-[#0095F6] shrink-0 transition"
        >
          <span>{text('Xem gốc', 'View post')}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Author Row */}
      <div className="flex items-center gap-3">
        <UserAvatar
          userId={author.id}
          src={author.avatarUrl}
          alt={authorName}
          size="sm"
          className="w-9 h-9 shadow-2xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <Link
              to={`/${author.username || author.id}`}
              className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#F5F5F5] hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition truncate"
            >
              {authorName}
            </Link>
            <span className="text-[11px] sm:text-xs text-gray-400 dark:text-[#737373] truncate">
              @{author.username}
            </span>
            <span className="text-gray-300 dark:text-[#404040]">•</span>
            <time
              dateTime={reply.createdAt}
              className="text-[11px] sm:text-xs text-gray-400 dark:text-[#737373]"
            >
              {formatRelativeTime(reply.createdAt, language)}
            </time>
          </div>
        </div>
      </div>

      {/* Reply Body */}
      {reply.content && (
        <p className="text-xs sm:text-sm text-gray-800 dark:text-[#E5E5E5] leading-relaxed whitespace-pre-wrap break-words pl-12">
          {reply.content}
        </p>
      )}

      {/* Reply Media */}
      {reply.media && reply.media.length > 0 && (
        <div className="flex gap-2 flex-wrap pl-12 pt-1">
          {reply.media.map((media, index) => {
            const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(media.mediaUrl);
            const url = getMediaUrl(media.mediaUrl);
            return (
              <div
                key={index}
                onClick={() => onOpenMedia({ url: media.mediaUrl, type: isVideo ? 'VIDEO' : 'IMAGE', authorName })}
                className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-[#262626] max-w-xs max-h-60 cursor-pointer group bg-black/5 dark:bg-white/5"
              >
                {isVideo ? (
                  <video src={url} className="w-full h-full object-cover max-h-60" preload="metadata" />
                ) : (
                  <img
                    src={url}
                    alt={text('Ảnh bình luận', 'Comment media')}
                    loading="lazy"
                    className="w-full h-full object-cover max-h-60 group-hover:scale-[1.02] transition-transform duration-200"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-3 pl-12 pt-1 text-xs">
        <button
          type="button"
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-semibold transition cursor-pointer ${
            isLiked
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
              : 'text-gray-500 dark:text-[#A8A8A8] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <Link
          to={`/posts/${reply.postId}`}
          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full font-semibold text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] dark:hover:text-[#0095F6] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {reply.replyCount > 0 && <span>{reply.replyCount}</span>}
        </Link>
      </div>
    </article>
  );
}

function ProfileTabContent({ activeTab, user, isOwnProfile, isPrivate }: Props) {
  const { language, t } = useLanguage();
  const { user: viewer } = useAuth();
  const text = (vi: string, en: string) => (language === 'vi' ? vi : en);
  const tab = activeTab.toLowerCase();
  const allowed = isOwnProfile || (!isPrivate && user.profileTabAccess?.[tab] !== false);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [replies, setReplies] = useState<CommentResponse[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [revision, setRevision] = useState(0);
  const [lightbox, setLightbox] = useState<{ post: PostResponse; index: number }>();
  const [commentLightboxMedia, setCommentLightboxMedia] = useState<{
    url: string;
    type: 'IMAGE' | 'VIDEO';
    authorName?: string;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!allowed) return;
    const requestId = ++requestRef.current;
    let disposed = false;
    setBusy(true);
    setError('');

    const load = async () => {
      try {
        if (tab === 'replies') {
          const result = (
            await api.get<Page<CommentResponse>>(`/users/${user.id}/replies`, { params: { page, size: 20 } })
          ).data;
          if (!disposed && requestId === requestRef.current) {
            setReplies((prev) => (page ? [...prev, ...result.content] : result.content));
            setMore(!result.last);
          }
        } else {
          let result: Page<PostResponse>;
          if (tab === 'reposts') {
            const entries = (
              await api.get<Page<{ originalPostId: string }>>(`/users/${user.id}/reposts`, {
                params: { page, size: 20 },
              })
            ).data;
            const content = await Promise.all(entries.content.map((entry) => postService.getPostById(entry.originalPostId)));
            result = { content, last: entries.last };
          } else {
            result = (await api.get<Page<PostResponse>>(`/users/${user.id}/${tab}`, { params: { page, size: 20 } })).data;
          }
          if (!disposed && requestId === requestRef.current) {
            setPosts((prev) => (page ? [...prev, ...result.content] : result.content));
            setMore(!result.last);
          }
        }
      } catch (e) {
        if (!disposed) {
          const code = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
          setLocked(code === 'PROFILE_TAB_PRIVATE');
          setError(securityError(e));
        }
      } finally {
        if (!disposed) setBusy(false);
      }
    };

    void load();
    return () => {
      disposed = true;
    };
  }, [allowed, user.id, tab, page, revision]);

  const update = (post: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    setLightbox((prev) => (prev?.post.id === post.id ? { ...prev, post } : prev));
  };

  const remove = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setLightbox((prev) => (prev?.post.id === id ? undefined : prev));
  };

  const create = async (
    content: string,
    media?: import('../../types').PostMediaRequest[],
    visibility: PostVisibility = 'PUBLIC'
  ) => {
    await postService.createPost({
      content,
      media: media || [],
      visibility,
      hashtags: extractHashtags(content),
      taggedUserIds: [],
    });
    setPage(0);
    setRevision((n) => n + 1);
    setCreateOpen(false);
    toast.success(t('feed.postSuccess'));
  };

  if (!allowed || locked) {
    return (
      <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center mx-auto text-gray-500 dark:text-[#A8A8A8]">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
          {text('Mục này riêng tư', 'This section is private')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
          {text('Bạn không có quyền xem nội dung trong mục này.', 'You do not have access to this section.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tab === 'posts' && isOwnProfile && <PostComposer onOpenCreateModal={() => setCreateOpen(true)} />}

      {tab === 'replies' ? (
        replies.map((reply) => (
          <ProfileReplyCard
            key={reply.id}
            reply={reply}
            fallbackUser={user}
            language={language}
            text={text}
            onOpenMedia={(m) => setCommentLightboxMedia(m)}
          />
        ))
      ) : tab === 'media' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {posts.flatMap((post) =>
            post.media.map((media, index) => (
              <button
                type="button"
                key={`${post.id}-${media.id}`}
                onClick={() => setLightbox({ post, index })}
                className="aspect-square rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-gray-800 cursor-pointer group"
                aria-label={text('Xem ảnh hoặc video', 'View photo or video')}
              >
                {media.mediaType === 'VIDEO' ? (
                  <>
                    <video
                      src={getMediaUrl(media.mediaUrl)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      preload="metadata"
                    />
                    <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 text-white px-2 py-0.5 text-xs font-semibold backdrop-blur-xs">
                      Video
                    </span>
                  </>
                ) : (
                  <img
                    src={getMediaUrl(media.mediaUrl)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}
              </button>
            ))
          )}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            language={language}
            isAuthor={viewer?.id === post.author.id}
            onOpenLightbox={(post, index) => setLightbox({ post, index })}
            onPostUpdated={update}
            onPostDeleted={remove}
          />
        ))
      )}

      {busy && <p role="status" className="p-5 text-center text-xs text-gray-500 dark:text-[#A8A8A8]">{text('Đang tải…', 'Loading…')}</p>}

      {error && !locked && (
        <div role="alert" className="p-5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-3 text-center">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => setRevision((n) => n + 1)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#004AC6] text-white hover:bg-[#003da3] transition cursor-pointer"
          >
            {text('Thử lại', 'Retry')}
          </button>
        </div>
      )}

      {!busy && !error && !(tab === 'replies' ? replies.length : posts.length) && (
        <div className="p-8 text-center bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl shadow-2xs">
          <p className="text-sm text-gray-500 dark:text-[#A8A8A8]">
            {tab === 'replies' ? text('Chưa có phản hồi nào.', 'No replies yet.') : text('Chưa có nội dung.', 'No content yet.')}
          </p>
        </div>
      )}

      {more && !error && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setPage((n) => n + 1)}
          className="w-full py-2.5 rounded-2xl text-xs font-semibold border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer disabled:opacity-50"
        >
          {text('Tải thêm', 'Load more')}
        </button>
      )}

      {lightbox && (
        <PostMediaLightbox
          post={lightbox.post}
          initialMediaIndex={lightbox.index}
          isOpen
          onClose={() => setLightbox(undefined)}
          onPostUpdated={update}
          onPostDeleted={remove}
        />
      )}

      {commentLightboxMedia && (
        <CommentMediaLightbox
          isOpen={!!commentLightboxMedia}
          onClose={() => setCommentLightboxMedia(null)}
          media={commentLightboxMedia}
          authorName={commentLightboxMedia?.authorName}
        />
      )}

      <CreatePostModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSubmitPost={create} />
    </div>
  );
}

export default ProfileTabs;
