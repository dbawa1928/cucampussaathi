import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Check,
  X,
  MessageSquare,
  Send,
  Calendar,
  Loader2,
} from 'lucide-react';
import { LearnTeachNav } from '../../components/learnTeach/LearnTeachNav';
import {
  learnTeachApi,
  type SkillConnection,
  type LearningMessage,
  type SkillItem,
} from '../../api/learnTeachApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ProposeSessionModal } from '../../components/learnTeach/modals/ProposeSessionModal';

export const ConnectionsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatConnectionId = searchParams.get('chat');

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RECEIVED' | 'SENT'>('ACTIVE');
  const [connections, setConnections] = useState<SkillConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Chat state
  const [selectedConnection, setSelectedConnection] = useState<SkillConnection | null>(null);
  const [messages, setMessages] = useState<LearningMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Propose session modal from connection
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [skillsCatalogue, setSkillsCatalogue] = useState<SkillItem[]>([]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await learnTeachApi.getConnections();
      setConnections(data);
    } catch (err) {
      console.error('Failed to load connections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
    learnTeachApi.getSkills().then(setSkillsCatalogue);
  }, []);

  // Sync selected connection with URL param
  useEffect(() => {
    if (chatConnectionId && connections.length > 0) {
      const found = connections.find((c) => c._id === chatConnectionId);
      if (found) {
        setSelectedConnection(found);
      }
    }
  }, [chatConnectionId, connections]);

  // Load chat messages and join room when selectedConnection changes
  useEffect(() => {
    if (!selectedConnection) return;

    learnTeachApi
      .getMessages({ connectionId: selectedConnection._id })
      .then(setMessages)
      .catch((err) => console.error('Failed to load chat messages', err));

    if (socket) {
      socket.emit('join:connection', { connectionId: selectedConnection._id });

      const handleNewMessage = (msg: LearningMessage) => {
        if (msg.connectionId === selectedConnection._id) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      socket.on('new:learning_message', handleNewMessage);

      return () => {
        socket.emit('leave:connection', { connectionId: selectedConnection._id });
        socket.off('new:learning_message', handleNewMessage);
      };
    }
  }, [selectedConnection, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRespond = async (id: string, action: 'ACCEPT' | 'REJECT' | 'WITHDRAW') => {
    setActionLoadingId(id);
    try {
      await learnTeachApi.respondConnection(id, action);
      await loadConnections();
    } catch (err) {
      console.error('Failed to respond to connection', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const msg = await learnTeachApi.sendMessage({
        connectionId: selectedConnection._id,
        message: newMessage.trim(),
      });
      if (msg) {
        setMessages((prev) => [...prev, msg]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const receivedList = connections.filter(
    (c) => c.recipientId._id === user?._id && c.status === 'PENDING'
  );
  const sentList = connections.filter(
    (c) => c.requesterId._id === user?._id && c.status === 'PENDING'
  );
  const activeList = connections.filter((c) => c.status === 'ACCEPTED');

  return (
    <div className="min-h-screen bg-[#FFF7F7]/60 pb-16">
      <LearnTeachNav pendingConnectionsCount={receivedList.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-[#C62828]" />
            Connections & Learning Chat
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Manage your network of mentors and peers, accept incoming requests, and chat privately.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-2 border-b border-[#E7DADA] pb-3 mb-6">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-[#C62828] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active Connections ({activeList.length})
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center cursor-pointer ${
              activeTab === 'RECEIVED'
                ? 'bg-[#C62828] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Received Requests
            {receivedList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] rounded-full">
                {receivedList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'SENT'
                ? 'bg-[#C62828] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sent Requests ({sentList.length})
          </button>
        </div>

        {/* Main Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C62828] mb-3" />
            <p className="text-xs text-gray-500">Loading connections...</p>
          </div>
        ) : (
          <div>
            {/* ACTIVE CONNECTIONS TAB with 2-Column Split: Connection List + Live Chat */}
            {activeTab === 'ACTIVE' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Connections List */}
                <div className="lg:col-span-5 space-y-3">
                  {activeList.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                      <p className="text-xs text-gray-500">No active connections yet.</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Accept received requests or discover new mentors to start connecting.
                      </p>
                    </div>
                  ) : (
                    activeList.map((conn) => {
                      const otherUser =
                        conn.requesterId._id === user?._id
                          ? conn.recipientId
                          : conn.requesterId;
                      const isSelected = selectedConnection?._id === conn._id;

                      return (
                        <div
                          key={conn._id}
                          onClick={() => {
                            setSelectedConnection(conn);
                            setSearchParams({ chat: conn._id });
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#FFF7F7] border-[#C62828] shadow-sm'
                              : 'bg-white border-[#E7DADA] hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold text-sm">
                                {otherUser.fullName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900">
                                  {otherUser.fullName}
                                </h4>
                                <span className="text-[11px] text-gray-500">
                                  {otherUser.role === 'TEACHER' ? 'Faculty' : 'Student Peer'}
                                </span>
                              </div>
                            </div>

                            <span className="text-[11px] font-semibold text-[#C62828] flex items-center">
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              Chat
                            </span>
                          </div>

                          {conn.skillDesired && (
                            <div className="mt-3 text-[11px] text-gray-600 bg-white/80 p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                              <span>Learning Focus:</span>
                              <span className="font-bold text-[#C62828]">
                                {conn.skillDesired.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live Chat Pane */}
                <div className="lg:col-span-7">
                  {selectedConnection ? (
                    <div className="bg-white rounded-2xl border border-[#E7DADA] shadow-xs flex flex-col h-[550px] overflow-hidden">
                      {/* Chat Header */}
                      {(() => {
                        const otherUser =
                          selectedConnection.requesterId._id === user?._id
                            ? selectedConnection.recipientId
                            : selectedConnection.requesterId;

                        return (
                          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold text-sm">
                                {otherUser.fullName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                  {otherUser.fullName}
                                </h3>
                                <p className="text-[10px] text-gray-500">
                                  {otherUser.role === 'TEACHER' ? 'Faculty Member' : 'Student Peer'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setShowProposeModal(true)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-[#C62828] bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              Propose Session
                            </button>
                          </div>
                        );
                      })()}

                      {/* Messages Flow */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FFF7F7]/30">
                        {messages.length === 0 ? (
                          <div className="py-12 text-center text-xs text-gray-400">
                            No messages yet. Say hello and introduce what you want to learn!
                          </div>
                        ) : (
                          messages.map((m) => {
                            const isMe = m.senderId._id === user?._id;
                            return (
                              <div
                                key={m._id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-2xl p-3 text-xs ${
                                    isMe
                                      ? 'bg-[#C62828] text-white rounded-tr-none'
                                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-2xs'
                                  }`}
                                >
                                  <p className="leading-relaxed">{m.message}</p>
                                  <span
                                    className={`block text-[9px] mt-1 text-right ${
                                      isMe ? 'text-white/70' : 'text-gray-400'
                                    }`}
                                  >
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat Input */}
                      <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-gray-100 flex items-center space-x-2 bg-white"
                      >
                        <input
                          type="text"
                          placeholder="Type a message..."
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
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center text-xs text-gray-400">
                      Select a connection from the list to start messaging.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RECEIVED REQUESTS TAB */}
            {activeTab === 'RECEIVED' && (
              <div className="space-y-4">
                {receivedList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-xs text-gray-500">
                    No pending connection requests received.
                  </div>
                ) : (
                  receivedList.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-11 h-11 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {req.requesterId.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {req.requesterId.fullName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {req.requesterId.role === 'TEACHER' ? 'Faculty Member' : 'Student Peer'}
                          </p>

                          {req.skillDesired && (
                            <p className="text-xs text-[#C62828] font-semibold mt-1">
                              Wants to learn: {req.skillDesired.name}
                            </p>
                          )}

                          {req.introMessage && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                              "{req.introMessage}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleRespond(req._id, 'ACCEPT')}
                          disabled={actionLoadingId === req._id}
                          className="inline-flex items-center px-4 py-2 bg-[#C62828] hover:bg-[#8E1717] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(req._id, 'REJECT')}
                          disabled={actionLoadingId === req._id}
                          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SENT REQUESTS TAB */}
            {activeTab === 'SENT' && (
              <div className="space-y-4">
                {sentList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-xs text-gray-500">
                    No active sent requests.
                  </div>
                ) : (
                  sentList.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-2xl border border-[#E7DADA] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {req.recipientId.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {req.recipientId.fullName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            Request sent on {new Date(req.createdAt).toLocaleDateString()}
                          </span>

                          {req.introMessage && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                              "{req.introMessage}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRespond(req._id, 'WITHDRAW')}
                        disabled={actionLoadingId === req._id}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl cursor-pointer"
                      >
                        Withdraw Request
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedConnection && (
        <ProposeSessionModal
          isOpen={showProposeModal}
          onClose={() => setShowProposeModal(false)}
          connectionId={selectedConnection._id}
          teacherUser={
            selectedConnection.requesterId._id === user?._id
              ? selectedConnection.recipientId
              : selectedConnection.requesterId
          }
          skills={skillsCatalogue}
          onSuccess={() => {
            alert('Session proposed successfully!');
          }}
        />
      )}
    </div>
  );
};
