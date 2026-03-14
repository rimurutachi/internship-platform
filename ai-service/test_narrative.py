"""
Test script for AI Narrative Generation (CvSU OJT Format)
Run from ai-service directory: python test_narrative.py

Tests:
  1. Direct function call — validates CvSU format sections
  2. HTTP endpoint test — validates the full API flow
  3. Validation errors — rejects bad input
"""
import json
import sys
from datetime import date, timedelta

# ============================================================
# SAMPLE DAILY REPORTS TEST DATA
# ============================================================
START_DATE = "2025-07-29"
END_DATE   = "2025-09-15"

SAMPLE_DAILY_REPORTS = [
    {
        "report_date": "2025-07-29",
        "activities": "Completed company orientation and met the IT Department team. Set up workstation including monitor, system unit, keyboard, headset, and webcam. Reviewed company policies and standard operating procedures.",
        "hours_worked": 8,
        "learnings": "Learned about the company's organizational structure and the role of the IT Department. Understood the ticketing system used for helpdesk support."
    },
    {
        "report_date": "2025-07-30",
        "activities": "Attended daily standup meeting. Started working on assigned helpdesk tickets. Assisted in troubleshooting a network connectivity issue on a workstation. Learned how to use the company's CMS system.",
        "hours_worked": 8,
        "learnings": "Learned how to diagnose network issues and proper escalation procedures. Gained hands-on experience with the ticketing system."
    },
    {
        "report_date": "2025-07-31",
        "activities": "Continued resolving helpdesk tickets. Assisted senior IT specialist with PC standardization and cloning. Checked and monitored company assets including servers and network equipment.",
        "hours_worked": 8,
        "learnings": "Learned about PC standardization process and system cloning procedures. Understanding of asset monitoring is important for IT operations."
    },
    {
        "report_date": "2025-08-05",
        "activities": "Worked on cable management for the department. Set up new employee accounts and workstation configurations. Collaborated with team to resolve a server connectivity problem.",
        "hours_worked": 8,
        "learnings": "Learned about proper cable management techniques. Understood the importance of organized infrastructure for maintaining systems."
    },
    {
        "report_date": "2025-08-12",
        "activities": "GSM checking and inserting new 5G SIM cards. Tested GSM message and call functions using the monitoring system. Had difficulty with signal issues but resolved after adjusting antenna configurations.",
        "hours_worked": 8,
        "learnings": "Learned about GSM technology and SIM card management. Problem-solving skills improved when dealing with signal troubleshooting."
    },
    {
        "report_date": "2025-08-19",
        "activities": "Events Hall TV configuration for weekly huddle. Assisted in biometrics system maintenance. Monitored CMS concerns including SMS history and call lines.",
        "hours_worked": 8,
        "learnings": "Gained experience in AV equipment setup and biometrics systems. Learned the importance of regular system monitoring."
    },
    {
        "report_date": "2025-08-25",
        "activities": "Worked on CMS-related tasks. Helped resolve issues with production area network. Collaborated with co-interns on documentation of IT procedures.",
        "hours_worked": 8,
        "learnings": "Improved communication skills when working with the team. Documentation is crucial for knowledge transfer."
    },
    {
        "report_date": "2025-09-02",
        "activities": "Led troubleshooting of a cybersecurity concern reported by employees. Assisted in deploying software updates across multiple workstations. Prepared report on asset inventory.",
        "hours_worked": 8,
        "learnings": "Learned about cybersecurity best practices and the importance of keeping systems updated. Report writing is an important professional skill."
    },
    {
        "report_date": "2025-09-09",
        "activities": "Finalized all pending helpdesk tickets. Cleaned up and organized the IT workspace. Completed handover documentation for all ongoing tasks.",
        "hours_worked": 8,
        "learnings": "The internship gave me real-world industry experience in IT operations. Clean handover is essential for continuity."
    },
    {
        "report_date": "2025-09-15",
        "activities": "Had exit interview with OJT supervisor. Completed final documentation. Photo op with co-interns and IT department staff. Received Certificate of Completion.",
        "hours_worked": 8,
        "learnings": "Reflected on the entire internship journey. The experience significantly improved both technical and professional skills."
    },
]

NARRATIVE_REQUEST = {
    "student_name": "Jimmar D. Idioma",
    "company_name": "SP Madrid & Associates",
    "position": "IT Helpdesk Officer, CMS Trainee, and GSM Management System Trainee",
    "department": "IT Department",
    "start_date": START_DATE,
    "end_date": END_DATE,
    "total_hours": sum(r["hours_worked"] for r in SAMPLE_DAILY_REPORTS),
    "daily_reports": SAMPLE_DAILY_REPORTS,
}


# ============================================================
# EXPECTED CVSU FORMAT SECTIONS
# ============================================================
EXPECTED_SECTIONS = [
    'introduction',
    'introduction_objectives',
    'introduction_significance',
    'introduction_time_and_place',
    'linkage_location',
    'linkage_background',
    'linkage_vision_mission',
    'linkage_goals',
    'linkage_org_structure',
    'training_area_function',
    'training_area_org_structure',
    'training_area_facilities',
    'training_area_equipment',
    'training_area_sop',
    'experience_tasks',
    'experience_strengths',
    'experience_insights',
    'experience_problems',
    'summary',
    'references',
]

# ============================================================
# TEST 1: DIRECT FUNCTION CALL (CvSU format validation)
# ============================================================
def test_direct_function():
    print("\n" + "="*60)
    print("TEST 1: Direct NarrativeGenerator — CvSU OJT Format")
    print("="*60)

    try:
        from services.narrative_generator import narrative_generator

        daily_reports_data = [
            {
                "report_date": r["report_date"],
                "activities": r["activities"],
                "hours_worked": r["hours_worked"],
                "learnings": r.get("learnings"),
            }
            for r in NARRATIVE_REQUEST["daily_reports"]
        ]

        result = narrative_generator.generate_narrative(
            student_name=NARRATIVE_REQUEST["student_name"],
            company_name=NARRATIVE_REQUEST["company_name"],
            position=NARRATIVE_REQUEST["position"],
            department=NARRATIVE_REQUEST["department"],
            start_date=NARRATIVE_REQUEST["start_date"],
            end_date=NARRATIVE_REQUEST["end_date"],
            total_hours=NARRATIVE_REQUEST["total_hours"],
            daily_reports=daily_reports_data,
        )

        # Basic checks
        assert result['success'] is True
        assert result['word_count'] > 0
        print(f"  ✅ Word count: {result['word_count']}")
        print(f"  ✅ Key themes: {result['key_themes']}")
        print(f"  ✅ Skills    : {result['skills_mentioned']}")

        # Validate ALL CvSU sections are present
        missing = [s for s in EXPECTED_SECTIONS if s not in result['sections']]
        if missing:
            print(f"  ❌ Missing sections: {missing}")
            return False
        print(f"  ✅ All {len(EXPECTED_SECTIONS)} CvSU sections present")

        # Validate CvSU-specific content in narrative draft
        draft = result['narrative_draft']
        format_checks = {
            'INTRODUCTION': 'INTRODUCTION' in draft,
            'THE LINKAGE ESTABLISHMENT': 'THE LINKAGE ESTABLISHMENT' in draft,
            'THE TRAINING AREA': 'THE TRAINING AREA' in draft,
            'THE TRAINING EXPERIENCE': 'THE TRAINING EXPERIENCE' in draft,
            'SUMMARY': 'SUMMARY' in draft,
            'REFERENCES': 'REFERENCES' in draft,
            'Objectives': 'Objectives of the On-the-Job Training' in draft,
            'Significance': 'Significance of On-the-Job Training' in draft,
            'Tasks Performed': 'Tasks Performed' in draft,
            'Problems Encountered': 'Problems Encountered' in draft,
        }
        for label, ok in format_checks.items():
            status = "✅" if ok else "❌"
            print(f"  {status} Section heading: {label}")
            if not ok:
                return False

        # Show preview
        print(f"\n--- NARRATIVE DRAFT PREVIEW (first 800 chars) ---")
        print(draft[:800] + "...\n")

        # Show suggestions
        print(f"--- SUGGESTIONS ({len(result['suggestions'])}) ---")
        for s in result['suggestions']:
            print(f"  • {s}")

        return True

    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback; traceback.print_exc()
        return False


# ============================================================
# TEST 2: HTTP ENDPOINT TEST
# ============================================================
def test_http_endpoint():
    print("\n" + "="*60)
    print("TEST 2: HTTP POST /api/generate-narrative")
    print("="*60)

    try:
        import urllib.request
        import urllib.error

        payload = json.dumps(NARRATIVE_REQUEST).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:8000/api/generate-narrative",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode())

        print(f"✅ HTTP 200 — {body['word_count']} words")
        print(f"   Success      : {body['success']}")
        print(f"   Generated at : {body['generated_at']}")
        print(f"   Key themes   : {body['key_themes']}")
        print(f"   Skills       : {body['skills_mentioned'][:5]}")
        return True

    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"❌ HTTP {e.code}: {body[:300]}")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


# ============================================================
# TEST 3: VALIDATION ERRORS (short text / missing field)
# ============================================================
def test_validation():
    print("\n" + "="*60)
    print("TEST 3: Validation — should reject bad input")
    print("="*60)

    import urllib.request, urllib.error

    cases = [
        {
            "label": "Empty daily_reports list",
            "payload": {**NARRATIVE_REQUEST, "daily_reports": []},
            "expect_code": 422,
        },
        {
            "label": "Activity text too short (< 10 chars)",
            "payload": {
                **NARRATIVE_REQUEST,
                "daily_reports": [{"report_date": "2025-11-03", "activities": "Hi", "hours_worked": 8}],
            },
            "expect_code": 422,
        },
        {
            "label": "Missing student_name",
            "payload": {k: v for k, v in NARRATIVE_REQUEST.items() if k != "student_name"},
            "expect_code": 422,
        },
    ]

    all_passed = True
    for case in cases:
        try:
            payload = json.dumps(case["payload"]).encode("utf-8")
            req = urllib.request.Request(
                "http://localhost:8000/api/generate-narrative",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=10)
            print(f"  ❌ [{case['label']}] Expected error but got 200")
            all_passed = False
        except urllib.error.HTTPError as e:
            if e.code == case["expect_code"]:
                print(f"  ✅ [{case['label']}] Got expected {e.code}")
            else:
                print(f"  ⚠️  [{case['label']}] Expected {case['expect_code']}, got {e.code}")
                all_passed = False
        except Exception as e:
            print(f"  ❌ [{case['label']}] Unexpected error: {e}")
            all_passed = False

    return all_passed


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("\n🧪 AI NARRATIVE GENERATION TEST SUITE (CvSU OJT Format)")
    print(f"   Student  : {NARRATIVE_REQUEST['student_name']}")
    print(f"   Company  : {NARRATIVE_REQUEST['company_name']}")
    print(f"   Reports  : {len(SAMPLE_DAILY_REPORTS)} daily reports")
    print(f"   Date range: {START_DATE} → {END_DATE}")
    print(f"   Total hrs : {NARRATIVE_REQUEST['total_hours']}h")

    results = {
        "Direct function": test_direct_function(),
        "HTTP endpoint":   test_http_endpoint(),
        "Validation":      test_validation(),
    }

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}  {name}")

    failed = sum(1 for v in results.values() if not v)
    sys.exit(failed)
