"""
Quick test script for Phase 1 AI Service enhancements
Tests: LLT Transformer, Enhanced Sentiment, Feedback Guide
"""
import sys
from services.ai_engine import AIEngine

# Test data
test_cases = [
    {
        "name": "Short Generic Feedback",
        "text": "Good work. Nice job.",
        "ratings": {"rating_overall": 7, "rating_technical": 8, "rating_communication": 7}
    },
    {
        "name": "Detailed Technical Feedback",
        "text": """
        Jack demonstrated excellent programming skills throughout his internship. 
        He successfully completed the Node.js backend project ahead of schedule, 
        implemented RESTful APIs with proper authentication, and showed strong 
        problem-solving abilities when debugging complex database queries. 
        His communication with the team was consistently professional. 
        Areas for improvement include time management and learning React for frontend work.
        """,
        "ratings": {"rating_overall": 9, "rating_technical": 9, "rating_communication": 8, "rating_work_ethic": 8}
    },
    {
        "name": "Negative Feedback",
        "text": "Failed to meet expectations. Poor performance. Lacks basic skills.",
        "ratings": {"rating_overall": 2, "rating_technical": 3, "rating_communication": 2}
    },
    {
        "name": "Balanced Constructive Feedback",
        "text": """
        Sarah showed good initiative in learning Python and completed most assigned tasks. 
        However, she needs to improve her time management as several deadlines were missed. 
        Her teamwork skills are excellent and she communicates well with colleagues. 
        With more focus on meeting deadlines, she could be an outstanding developer.
        """,
        "ratings": {"rating_overall": 6, "rating_technical": 6, "rating_communication": 8, "rating_work_ethic": 5}
    }
]

def test_phase1():
    print("=" * 80)
    print("PHASE 1 AI SERVICE TEST")
    print("=" * 80)
    
    # Initialize AI Engine
    print("\n[1] Initializing AI Engine with Phase 1 components...")
    try:
        engine = AIEngine()
        print("✓ AI Engine initialized successfully")
        print(f"✓ Components loaded: {len(engine.get_health_status()['components'])} modules")
    except Exception as e:
        print(f"✗ Failed to initialize: {e}")
        return False
    
    # Run tests
    print("\n[2] Running test cases...\n")
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'=' * 80}")
        print(f"TEST CASE {i}: {test_case['name']}")
        print(f"{'=' * 80}")
        print(f"Text: {test_case['text'][:100]}...")
        print(f"Ratings: {test_case['ratings']}")
        
        try:
            # Run full analysis
            result = engine.analyze_evaluation(
                text=test_case['text'],
                ratings=test_case['ratings'],
                use_enhanced=True
            )
            
            # Display results
            print(f"\n📊 ANALYSIS RESULTS:")
            print(f"  Confidence Score: {result['confidence_score']}")
            print(f"  Processing Time: {result['processing_time_ms']}ms")
            
            # Sentiment
            sentiment = result['sentiment']
            print(f"\n🎭 SENTIMENT:")
            print(f"  Score: {sentiment['score']} ({sentiment['label']})")
            print(f"  Tone: {sentiment.get('tone', 'N/A')}")
            print(f"  Intensity: {sentiment.get('intensity', 'N/A')}")
            
            # Skills
            features = result['features']
            print(f"\n🛠️ SKILLS DETECTED:")
            print(f"  Technical: {len(features['technical_skills'])} - {features['technical_skills'][:3]}")
            print(f"  Soft: {len(features['soft_skills'])} - {features['soft_skills'][:3]}")
            
            # LLT Guidance
            if 'llt_guidance' in result:
                llt = result['llt_guidance']
                print(f"\n📈 LLT RATING GUIDANCE:")
                print(f"  Suggested Rating: {llt['suggested_rating']}/10")
                print(f"  Range: {llt['range']['min']} - {llt['range']['max']}")
                print(f"  Confidence: {llt['confidence']}")
                print(f"  Explanation: {llt['explanation'][:150]}...")
                if llt['guidance']:
                    print(f"  Guidance: {len(llt['guidance'])} suggestions")
                    for g in llt['guidance'][:2]:
                        print(f"    - [{g['type']}] {g['message'][:80]}...")
            
            # Feedback Quality
            if 'feedback_quality' in result:
                quality = result['feedback_quality']
                print(f"\n✍️ FEEDBACK QUALITY:")
                print(f"  Quality Score: {quality['quality_score']}/100")
                print(f"  Ready to Submit: {quality['readiness']}")
                print(f"  Suggestions: {len(quality['suggestions'])}")
                for s in quality['suggestions'][:2]:
                    print(f"    - [{s['severity']}] {s['message'][:80]}...")
                if quality['strengths']:
                    print(f"  Strengths: {quality['strengths'][0]}")
            
            # Bias Check
            bias = result['bias_check']
            print(f"\n⚖️ BIAS CHECK:")
            print(f"  Passed: {bias['passed']}")
            print(f"  Consistency: {bias['consistency_score']}")
            print(f"  Severity: {bias['severity']}")
            if bias['flags']:
                print(f"  Flags: {len(bias['flags'])} issues detected")
                for flag in bias['flags'][:2]:
                    print(f"    - {flag.get('message', 'Unknown issue')[:80]}...")
            
            print(f"\n✓ Test case {i} completed successfully")
            
        except Exception as e:
            print(f"\n✗ Test case {i} failed: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'=' * 80}")
    print("✓ ALL TESTS COMPLETED")
    print(f"{'=' * 80}\n")
    return True

if __name__ == "__main__":
    success = test_phase1()
    sys.exit(0 if success else 1)
