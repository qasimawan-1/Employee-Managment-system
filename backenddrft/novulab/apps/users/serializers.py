from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code"]


class UserListSerializer(serializers.ModelSerializer):
    """Used when listing employees - hides sensitive fields."""
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "department", "department_name", "phone",
            "date_joined_company", "is_active_employee",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Used by HR/Team Lead to create a new employee account.
    HR/the team lead sets the password themselves; it's then (via signal) emailed
    to the employee along with their username.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "department", "phone", "date_joined_company", "password",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_role(self, value):
        request = self.context["request"]
        # Only HR/CEO/CTO can create HR/CEO/CTO/Finance accounts; team leads can only create Employee role
        if request.user.role == User.Role.TEAM_LEAD and value != User.Role.EMPLOYEE:
            raise serializers.ValidationError("Team leads can only create Employee accounts.")
        return value

    def validate(self, data):
        request = self.context["request"]
        if request.user.role == User.Role.TEAM_LEAD:
            # A team lead can only ever build out their own department's team,
            # regardless of what department was submitted in the request.
            data["department"] = request.user.department
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # stash plain password on instance (not saved) so the signal/view can email it
        user._generated_password = password
        return user
