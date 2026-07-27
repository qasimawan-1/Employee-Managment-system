from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DailyReport
from .serializers import DailyReportSerializer, ReviewReportSerializer


class CanReview(permissions.BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return u.can_see_all_departments or u.is_team_lead


class DailyReportViewSet(viewsets.ModelViewSet):
    serializer_class = DailyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DailyReport.objects.all()
        if user.can_see_all_departments:
            return qs
        if user.is_team_lead:
            return qs.filter(department_id=user.department_id)
        return qs.filter(employee_id=user.id)

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            employee_id=user.id,
            employee_username=user.username,
            department_id=user.department_id,
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, CanReview])
    def review(self, request, pk=None):
        report = self.get_object()
        serializer = ReviewReportSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            review_status=DailyReport.ReviewStatus.REVIEWED,
            reviewed_by_id=request.user.id,
            reviewed_at=timezone.now(),
        )
        return Response(DailyReportSerializer(report).data)
