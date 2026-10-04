"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { EvidenceModal } from "@/components/EvidenceModal";
import { StudentWorkspace } from "@/components/StudentWorkspace";
import { ParentWorkspace } from "@/components/ParentWorkspace";
import { CounselorDashboard } from "@/components/CounselorDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { DemoSwitcher } from "@/components/DemoSwitcher";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ta");
  const [currentUser, setCurrentUser] = useState<any>({
    id: "usr_student_01",
    name: "Ramesh Kumar",
    role: "student",
    language: "ta",
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [savedCareers, setSavedCareers] = useState<any[]>([]);
  const [selectedCareerIdsForCompare, setSelectedCareerIdsForCompare] = useState<string[]>([]);

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const suggestedQuestions = [
    "எனக்கு electronics பிடிக்கும். என் district-ல என்ன career நல்லா இருக்கும்?",
    "வேலூரில் ITI Electrical பயிற்சி கட்டணம் மற்றும் காலம் எவ்வளவு?",
    "Solar PV Rooftop Technician படிப்பிற்கு அரசு உதவித்தொகை உள்ளதா?",
    "Compare Electrical Technician vs Solar PV Installer for parents",
  ];

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (activeConversationId) {
      fetchConversationMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConversationId) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    }
  };

  const fetchConversationMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Conversation",
          language: selectedLanguage,
          roleContext: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations([data.conversation, ...conversations]);
        setActiveConversationId(data.conversation.id);
        setMessages([]);
        setActiveTab("chat");
      }
    } catch (e) {
      console.error("Failed to create new chat:", e);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConversationId === convId) {
        setActiveConversationId(updated[0]?.id || null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setConversations(
        conversations.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
      );
    } catch (e) {
      console.error("Failed to rename conversation:", e);
    }
  };

  const handleSendMessage = async (userText: string) => {
    setIsLoading(true);

    // Optimistic user message append
    const tempUserMsg = {
      id: "temp_usr_" + Date.now(),
      sender: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: userText,
          language: selectedLanguage,
          roleContext: currentUser.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!activeConversationId && data.conversationId) {
          setActiveConversationId(data.conversationId);
          fetchConversations();
        }

        if (data.message) {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMsg.id),
            { id: tempUserMsg.id, sender: "user", content: userText },
            data.message,
          ]);
        }
      }
    } catch (e) {
      console.error("Send message failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEvidence = (citation: any) => {
    setActiveCitation(citation);
    setEvidenceModalOpen(true);
  };

  const handleCompareCareers = (occupationIds: string[]) => {
    setSelectedCareerIdsForCompare(occupationIds);
    setActiveTab("parent");
  };

  const handleSaveCareer = (occId: string) => {
    if (!savedCareers.some((s) => s.id === occId)) {
      setSavedCareers([...savedCareers, { id: occId, title: "Electrical Technician" }]);
    }
  };

  const handleRemoveSavedCareer = (occId: string) => {
    setSavedCareers(savedCareers.filter((s) => s.id !== occId));
  };

  const handleOpenSkillGap = (occId: string) => {
    setActiveTab("student");
  };

  const handleEscalateCounselor = async (reason: string) => {
    try {
      const res = await fetch("/api/counselor/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          priority: "HIGH",
          conversationId: activeConversationId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Counselor escalation case created successfully. A counselor will review your request.");
        setActiveTab("counselor");
      }
    } catch (e) {
      console.error("Escalation error:", e);
    }
  };

  const handleSelectDemoProfile = (user: any, targetTab: string) => {
    setCurrentUser(user);
    setSelectedLanguage(user.language || "ta");
    setActiveTab(targetTab);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLanguage={selectedLanguage}
        setLanguage={setSelectedLanguage}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        notificationsCount={2}
        openDemoModal={() => setDemoModalOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedCareersCount={savedCareers.length}
        />

        {/* Dynamic Workspace View */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === "chat" && (
            <ChatArea
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              selectedLanguage={selectedLanguage}
              onOpenEvidence={handleOpenEvidence}
              onCompareCareers={handleCompareCareers}
              onSaveCareer={handleSaveCareer}
              onOpenSkillGap={handleOpenSkillGap}
              onEscalateCounselor={handleEscalateCounselor}
              suggestedQuestions={suggestedQuestions}
            />
          )}

          {activeTab === "student" && (
            <StudentWorkspace
              userProfile={currentUser.profile}
              onUpdateProfile={() => {}}
              savedCareers={savedCareers}
              onCompareCareers={handleCompareCareers}
              onSaveCareer={handleSaveCareer}
              onRemoveSavedCareer={handleRemoveSavedCareer}
              onOpenSkillGap={handleOpenSkillGap}
            />
          )}

          {activeTab === "parent" && (
            <ParentWorkspace
              selectedCareerIds={selectedCareerIdsForCompare}
              onOpenEvidence={handleOpenEvidence}
              onEscalateCounselor={handleEscalateCounselor}
            />
          )}

          {activeTab === "counselor" && (
            <CounselorDashboard counselorUser={currentUser} />
          )}

          {activeTab === "admin" && <AdminDashboard />}
        </main>
      </div>

      {/* Modals */}
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        citation={activeCitation}
      />

      <DemoSwitcher
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSelectProfile={handleSelectDemoProfile}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
