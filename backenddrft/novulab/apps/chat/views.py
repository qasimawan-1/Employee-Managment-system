from rest_framework import viewsets, permissions
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Conversation.objects.all()
        if user.can_see_all_departments:
            return qs
        return [c for c in qs if user.id in c.participant_ids]


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.all()
        conversation_id = self.request.query_params.get("conversation")
        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)
        user = self.request.user
        if user.can_see_all_departments:
            return qs
        return [m for m in qs if user.id in m.conversation.participant_ids]

    def perform_create(self, serializer):
        serializer.save(sender_id=self.request.user.id, sender_username=self.request.user.username)
