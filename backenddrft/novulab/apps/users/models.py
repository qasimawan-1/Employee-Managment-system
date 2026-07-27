from django.contrib.auth.models import AbstractUser
from django.db import models


class Department(models.Model):
    """Sales, Marketing, Development, HR, Finance, etc."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CEO = "CEO", "CEO"
        CTO = "CTO", "CTO"
        HR = "HR", "HR"
        FINANCE = "FINANCE", "Finance"
        TEAM_LEAD = "TEAM_LEAD", "Team Lead"
        EMPLOYEE = "EMPLOYEE", "Employee"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    phone = models.CharField(max_length=20, blank=True)
    date_joined_company = models.DateField(null=True, blank=True)
    is_active_employee = models.BooleanField(default=True)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_ceo(self):
        return self.role == self.Role.CEO

    @property
    def is_cto(self):
        return self.role == self.Role.CTO

    @property
    def is_hr(self):
        return self.role == self.Role.HR

    @property
    def is_finance(self):
        return self.role == self.Role.FINANCE

    @property
    def is_team_lead(self):
        return self.role == self.Role.TEAM_LEAD

    @property
    def can_see_all_departments(self):
        return self.role in (self.Role.ADMIN, self.Role.CEO, self.Role.CTO, self.Role.HR)

    def __str__(self):
        return f"{self.username} ({self.role})"
