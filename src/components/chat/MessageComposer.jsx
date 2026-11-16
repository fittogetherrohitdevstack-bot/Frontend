import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, X, Reply, Check } from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";
import { haptics } from "../../motion/Haptics";

export const MessageComposer = ({
  onSend,
  onEdit,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  // Sync text when editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      onEdit(editingMessage._id, trimmed);
    } else {
      onSend(trimmed);
    }

    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Desktop: Enter sends, Shift+Enter makes newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (typeof onTyping === "function") {
      onTyping();
    }
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const isEditing = Boolean(editingMessage);
  const isReplying = Boolean(replyingTo);
  const canSubmit = text.trim().length > 0;

  return (
    <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Floating Reply Banner */}
      {isReplying && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Replying to {replyingTo.sender?.name || "Squadmate"}
              </span>
              <p className="text-slate-500 dark:text-slate-400 truncate text-[11px] italic">
                {replyingTo.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Edit Banner */}
      {isEditing && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-bold">
            <span>Editing message</span>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1 rounded-full hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Composer Row */}
      <form onSubmit={handleSubmit} className="p-2 sm:p-3 flex items-end gap-2 max-w-4xl mx-auto">
        {/* Emoji Button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setShowEmojiPicker((p) => !p);
            }}
            className="p-2.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
            title="Add Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <ReactionPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleSelectEmoji}
            position="top"
          />
        </div>

        {/* Text Input Area */}
        <div className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3.5 py-2 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-lime-500 dark:focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-500/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isEditing
                ? "Edit your message..."
                : isReplying
                ? "Type your reply..."
                : "Message the squad... (Shift+Enter for newline)"
            }
            maxLength={2000}
            className="w-full bg-transparent resize-none outline-none text-slate-900 dark:text-slate-100 text-sm leading-relaxed placeholder:text-slate-400 max-h-[140px]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`p-2.5 sm:px-4 sm:py-2.5 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-150 shrink-0 ${
            canSubmit
              ? "bg-gradient-to-r from-lime-400 to-lime-500 text-slate-950 shadow-md shadow-lime-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
          }`}
          aria-label={isEditing ? "Save changes" : "Send message"}
        >
          {isEditing ? (
            <Check className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Send className="w-5 h-5 stroke-[2.2]" />
          )}
        </button>
      </form>
    </div>
  );
};
