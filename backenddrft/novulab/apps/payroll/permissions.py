from rest_framework import permissions


class IsFinanceOrHR(permissions.BasePermission):
    """Only Finance and HR can create/list all payslips."""
    def has_permission(self, request, view):
        u = request.user
        if view.action in ("create", "list_all"):
            return bool(u.is_admin or u.is_finance or u.is_hr)
        return True
