from django.utils import timezone
from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer
from .permissions import CanManageTask
from apps.common.permissions import DepartmentScopedQuerysetMixin


class TaskViewSet(DepartmentScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageTask]
    department_field = "department_id"
    owner_field = "assigned_to_id"

    def perform_create(self, serializer):
        serializer.save(created_by_id=self.request.user.id)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get("status", instance.status)
        extra = {}
        if new_status == Task.Status.IN_PROGRESS and instance.status != Task.Status.IN_PROGRESS:
            extra["started_at"] = timezone.now()
        if new_status == Task.Status.COMPLETED and instance.status != Task.Status.COMPLETED:
            extra["completed_at"] = timezone.now()
        serializer.save(**extra)
