import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCheck, Heart, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { STOCK_COMMENTS, stanceFromText } from '../data/comments'

function Avatar({ emoji, bg, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45,
    }}>
      {emoji}
    </div>
  )
}

function CommentRow({ comment, isReply = false, onReply, onLike }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ paddingLeft: isReply ? 40 : 0 }}>
      <div style={{ display: 'flex', gap: 10, paddingBottom: 12 }}>
        <Avatar emoji={comment.avatar} bg={comment.avatarBg} size={isReply ? 28 : 34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              @{comment.user}
            </span>
            {comment.stance && comment.stance !== 'neutral' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: comment.stance === 'bull' ? 'rgba(67,233,123,0.16)' : 'rgba(255,75,110,0.16)',
                color: comment.stance === 'bull' ? '#2dd284' : '#ff4b6e',
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 999,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {comment.stance}
              </span>
            )}
            {comment.verified && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: comment.badge === 'Analyst' ? 'rgba(67,233,123,0.12)' : 'rgba(79,172,254,0.12)',
                color: comment.badge === 'Analyst' ? '#43e97b' : '#4facfe',
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 'var(--radius-sm)', letterSpacing: '0.04em',
              }}>
                <BadgeCheck size={10} strokeWidth={2.5} />
                {comment.badge}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {comment.time}
            </span>
          </div>

          {/* Comment text */}
          <p style={{
            fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55,
            margin: 0, wordBreak: 'break-word',
          }}>
            {comment.text}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <button
              onClick={() => onLike(comment.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none',
                color: comment.liked ? '#ff4757' : 'var(--text-tertiary)',
                fontSize: 12, cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              <Heart
                size={13}
                fill={comment.liked ? '#ff4757' : 'none'}
                strokeWidth={2}
              />
              {comment.likes.toLocaleString()}
            </button>

            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: 12, cursor: 'pointer',
                }}
              >
                <MessageCircle size={13} strokeWidth={2} />
                Reply
              </button>
            )}

            {!isReply && comment.replies?.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none',
                  color: 'var(--accent-blue)',
                  fontSize: 11, cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <AnimatePresence>
        {!isReply && expanded && comment.replies?.map((reply) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <CommentRow
              comment={reply}
              isReply
              onLike={onLike}
              onReply={() => {}}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function CommentsSection({ ticker }) {
  const tagWithStance = (comment) => ({
    ...comment,
    stance: stanceFromText(comment.text),
    replies: comment.replies?.map(tagWithStance) ?? [],
  })

  const [comments, setComments] = useState(() => (STOCK_COMMENTS[ticker] ?? []).map(tagWithStance))
  const [newText, setNewText]     = useState('')
  const [replyToId, setReplyToId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [filter, setFilter]       = useState('all')
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  // Reset when ticker changes
  useEffect(() => {
    setComments((STOCK_COMMENTS[ticker] ?? []).map(tagWithStance))
    setNewText('')
    setReplyToId(null)
    setReplyText('')
    setFilter('all')
  }, [ticker])

  function handleLike(commentId) {
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) return { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked }
      return {
        ...c,
        replies: c.replies?.map((r) =>
          r.id === commentId ? { ...r, likes: r.liked ? r.likes - 1 : r.likes + 1, liked: !r.liked } : r
        ),
      }
    }))
  }

  function handleReply(commentId) {
    setReplyToId(commentId === replyToId ? null : commentId)
    setReplyText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function submitReply() {
    if (!replyText.trim()) return
    const myReply = {
      id: `reply-${Date.now()}`,
      user: 'you',
      avatar: '😎',
      avatarBg: '#4facfe',
      verified: false,
      time: 'just now',
      text: replyText.trim(),
      likes: 0,
      liked: false,
    }
    setComments((prev) => prev.map((c) =>
      c.id === replyToId
        ? { ...c, replies: [...(c.replies || []), myReply] }
        : c
    ))
    setReplyToId(null)
    setReplyText('')
  }

  function submitComment() {
    if (!newText.trim()) return
    const myComment = {
      id: `comment-${Date.now()}`,
      user: 'you',
      avatar: '😎',
      avatarBg: '#4facfe',
      verified: false,
      badge: null,
      time: 'just now',
      text: newText.trim(),
      likes: 0,
      liked: false,
      replies: [],
      stance: stanceFromText(newText.trim()),
    }
    setComments((prev) => [myComment, ...prev])
    setNewText('')
    // Scroll to top
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)
  const replyingTo = replyToId ? comments.find((c) => c.id === replyToId) : null
  const filtered = comments.filter((c) => filter === 'all' ? true : c.stance === filter || (c.stance === 'neutral' && filter === 'bull'))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px 8px',
        flexShrink: 0,
      }}>
        <MessageCircle size={14} color="var(--text-tertiary)" strokeWidth={2} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Community
        </span>
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)', marginLeft: 2,
        }}>
          {totalCount.toLocaleString()}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 999, padding: 4 }}>
          {[
            { key: 'all',  label: 'All' },
            { key: 'bull', label: 'Bull' },
            { key: 'bear', label: 'Bear' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                background: filter === opt.key ? 'rgba(79,172,254,0.12)' : 'transparent',
                color: filter === opt.key ? '#4facfe' : 'var(--text-tertiary)',
                border: 'none', borderRadius: 999,
                padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable comment list */}
      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '4px 20px 8px',
          scrollbarWidth: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {filtered.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CommentRow
                comment={comment}
                onLike={handleLike}
                onReply={handleReply}
              />
              <div style={{ height: 1, background: 'var(--border)', opacity: 0.5, marginBottom: 12 }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reply context banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '6px 20px',
              background: 'rgba(79,172,254,0.08)',
              borderTop: '1px solid rgba(79,172,254,0.15)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--accent-blue)' }}>
              Replying to @{replyingTo.user}
            </span>
            <button
              onClick={() => setReplyToId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 8, cursor: 'pointer' }}
            >
              cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px 14px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-primary)',
      }}>
        <Avatar emoji="😎" bg="#4facfe" size={30} />
        <input
          ref={inputRef}
          value={replyToId ? replyText : newText}
          onChange={(e) => replyToId ? setReplyText(e.target.value) : setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              replyToId ? submitReply() : submitComment()
            }
          }}
          placeholder={replyToId ? `Reply to @${replyingTo?.user}…` : 'Add your take…'}
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '8px 14px',
            fontSize: 13,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={replyToId ? submitReply : submitComment}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-green)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Send size={15} color="#000" strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  )
}
