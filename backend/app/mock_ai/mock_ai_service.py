import random
import datetime
from typing import Dict, Any, List


class MockAIService:
    """Mock AI service that simulates model loading and predictions.
    Real AI/ML models can be plugged in later without changing the frontend."""

    @staticmethod
    def simulate_loading(steps: List[str]) -> List[Dict[str, str]]:
        """Simulate model loading steps"""
        result = []
        for step in steps:
            result.append({"step": step, "status": "completed"})
        return result

    @staticmethod
    def predict_blood_requirement(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mock AI prediction for blood requirement"""
        # Simulate based on patient data
        hemoglobin = patient_data.get("hemoglobin_level", 10)
        last_transfusion = patient_data.get("last_transfusion_date")
        interval = patient_data.get("transfusion_interval", 15)

        if last_transfusion:
            last_date = datetime.datetime.strptime(last_transfusion, "%Y-%m-%d").date() if isinstance(last_transfusion, str) else last_transfusion
            days_since = (datetime.date.today() - last_date).days
        else:
            days_since = interval

        # Mock prediction logic
        risk_level = "Low"
        if hemoglobin < 7:
            risk_level = "Critical"
        elif hemoglobin < 9:
            risk_level = "High"
        elif hemoglobin < 10:
            risk_level = "Moderate"

        days_until_required = max(1, interval - days_since)
        units = 1 if hemoglobin > 8 else 2 if hemoglobin > 6 else 3
        confidence = random.randint(85, 98)

        return {
            "predicted_date": (datetime.date.today() + datetime.timedelta(days=days_until_required)).isoformat(),
            "days_until_required": days_until_required,
            "required_units": units,
            "risk_level": risk_level,
            "confidence_percentage": confidence,
            "hemoglobin_trend": "decreasing" if hemoglobin < 10 else "stable",
        }

    @staticmethod
    def find_compatible_donors(patient_data: Dict[str, Any], all_donors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Mock AI donor matching"""
        blood_group = patient_data.get("blood_group", "")
        patient_city = patient_data.get("city", "")
        patient_lat = patient_data.get("latitude")
        patient_lng = patient_data.get("longitude")

        # Compatibility matrix
        compatible = {
            "A+": ["A+", "A-", "O+", "O-"],
            "A-": ["A-", "O-"],
            "B+": ["B+", "B-", "O+", "O-"],
            "B-": ["B-", "O-"],
            "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            "AB-": ["A-", "B-", "AB-", "O-"],
            "O+": ["O+", "O-"],
            "O-": ["O-"],
        }

        compatible_groups = compatible.get(blood_group, [])
        matched = []

        for donor in all_donors:
            if donor.get("blood_group") in compatible_groups and donor.get("availability") != "Not Available":
                # Calculate mock distance
                distance = random.randint(1, 50)
                matched.append({
                    "id": donor.get("id"),
                    "name": donor.get("full_name"),
                    "blood_group": donor.get("blood_group"),
                    "city": donor.get("city"),
                    "state": donor.get("state"),
                    "distance": distance,
                    "availability": donor.get("availability", "Available Now"),
                    "reliability_score": donor.get("reliability_score", 80),
                    "total_donations": donor.get("total_donations", 0),
                    "phone": donor.get("mobile"),
                })

        # Sort by distance and reliability
        matched.sort(key=lambda x: (x["distance"], -x["reliability_score"]))
        return matched[:10]  # Return top 10

    @staticmethod
    def demand_analysis(all_requests: List[Dict[str, Any]], all_donors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Mock demand analysis for donors"""
        blood_group_counts = {}
        for req in all_requests:
            bg = req.get("blood_group", "Unknown")
            blood_group_counts[bg] = blood_group_counts.get(bg, 0) + 1

        nearby_requests = [
            {
                "id": req.get("id"),
                "patient_name": req.get("patient_name", "Unknown"),
                "blood_group": req.get("blood_group"),
                "city": req.get("city"),
                "is_emergency": req.get("is_emergency", False),
                "distance": random.randint(1, 30),
            }
            for req in all_requests[:5]
        ]

        return {
            "total_patients_needing_blood": len(all_requests),
            "blood_group_demand": blood_group_counts,
            "nearby_requests": nearby_requests,
            "forecast": {
                "next_week_demand": len(all_requests) + random.randint(1, 10),
                "next_month_demand": len(all_requests) * 3 + random.randint(5, 20),
                "high_demand_groups": sorted(blood_group_counts.items(), key=lambda x: x[1], reverse=True)[:3],
            }
        }

    @staticmethod
    def admin_analytics(patients: List[Dict], donors: List[Dict], requests: List[Dict]) -> Dict[str, Any]:
        """Mock admin analytics predictions"""
        state_demand = {}
        for p in patients:
            state = p.get("state", "Unknown")
            state_demand[state] = state_demand.get(state, 0) + 1

        blood_group_demand = {}
        for r in requests:
            bg = r.get("blood_group", "Unknown")
            blood_group_demand[bg] = blood_group_demand.get(bg, 0) + 1

        availability_stats = {"Available Now": 0, "Available This Week": 0, "Emergency Only": 0, "Not Available": 0}
        for d in donors:
            avail = d.get("availability", "Not Available")
            if avail in availability_stats:
                availability_stats[avail] += 1

        critical_patients = sum(1 for p in patients if p.get("hemoglobin_level", 10) < 7)

        return {
            "state_wise_demand": state_demand,
            "blood_group_demand": blood_group_demand,
            "donor_availability": availability_stats,
            "emergency_requests": sum(1 for r in requests if r.get("is_emergency")),
            "predictions": {
                "predicted_shortage_areas": list(state_demand.keys())[:3],
                "high_demand_blood_groups": [bg for bg, count in sorted(blood_group_demand.items(), key=lambda x: x[1], reverse=True)[:2]],
                "critical_patient_count": critical_patients,
                "future_blood_requirement_forecast": {
                    "next_month": len(requests) + random.randint(10, 30),
                    "next_quarter": len(requests) * 3 + random.randint(30, 100),
                }
            }
        }

    @staticmethod
    def chatbot_response(user_role: str, message: str, context: Dict[str, Any] = None) -> str:
        """Mock chatbot responses"""
        message_lower = message.lower()

        # Patient queries
        if user_role == "patient":
            if "blood" in message_lower and ("need" in message_lower or "when" in message_lower):
                return "Based on your transfusion history, your next blood requirement is predicted in approximately 12 days. I recommend setting up a blood request in advance to ensure availability."
            if "donor" in message_lower:
                return "There are 15 compatible donors available in your area. You can view them in the 'Find Donors' section. Would you like me to help you send an emergency request?"
            if "emergency" in message_lower:
                return "I understand this is urgent! Please create an Emergency Blood Request immediately. Your request will be prioritized and nearby donors will be notified instantly."
            if "transfusion" in message_lower:
                return "Your last transfusion was on the 15th of this month. Based on your average interval of 15 days, your next transfusion is expected around the 30th."
            if "health" in message_lower or "hemoglobin" in message_lower:
                return "Your last recorded hemoglobin level was 9.2 g/dL. For optimal health, try to maintain it above 10 g/dL. Regular transfusions and iron chelation therapy are recommended."

        # Donor queries
        elif user_role == "donor":
            if "patient" in message_lower or "need" in message_lower:
                return "There are currently 23 patients requiring blood transfusions in your region. Blood group B+ is in highest demand. Check the 'Patient Demand Insights' section for details."
            if "donate" in message_lower or "when" in message_lower:
                return "You last donated on 1st March. You're eligible to donate again. Your blood type is in high demand right now!"
            if "emergency" in message_lower:
                return "There are 3 emergency requests active in your area. Patients in Chennai and Bangalore urgently need blood donors."

        # Admin queries
        elif user_role == "admin":
            if "critical" in message_lower or "urgent" in message_lower:
                return "There are 8 critical patients and 12 emergency requests active right now. States with highest demand: Uttar Pradesh, Bihar, West Bengal."
            if "analytics" in message_lower or "report" in message_lower:
                return "Total registered: 1,234 patients, 892 donors. Monthly active: 456 patients, 234 donors. Blood request fulfillment rate: 78%. Recommend increasing donor registration drives in rural areas."
            if "shortage" in message_lower or "shortage" in message_lower:
                return "Predicted blood shortage areas for next month: Rural Uttar Pradesh, Bihar, and parts of Madhya Pradesh. Consider organizing mobile donation camps in these regions."

        # Default responses
        return {
            "patient": "I'm your Thalassemia Care Assistant. I can help you with blood requirement predictions, finding donors, managing requests, and providing health insights. How can I help you today?",
            "donor": "Welcome, Donor! I can help you find patients in need, manage your availability, and track your donation impact. What would you like to know?",
            "admin": "Welcome, Admin! I have access to platform analytics, user management, predictions, and emergency oversight. How can I assist with platform operations?"
        }.get(user_role, "I'm here to help with the Thalassemia platform. Please let me know what you need.")


mock_ai = MockAIService()