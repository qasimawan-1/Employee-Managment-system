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
        user = self.request.user
        if user.can_manage_tasks_all:
            serializer.save(created_by_id=user.id)
        else:
            # Employees without task-management rights can only ever create a
            # task assigned to themselves — override whatever was submitted.
            serializer.save(
                created_by_id=user.id,
                assigned_to_id=user.id,
                assigned_to_username=user.username,
                department_id=user.department_id,
            )

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        new_status = serializer.validated_data.get("status", instance.status)
        extra = {}
        if new_status == Task.Status.IN_PROGRESS and instance.status != Task.Status.IN_PROGRESS:
            extra["started_at"] = timezone.now()
        if new_status == Task.Status.COMPLETED and instance.status != Task.Status.COMPLETED:
            extra["completed_at"] = timezone.now()
        if not user.can_manage_tasks_all:
            # Same rule on update: an employee can change status/progress on their
            # own task, but can't reassign it to someone else.
            extra["assigned_to_id"] = instance.assigned_to_id
            extra["assigned_to_username"] = instance.assigned_to_username
            extra["department_id"] = instance.department_id
        serializer.save(**extra)
