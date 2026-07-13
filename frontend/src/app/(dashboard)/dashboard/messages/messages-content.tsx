'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { messagesApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useSocket } from '@/providers/SocketProvider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, SquarePen, Home, Phone, Info, CheckCheck, Paperclip, Camera, Send, ExternalLink, Calendar, Bed, Bath, Maximize2, Waves, X, User as UserIcon, MessageSquare, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useTranslation } from '@/lib/i18n';

export default function MessagesPageContent() {
  const { user, isMounted } = useRequireAuth();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyImage, setSelectedPropertyImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listingId = searchParams.get('listingId');
  const sellerId = searchParams.get('sellerId');
  const listingTitle = searchParams.get('listingTitle');
  const listingAddress = searchParams.get('listingAddress');
  const listingCity = searchParams.get('listingCity');
  const listingPrice = searchParams.get('listingPrice');
  const listingPhoto = searchParams.get('listingPhoto');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: conversations = [], isLoading: loadingChats, refetch: refetchConversations } = useQuery<any[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const response = await messagesApi.getConversations();
        return Array.isArray(response.data) ? response.data : response.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: isMounted && !!user,
  });

  const { data: chatHistory = [], isLoading: loadingHistory, refetch } = useQuery<any[]>({
    queryKey: ['messages', selectedChat],
    queryFn: async () => {
      try {
        const response = await messagesApi.getThread(selectedChat!);
        return Array.isArray(response.data) ? response.data : response.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: isMounted && !!user && !!selectedChat,
  });

  const { data: searchResults = [], isLoading: loadingSearch } = useQuery<any[]>({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
      try {
        const response = await usersApi.search(searchQuery.trim());
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: isMounted && !!user && searchQuery.trim().length >= 2,
  });

  const { socket, onlineUsers, isConnected } = useSocket();

  // Websockets
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.senderId === selectedChat || msg.recipientId === selectedChat) {
        refetch();
        setTimeout(() => scrollToBottom(), 100);
      }
      refetchConversations();
      qc.invalidateQueries({ queryKey: ['unreadCount'] });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleNewMessage);
    };
  }, [socket, selectedChat, refetch, refetchConversations, qc]);

  // Initial messages
  useEffect(() => {
    if (sellerId && listingId && selectedChat === sellerId) {
      const storageKey = `initial_msg_${user?.id}_${sellerId}_${listingId}`;
      if (sessionStorage.getItem(storageKey)) return;

      const sendInitialMessages = async () => {
        try {
          const initialMessage = `Bonjour 👋\n\n🏠 ${listingTitle}\n📍 ${listingAddress}, ${listingCity}\n💰 ${listingPrice} FCFA\n\nJe suis intéressé par cette propriété. Pouvez-vous me donner plus d'informations?`;
          
          await messagesApi.send({
            recipientId: sellerId,
            listingId: listingId,
            content: initialMessage,
          });

          sessionStorage.setItem(storageKey, '1');
          setTimeout(() => {
            inputRef.current?.focus();
          }, 500);
        } catch (error) {
          console.error('Error sending initial messages:', error);
        }
      };
      sendInitialMessages();
    }
  }, [sellerId, listingId, selectedChat, listingTitle, listingAddress, listingCity, listingPrice, user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [chatHistory]);

  useEffect(() => {
    if (sellerId && !selectedChat) {
      setSelectedChat(sellerId);
    }
  }, [sellerId, selectedChat]);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messagesApi.send({
        recipientId: selectedChat as string,
        content,
        listingId: listingId || undefined,
      }),
    onSuccess: () => {
      setNewMessage('');
      inputRef.current?.focus();
      refetch();
      refetchConversations();
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erreur lors de l'envoi du message");
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    if (socket && isConnected) {
      socket.emit('sendMessage', {
        recipientId: selectedChat,
        content: newMessage,
        listingId: listingId || undefined,
      });
      setNewMessage('');
      inputRef.current?.focus();
      // On n'a pas besoin de refetch() immédiat car handleNewMessage s'en chargera
      // à la réception de l'événement 'messageSent'
    } else {
      sendMutation.mutate(newMessage);
    }
  };

  const selectedConversation = conversations.find((c: any) => c.contactId === selectedChat) || (() => {
    const searchedUser = searchResults.find((u: any) => u.id === selectedChat);
    if (searchedUser) {
      return {
        contactId: searchedUser.id,
        contactName: searchedUser.fullName,
        avatarUrl: searchedUser.avatarUrl,
      };
    }
    return null;
  })();

  const activeListing = selectedConversation?.lastMessageListing || (listingId ? {
    id: listingId,
    title: listingTitle,
    price: listingPrice,
    city: listingCity,
    photos: [{ url: listingPhoto }]
  } : null);

  const filteredConversations = conversations.filter((c: any) => 
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted || !user) return null;

  return (
    <div className="bg-background min-h-screen flex flex-col font-body-md text-on-surface">
      <Navbar />

      <main className="flex-grow flex w-full max-w-7xl mx-auto pt-lg pb-xl px-4 sm:px-6 lg:px-8 gap-gutter overflow-hidden h-[calc(100vh-80px)]">
        
        {/* Left Column: Conversation List */}
        <aside className={`w-full md:w-1/3 lg:w-1/4 bg-surface-container-lowest rounded-xl border border-outline-variant flex-col overflow-hidden h-full shadow-sm ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
            <h2 className="font-headline-md text-headline-md text-on-surface">{t('messages.title')}</h2>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <SquarePen className="w-5 h-5" />
            </button>
          </div>
          <div className="p-md border-b border-outline-variant bg-surface-bright">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-outline" />
              <input 
                className="w-full bg-surface pl-10 pr-sm py-2 rounded-lg border border-outline-variant text-body-md font-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all shadow-inner" 
                placeholder={t('messages.searchPlaceholder')}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {loadingChats ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-secondary" />
              </div>
            ) : (
              <>
                {/* Active chats */}
                {filteredConversations.map((chat: any) => {
                  const isActive = selectedChat === chat.contactId;
                  return (
                    <div 
                      key={chat.contactId}
                      onClick={() => setSelectedChat(chat.contactId)}
                      className={`p-md border-b border-outline-variant cursor-pointer transition-colors relative ${isActive ? 'bg-surface-container-low hover:bg-surface-container' : 'hover:bg-surface-container-low'}`}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r-full"></div>}
                      <div className="flex gap-md items-start">
                        <div className="relative flex-shrink-0">
                          {chat.avatarUrl ? (
                            <img src={chat.avatarUrl} alt={chat.contactName} className="w-12 h-12 rounded-full object-cover border-2 border-surface-container-lowest" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold font-body-lg text-body-lg">
                              {chat.contactName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          {onlineUsers.includes(chat.contactId) && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                          {chat.unread && !onlineUsers.includes(chat.contactId) && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-xs">
                            <h3 className={`font-label-md text-label-md truncate ${chat.unread ? 'text-on-surface font-bold' : 'text-on-surface'}`}>
                              {chat.contactName || 'Unknown'}
                            </h3>
                            <span className="font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">
                              {chat.lastMessageDate && format(new Date(chat.lastMessageDate), 'HH:mm')}
                            </span>
                          </div>
                          <p className={`font-body-sm text-body-sm truncate ${chat.unread ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                            {chat.lastMessage || '...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Global Search Results */}
                {searchQuery.trim().length >= 2 && (
                  <div>
                    <div className="px-md py-2 bg-orange-50/50 text-xs font-bold text-orange-600 uppercase tracking-wider border-b border-outline-variant">
                      {t('messages.userHeader')}
                    </div>
                    {loadingSearch ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                      </div>
                    ) : searchResults.filter((u: any) => !conversations.some((c: any) => c.contactId === u.id)).length === 0 ? (
                      <p className="p-4 text-center text-xs text-on-surface-variant">{t('messages.noUsers')}</p>
                    ) : (
                      searchResults
                        .filter((u: any) => !conversations.some((c: any) => c.contactId === u.id))
                        .map((u: any) => {
                          const isActive = selectedChat === u.id;
                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedChat(u.id);
                                setSearchQuery('');
                              }}
                              className={`p-md border-b border-outline-variant cursor-pointer transition-colors relative ${isActive ? 'bg-surface-container-low hover:bg-surface-container' : 'hover:bg-surface-container-low'}`}
                            >
                              <div className="flex gap-md items-center">
                                <div className="flex-shrink-0">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.fullName} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold">
                                      {u.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-label-md text-label-md truncate text-on-surface">
                                    {u.fullName}
                                  </h3>
                                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold uppercase">
                                    {u.role === 'BUYER' ? t('admin.roles.buyer') : u.role === 'SELLER' ? t('admin.roles.seller') : u.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {filteredConversations.length === 0 && searchQuery.trim().length < 2 && (
                  <p className="p-6 text-center text-sm text-on-surface-variant">{t('messages.noConversations')}</p>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Center Column: Chat Thread */}
        <section className={`flex-grow flex flex-col bg-surface-container-lowest rounded-xl shadow-[0_4px_15px_-3px_rgba(3,8,19,0.04)] border border-outline-variant overflow-hidden h-full relative z-10 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant bg-surface-bright">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('messages.selectConversation')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                <div className="flex items-center gap-md">
                  <button 
                    onClick={() => setSelectedChat(null)}
                    className="p-2 hover:bg-surface-container rounded-full transition-colors md:hidden text-on-surface-variant mr-1"
                    title={t('common.cancel')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {selectedConversation?.avatarUrl ? (
                    <img src={selectedConversation.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold">
                      {selectedConversation?.contactName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h2 className="font-label-md text-label-md text-on-surface">{selectedConversation?.contactName || 'Contact'}</h2>
                    {onlineUsers.includes(selectedConversation?.contactId || '') ? (
                      <p className="font-label-sm text-label-sm text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> En ligne
                      </p>
                    ) : (
                      <p className="font-label-sm text-label-sm text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span> Hors ligne
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-sm text-on-surface-variant">
                  <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-surface-container rounded-full transition-colors md:hidden">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-grow p-lg overflow-y-auto bg-surface-bright flex flex-col gap-md">
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-center text-on-surface-variant font-body-sm mt-4">{t('messages.noMessages')}</p>
                ) : (
                  <>
                    <div className="text-center font-label-sm text-label-sm text-on-surface-variant my-sm">
                      {t('messages.history')}
                    </div>
                    {chatHistory.map((msg: any) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex gap-md max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-bold self-end hidden md:flex flex-shrink-0">
                              {msg.sender?.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          
                          <div className={`${isMe ? 'bg-primary rounded-br-sm text-on-primary' : 'bg-surface-container rounded-bl-sm text-on-surface border border-outline-variant'} rounded-2xl p-md shadow-sm`}>
                            {msg.listing && !isMe && (
                              <div className="mb-2 bg-surface-container-lowest/50 rounded-lg p-2 flex items-center gap-2 border border-outline-variant">
                                <Home className="w-4 h-4 text-secondary" />
                                <span className="font-label-sm text-xs opacity-90 truncate">{msg.listing.title}</span>
                              </div>
                            )}
                            
                            <div className="font-body-md text-body-md whitespace-pre-wrap">
                              {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => {
                                if (part.match(/^https?:\/\//)) {
                                  return (
                                    <div key={i} className="mt-2 mb-1">
                                      <img 
                                        src={part} 
                                        alt="Pièce jointe" 
                                        className="max-w-full h-40 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02] border border-black/10 shadow-sm"
                                        onClick={() => {
                                          setSelectedPropertyImage(part);
                                          setShowPropertyModal(true);
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const link = e.currentTarget.nextElementSibling as HTMLElement;
                                          if(link) link.style.display = 'block';
                                        }}
                                      />
                                      <a href={part} target="_blank" rel="noopener noreferrer" className="hidden underline opacity-80 break-all text-sm">
                                        {part}
                                      </a>
                                    </div>
                                  );
                                }
                                return <span key={i}>{part}</span>;
                              })}
                            </div>
                            
                            <span className={`font-label-sm text-[11px] block mt-xs text-right flex justify-end items-center gap-1 ${isMe ? 'text-primary-fixed-dim opacity-80' : 'text-on-surface-variant'}`}>
                              {msg.sentAt && format(new Date(msg.sentAt), 'HH:mm')}
                              {isMe && <CheckCheck className="w-3 h-3" />}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
                <form onSubmit={handleSendMessage} className="flex items-center gap-sm bg-surface rounded-xl border border-outline-variant p-2 shadow-inner focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                  <button type="button" className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container">
                    <Camera className="w-5 h-5" />
                  </button>
                  <input 
                    ref={inputRef}
                    className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder-on-surface-variant py-2 px-sm focus:outline-none" 
                    placeholder={t('messages.inputPlaceholder')}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendMutation.isPending}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="bg-secondary hover:bg-secondary-container text-on-secondary w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                  >
                    {sendMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {/* Right Column: Context Sidebar (Property Details) */}
        {activeListing ? (
          <aside className="w-80 bg-surface-container-lowest rounded-xl border border-outline-variant hidden lg:flex flex-col h-full overflow-y-auto shadow-sm">
            <div className="p-md border-b border-outline-variant bg-surface-bright sticky top-0 z-10">
              <h3 className="font-label-md text-label-md text-on-surface">{t('messages.aboutProperty')}</h3>
            </div>
            <div className="p-md">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-md border border-outline-variant shadow-sm bg-gray-100 flex items-center justify-center">
                {activeListing.photos?.[0]?.url || activeListing.photo ? (
                  <img src={activeListing.photos?.[0]?.url || activeListing.photo} alt="Property" className="w-full h-full object-cover" />
                ) : (
                  <Home className="w-10 h-10 text-gray-300" />
                )}
                {activeListing.isHotDeal && (
                  <div className="absolute top-2 right-2 bg-secondary text-on-secondary px-2 py-1 rounded font-label-sm text-label-sm font-bold shadow-sm">
                    Hot Deal
                  </div>
                )}
              </div>
              <h4 className="font-headline-md text-xl font-bold text-on-surface mb-xs leading-tight">
                {activeListing.title || 'Propriété'}
              </h4>
              <p className="font-headline-md text-lg text-secondary font-bold mb-md">
                {activeListing.price ? `${activeListing.price.toLocaleString('fr-FR')} FCFA` : 'Prix sur demande'}
              </p>
              <div className="grid grid-cols-2 gap-sm mb-lg">
                <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low p-2 rounded">
                  <Bed className="w-4 h-4 text-secondary" />
                  {activeListing.bedrooms || '-'} Lits
                </div>
                <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low p-2 rounded">
                  <Bath className="w-4 h-4 text-secondary" />
                  {activeListing.bathrooms || '-'} Sdb
                </div>
                <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low p-2 rounded">
                  <Maximize2 className="w-4 h-4 text-secondary" />
                  {activeListing.area || '-'} m²
                </div>
                <div className="flex items-center gap-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low p-2 rounded">
                  <Waves className="w-4 h-4 text-secondary" />
                  Piscine
                </div>
              </div>
              <div className="border-t border-outline-variant pt-md">
                <Link href={`/listings/${activeListing.id}`} className="w-full py-2 px-4 border border-primary text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors mb-sm flex justify-center items-center gap-sm">
                  <ExternalLink className="w-4 h-4" />
                  {t('messages.viewListing')}
                </Link>
                <button className="w-full py-2 px-4 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-colors flex justify-center items-center gap-sm shadow-[0_8px_30px_-4px_rgba(3,8,19,0.08)]">
                  <Calendar className="w-4 h-4" />
                  {t('messages.scheduleVisit')}
                </button>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="w-80 hidden lg:flex flex-col h-full"></aside>
        )}
      </main>

      {/* Modal image */}
      {showPropertyModal && selectedPropertyImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{t('messages.attachmentTitle')}</h3>
              <button onClick={() => setShowPropertyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-50">
              <img src={selectedPropertyImage} alt="Attachment" className="max-w-full max-h-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
