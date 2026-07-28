from rest_framework import permissions


class IsFinanceOrHR(permissions.BasePermission):
    """Only Finance and HR (or a custom role granted payroll access) can create/list all payslips."""
    def has_permission(self, request, view):
        u = request.user
        if view.action in ("create", "list_all"):
            return bool(u.can_manage_payroll)
        return True
