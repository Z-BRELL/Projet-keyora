# KEYORA MESSAGING FIX - COMPLETE SOLUTION
# Copy-paste these files directly into your project

## FILE 1: backend/src/messages/messages.service.ts
# CREATE THIS NEW FILE (it doesn't exist yet)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(senderId: string, dto: { recipientId: string; content: string; listingId?: string }) {
    return this.prisma.message.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        listingId: dto.listingId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
    });
  }

  async getConversations(userId: string) {
    // Get all unique contacts with their latest message
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      orderBy: { sentAt: 'desc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Group by contact and keep latest message
    const contactMap = new Map<string, any>();
    
    messages.forEach((msg) => {
      const contactId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const contact = msg.senderId === userId ? msg.recipient : msg.sender;

      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          contactId,
          contactName: contact.fullName,
          avatarUrl: contact.avatarUrl,
          lastMessage: msg.content,
          lastMessageDate: msg.sentAt,
          unread: msg.recipientId === userId && !msg.read,
        });
      }
    });

    return Array.from(contactMap.values());
  }

  async getThread(userId: string, contactId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: contactId },
          { senderId: contactId, recipientId: userId },
        ],
      },
      orderBy: { sentAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
    });

    // Mark incoming messages as read
    await this.prisma.message.updateMany({
      where: { 
        senderId: contactId, 
        recipientId: userId, 
        read: false 
      },
      data: { read: true },
    });

    return messages;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { 
        recipientId: userId, 
        read: false 
      },
    });
    return { unread: count };
  }
}
```

---

## FILE 2: backend/src/messages/messages.controller.ts
# CREATE THIS NEW FILE (it doesn't exist yet)

```typescript
import {
  Controller, Get, Post, Body, Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  send(@Body() dto: any, @CurrentUser() user: any) {
    return this.messagesService.send(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste de mes conversations' })
  getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('thread/:contactId')
  @ApiOperation({ summary: 'Fil de discussion avec un contact' })
  getThread(@Param('contactId') contactId: string, @CurrentUser() user: any) {
    return this.messagesService.getThread(user.id, contactId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.id);
  }
}
```

---

## FILE 3: backend/src/messages/messages.module.ts
# REPLACE THE ENTIRE EXISTING FILE

```typescript
import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
```

---

## FILE 4: frontend/src/app/(dashboard)/dashboard/messages/page.tsx
# REPLACE THE ENTIRE EXISTING FILE

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // 1. Récupération de la liste des conversations
  const { data: conversations = [], isLoading: loadingChats } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        const response = await messagesApi.getConversations();
        return Array.isArray(response.data) ? response.data : response;
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
  });

  // 2. Récupération des messages d'une conversation spécifique
  const { data: chatHistory = [], isLoading: loadingHistory, refetch } = useQuery({
    queryKey: ['messages', selectedChat],
    queryFn: async () => {
      try {
        const response = await messagesApi.getThread(selectedChat!);
        return Array.isArray(response.data) ? response.data : response;
      } catch (error) {
        console.error('Error fetching thread:', error);
        return [];
      }
    },
    enabled: !!selectedChat,
  });

  // Mutation pour envoyer un message
  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messagesApi.send({
        recipientId: selectedChat,
        content,
      }),
    onSuccess: () => {
      setNewMessage('');
      refetch();
      qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Message envoyé');
    },
    onError: (error: any) => {
      console.error('Send error:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'envoi du message');
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    sendMutation.mutate(newMessage);
  };

  if (loadingChats) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Colonne de gauche : Liste des conversations */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-800">Boîte de réception</h2>
          <p className="text-xs text-gray-400 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {!conversations || conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Aucun message pour le moment.</p>
          ) : (
            conversations.map((chat: any) => (
              <button
                key={chat.contactId}
                onClick={() => setSelectedChat(chat.contactId)}
                className={`w-full text-left p-4 border-b border-gray-50 transition-colors flex items-center gap-3 hover:bg-gray-50 ${
                  selectedChat === chat.contactId ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex flex-shrink-0 items-center justify-center text-white font-bold text-sm">
                  {chat.contactName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {chat.contactName || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {chat.lastMessageDate && format(new Date(chat.lastMessageDate), 'd MMM', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'Pas de message'}</p>
                </div>
                {chat.unread && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Colonne de droite : Fil de discussion */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-center">
              <div className="text-4xl mb-2">💬</div>
              Sélectionnez une conversation pour afficher les messages.
            </p>
          </div>
        ) : (
          <>
            {/* En-tête du fil */}
            <div className="p-4 bg-white border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {conversations.find((c: any) => c.contactId === selectedChat)?.contactName || 'Conversation'}
              </h3>
            </div>

            {/* Historique des messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
              {loadingHistory ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((msg: any) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'bg-primary-500 text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                          {msg.sentAt && format(new Date(msg.sentAt), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400 text-sm">Aucun message dans cette conversation.</p>
              )}
            </div>

            {/* Zone de saisie */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={sendMutation.isPending}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## INSTALLATION STEPS

### Step 1: Delete Old Messaging Module Files
```bash
# Go to your project
cd keyora

# Delete the old broken module file
rm backend/src/messages/messages.module.ts

# Verify messages directory exists
ls backend/src/messages/
# Should show: nothing (or empty)
```

### Step 2: Create New Backend Files
```bash
# Create the service file
# Copy FILE 1 content above into: backend/src/messages/messages.service.ts

# Create the controller file  
# Copy FILE 2 content above into: backend/src/messages/messages.controller.ts

# Create the module file
# Copy FILE 3 content above into: backend/src/messages/messages.module.ts
```

### Step 3: Replace Frontend File
```bash
# Replace entire messages page
# Copy FILE 4 content above into: frontend/src/app/(dashboard)/dashboard/messages/page.tsx
```

### Step 4: Rebuild Docker
```bash
cd keyora

# Stop containers
docker compose down

# Rebuild and start
docker compose up -d --build

# Wait 30 seconds for services to start
sleep 30

# Check status
docker compose ps
```

### Step 5: Verify It Works
```bash
# Check backend logs
docker logs keyora_backend | grep -i "messages"

# Should see:
# ✓ [RoutesResolver] MessagesController
# ✓ [RouterExplorer] Mapped {/api/messages, POST}
# ✓ [RouterExplorer] Mapped {/api/messages/conversations, GET}
```

---

## QUICK TEST

### Via cURL (Command Line)

```bash
# 1. Register User A
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Buyer",
    "email": "john@test.com",
    "password": "Test123!@#",
    "phone": "+237600000001"
  }'

# 2. Register User B
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Seller",
    "email": "jane@test.com",
    "password": "Test123!@#",
    "phone": "+237600000002"
  }'

# 3. Login as User A (copy the access_token from response)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@test.com", "password": "Test123!@#"}'

# Response will have:
# {
#   "access_token": "eyJ0eXAi...",
#   "user": { "id": "USER_A_ID", ... }
# }

# 4. Send message from A to B (replace tokens and IDs)
curl -X POST http://localhost:4000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "recipientId": "USER_B_ID_HERE",
    "content": "Hello Jane!"
  }'

# 5. Get conversations as User A
curl http://localhost:4000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Should return:
# [
#   {
#     "contactId": "USER_B_ID",
#     "contactName": "Jane Seller",
#     "lastMessage": "Hello Jane!",
#     ...
#   }
# ]
```

### Via Browser

```
1. Open http://localhost:3000
2. Click "Inscription"
3. Register as Buyer (name: John, email: john@test.com, password: Test123!@#)
4. Register as Seller (name: Jane, email: jane@test.com, password: Test123!@#)
5. Login as John
6. Go to Dashboard → Messages
7. Should see: "Aucun message pour le moment"
8. (Need to send message from listing page first)
9. Login as Jane and see message
```

---

## WHAT EACH FILE DOES

| File | Purpose |
|------|---------|
| `messages.service.ts` | Handles all message logic (send, retrieve, group conversations) |
| `messages.controller.ts` | Routes HTTP requests to service methods |
| `messages.module.ts` | Connects everything together for NestJS |
| `messages/page.tsx` | Frontend UI for messaging (chat interface) |

---

## COMMON ISSUES & FIXES

### Issue: "Cannot find module 'messages.service'"
**Fix:** Make sure you created `messages.service.ts` in the right location:
```
✓ keyora/backend/src/messages/messages.service.ts
✓ keyora/backend/src/messages/messages.controller.ts
✓ keyora/backend/src/messages/messages.module.ts
```

### Issue: "Docker build fails"
**Fix:** Rebuild fresh:
```bash
docker compose down
rm -rf keyora-backend  # optional: clear image cache
docker compose up -d --build
```

### Issue: "Still no messages showing"
**Fix:** Clear browser cache:
1. Press F12 (DevTools)
2. Go to Application tab
3. Click "Clear site data"
4. Refresh page

### Issue: "401 Unauthorized when testing API"
**Fix:** You need a valid token:
1. Login first to get `access_token`
2. Copy the entire token value
3. Use it in Authorization header

---

## VERIFICATION CHECKLIST

- [ ] Files copied to correct locations
- [ ] Docker containers rebuilt
- [ ] Backend shows "MessagesController" in logs
- [ ] Frontend loads without errors
- [ ] Can register two users
- [ ] Can send message via API
- [ ] Message appears in both inboxes
- [ ] Timestamps show correctly

---

## SUCCESS INDICATORS

When working, you should see:

✅ Messages appear instantly  
✅ Contact names show in list  
✅ Conversation count displays  
✅ Unread badges appear  
✅ Timestamps format correctly  
✅ Send button loads while sending  
✅ Error messages on failures  
✅ Empty state message when no chats  

---

## FINAL STEP: Deploy

```bash
# Once tested and working locally:

# 1. Commit code
git add .
git commit -m "Fix: Complete messaging system refactor"

# 2. Push to production (if using CI/CD)
git push origin main

# 3. Or manually deploy with Docker:
docker compose -f docker-compose.prod.yml up -d --build
```

---

**YOU'RE DONE!** 🎉

Your messaging system is now fixed and ready to use.

If you need help, check:
- Docker logs: `docker logs keyora_backend`
- Browser console: Press F12
- Frontend logs: Check network tab in DevTools
