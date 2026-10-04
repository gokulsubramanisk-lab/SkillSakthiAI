"use client";

import React, { useState } from "react";
import {
  MessageSquarePlus,
  Search,
  MessageSquare,
  Bookmark,
  UserCheck,
  Users,
  Headphones,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Compass,
  GraduationCap,
} from "lucide-react";

interface SidebarProps {
  conversations: any[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCareersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  activeTab,
  setActiveTab,
  savedCareersCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditingTitle] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-64 md:w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* New Chat Button */}
      <div className="p-4 border-b border-slate-800/80">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-teal-500/20 transition-all transform active:scale-98"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-slate-800/60">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-lg bg-slate-800/80 pl-9 pr-3 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-slate-700/50"
          />
        </div>
      </div>

      {/* Conversations History */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Recent Conversations
        </div>

        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConversationId && activeTab === "chat";
            const isEditing = c.id === editingId;

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id);
                  setActiveTab("chat");
                }}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs md:text-sm cursor-pointer transition-all ${
                  isActive
                    ? "bg-slate-800 text-teal-300 font-medium border border-teal-500/30"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <MessageSquare className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-teal-400" : "text-slate-400"}`} />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded bg-slate-700 px-1.5 py-0.5 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    <span className="truncate">{c.title}</span>
                  )}
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(c.id, e)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleStartRename(c, e)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Rename"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Workspace Quick Links */}
      <div className="p-3 border-t border-slate-800/80 space-y-1 bg-slate-950/40">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Decision Spaces
        </div>

        <button
          onClick={() => setActiveTab("student")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition ${
            activeTab === "student"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <GraduationCap className="h-4 w-4 text-teal-400" />
            <span>Student Workspace</span>
          </div>
          {savedCareersCount > 0 && (
            <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] text-teal-300 font-semibold">
              {savedCareersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("parent")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition ${
            activeTab === "parent"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Users className="h-4 w-4 text-teal-400" />
            <span>Parent & ROI Calculator</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("counselor")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition ${
            activeTab === "counselor"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Headphones className="h-4 w-4 text-teal-400" />
            <span>Counselor Escalations</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition ${
            activeTab === "admin"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Compass className="h-4 w-4 text-teal-400" />
            <span>Admin Knowledge RAG</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
