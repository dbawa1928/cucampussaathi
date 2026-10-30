import React, { useState, useEffect } from 'react';
import {
  UsersRound,
  Plus,
  Users,
  Calendar,
  Globe,
  Loader2,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type LearningGroup,
  type SkillItem,
  type LearningMessage,
} from '../../api/learnTeachApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const LearningGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [groups, setGroups] = useState<LearningGroup[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillId, setSkillId] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [preferredMode, setPreferredMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('BOTH');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [creating, setCreating] = useState(false);

  // Group Chat Drawer
  const [activeGroupChat, setActiveGroupChat] = useState<LearningGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<LearningMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsData, skillsData] = await Promise.all([
        learnTeachApi.getGroups(),
        learnTeachApi.getSkills(),
      ]);
      setGroups(groupsData);
      setSkills(skillsData);
      if (skillsData.length > 0 && !skillId) setSkillId(skillsData[0]._id);
    } catch (err) {
      console.error('Failed to load learning groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket room for Group Chat
  useEffect(() => {
    if (!activeGroupChat) return;

    learnTeachApi
      .getMessages({ groupId: activeGroupChat._id })
      .then(setGroupMessages)
      .catch((err) => console.error('Failed to load group messages', err));

    if (socket) {
      socket.emit('join:group', { groupId: activeGroupChat._id });

      const handleMsg = (msg: LearningMessage) => {
        if (msg.groupId === activeGroupChat._id) {
          setGroupMessages((prev) => [...prev, msg]);
        }
      };

      socket.on('new:learning_message', handleMsg);

      return () => {
        socket.emit('leave:group', { groupId: activeGroupChat._id });
        socket.off('new:learning_message', handleMsg);
      };
    }
  }, [activeGroupChat, socket]);

  const handleJoin = async (group: LearningGroup) => {
    setActionLoadingId(group._id);
    try {
      await learnTeachApi.joinGroup(group._id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to join group');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeave = async (group: LearningGroup) => {
    if (!window.confirm('Are you sure you want to leave this study circle?')) return;
    setActionLoadingId(group._id);
    try {
      await learnTeachApi.leaveGroup(group._id);
      if (activeGroupChat?._id === group._id) setActiveGroupChat(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to leave group');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !skillId) return;

    setCreating(true);
    try {
      await learnTeachApi.createGroup({
        title,
        description,
        skillId,
        maxMembers: Number(maxMembers),
        preferredMode,
        meetingSchedule,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setMeetingSchedule('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupChat || !newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const msg = await learnTeachApi.sendMessage({
        groupId: activeGroupChat._id,
        message: newMessage.trim(),
      });
      if (msg) {
        setGroupMessages((prev) => [...prev, msg]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send group message', err);
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center">
              <UsersRound className="w-6 h-6 mr-2 text-[#C62828]" />
              Learning Groups & Study Circles
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Collaborative study groups, semester revision circles, and project cohorts across Chandigarh University.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#C62828] hover:bg-[#8E1717] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Create Study Group
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading campus study circles...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <UsersRound className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No active study groups yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Create the first study group for your branch or subject and invite classmates.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 px-5 py-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              + Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => {
              const isOwner = group.createdBy?._id === user?._id;

              return (
                <div
                  key={group._id}
                  className="bg-white rounded-2xl border border-[#E7DADA] hover:border-[#C62828] p-5 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-[#C62828]">
                        {group.skillId?.name}
                      </span>

                      <span className="text-xs font-bold text-gray-600 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {group.memberCount} / {group.maxMembers}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mt-2.5">
                      {group.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {group.description}
                    </p>

                    <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Globe className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>Mode: {group.preferredMode}</span>
                      </div>
                      {group.meetingSchedule && (
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          <span>{group.meetingSchedule}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-gray-400 pt-1">
                        Organized by {group.createdBy?.fullName || 'Peer'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    {group.isMember ? (
                      <div className="flex items-center space-x-2 w-full justify-between">
                        <button
                          onClick={() => setActiveGroupChat(group)}
                          className="px-3.5 py-1.5 text-xs font-bold text-[#C62828] bg-red-50 hover:bg-red-100 rounded-xl flex items-center cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Group Chat
                        </button>

                        {!isOwner && (
                          <button
                            onClick={() => handleLeave(group)}
                            disabled={actionLoadingId === group._id}
                            className="text-xs text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            Leave
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(group)}
                        disabled={actionLoadingId === group._id || group.status === 'FULL'}
                        className="w-full py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {group.status === 'FULL' ? 'Group Full' : 'Join Study Circle'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E7DADA]">
            <h3 className="text-lg font-bold text-gray-900">Create Study Group</h3>
            <p className="text-xs text-gray-500 mt-1">
              Start a recurring peer study cohort for collaborative learning.
            </p>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Group Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Sem OS & DBMS Study Circle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Core Skill / Subject
                </label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                >
                  {skills.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What will members work on together?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mode
                  </label>
                  <select
                    value={preferredMode}
                    onChange={(e) => setPreferredMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline (Campus)</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Schedule (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Saturdays 5 PM - 7 PM"
                  value={meetingSchedule}
                  onChange={(e) => setMeetingSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C62828] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {activeGroupChat && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full h-[550px] shadow-2xl border border-[#E7DADA] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeGroupChat.title}</h3>
                <p className="text-[10px] text-gray-500">
                  {activeGroupChat.memberCount} members • {activeGroupChat.skillId?.name}
                </p>
              </div>
              <button
                onClick={() => setActiveGroupChat(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FFF7F7]/20">
              {groupMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No group messages yet. Start the conversation!
                </div>
              ) : (
                groupMessages.map((m) => {
                  const isMe = m.senderId._id === user?._id;
                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[9px] text-gray-400 mb-0.5 px-1">
                        {isMe ? 'You' : m.senderId.fullName}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl p-2.5 text-xs ${
                          isMe
                            ? 'bg-[#C62828] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        <p>{m.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-gray-100 flex items-center space-x-2 bg-white"
            >
              <input
                type="text"
                placeholder="Message study group..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C62828] outline-none"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="p-2.5 bg-[#C62828] hover:bg-[#8E1717] text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
