import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Search, User, Ban, UserCheck, Trash2 } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config';

const Chat = ({ user, onBack, initialChatUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState(initialChatUser || null);
  const [conversations, setConversations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showConversationList, setShowConversationList] = useState(!initialChatUser);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (user) {
        const userId = user._id || user.id || user.googleId;
        console.log('Chat connecting user:', userId);
        newSocket.emit('joinRoom', { userId });
      }
    });

    const userId = user._id || user.id || user.googleId;
    newSocket.on(`message_${userId}`, (message) => {
      console.log('Received message:', message);
      if (chatUser && (message.sender._id === chatUser._id || message.receiver._id === chatUser._id)) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => newSocket.close();
  }, [user, chatUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && !initialChatUser) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (chatUser) {
      fetchMessages();
      setShowConversationList(false);
    } else {
      setShowConversationList(true);
    }
  }, [chatUser]);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/blocked-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data.map(user => user._id));
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!chatUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/messages/${chatUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatUser || !socket) return;

    const messageData = {
      receiverId: chatUser._id,
      content: newMessage.trim()
    };

    try {
      socket.emit('sendMessage', messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUserSelect = (selectedUser) => {
    setChatUser(selectedUser);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setChatUser(null);
    setMessages([]);
  };

  const handleBlockUser = async () => {
    if (!chatUser) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/block/${chatUser._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBlockedUsers(); // Refresh blocked users list
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async () => {
    if (!chatUser) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/unblock/${chatUser._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBlockedUsers(); // Refresh blocked users list
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleDeleteConversation = async (userId) => {
    console.log('Attempting to delete conversation with user:', userId);
    try {
      const token = localStorage.getItem('token');
      console.log('Making API call to delete conversation...');
      const response = await axios.delete(`${API_BASE_URL}/api/conversations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Delete response:', response.data);
      setConversations(conversations.filter(conv => conv.user._id !== userId));
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (showConversationList) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Messages</h2>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              {conversations
                .filter(conversation => 
                  searchQuery === '' || 
                  conversation.user.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((conversation) => (
                <div
                  key={conversation.user._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    onClick={() => handleUserSelect(conversation.user)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {conversation.user.profile.photos && conversation.user.profile.photos.length > 0 ? (
                        <img
                          src={conversation.user.profile.photos[0]}
                          alt={conversation.user.profile.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{conversation.user.profile.name}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.user._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {chatUser?.profile.photos && chatUser.profile.photos.length > 0 ? (
                  <img
                    src={chatUser.profile.photos[0]}
                    alt={chatUser.profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{chatUser?.profile.name}</h3>
                <p className="text-sm text-white text-opacity-90">
                  {chatUser?.profile.age} years old • {chatUser?.profile.location}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const isBlocked = chatUser && blockedUsers.includes(chatUser._id);
                if (isBlocked) {
                  handleUnblockUser();
                } else {
                  handleBlockUser();
                }
              }}
              className={`text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors ${
                chatUser && blockedUsers.includes(chatUser._id) ? 'bg-green-600' : ''
              }`}
              title={chatUser && blockedUsers.includes(chatUser._id) ? "Unblock User" : "Block User"}
            >
              {chatUser && blockedUsers.includes(chatUser._id) ? <UserCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id || Math.random().toString(36).substr(2, 9)}
                  className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl relative group ${
                      message.sender._id === user.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-900 shadow'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender._id === user.id ? 'text-white text-opacity-70' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {message.sender._id === user.id && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={chatUser && blockedUsers.includes(chatUser._id) ? "User is blocked" : "Type a message..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={chatUser && blockedUsers.includes(chatUser._id)}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || (chatUser && blockedUsers.includes(chatUser._id))}
              className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {chatUser && blockedUsers.includes(chatUser._id) && (
            <p className="text-sm text-red-500 mt-2">You cannot send messages to this user.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat;
