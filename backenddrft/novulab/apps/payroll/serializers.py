from rest_framework import serializers
from .models import Payslip


class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = [
            "id", "employee_id", "employee_username", "department_id", "month",
            "basic_salary", "allowances", "deductions", "net_pay",
            "generated_by_id", "generated_at",
        ]
        read_only_fields = ["generated_by_id", "generated_at", "net_pay"]

    def create(self, validated_data):
        validated_data["net_pay"] = (
            validated_data["basic_salary"] + validated_data.get("allowances", 0) - validated_data.get("deductions", 0)
        )
        return super().create(validated_data)
