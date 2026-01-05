#!/usr/bin/env python3
"""Check required columns"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
client = create_client(url, key)

try:
    print("Testing different column combinations...")
    
    # Try with more columns
    test_variations = [
        {
            'name': 'medical_condition + anonymized_logs',
            'data': {'medical_condition': 'Test', 'anonymized_logs': '{"test": "data"}'}
        },
        {
            'name': 'With user_id',
            'data': {'medical_condition': 'Test', 'anonymized_logs': '{"test": "data"}', 'user_id': 'anon'}
        },
        {
            'name': 'With user_id + id',
            'data': {'id': '00000000-0000-0000-0000-000000000000', 'medical_condition': 'Test', 'anonymized_logs': '{"test": "data"}', 'user_id': 'anon'}
        },
    ]
    
    for test in test_variations:
        print(f"\nTrying: {test['name']}...")
        try:
            response = client.table('anonymized_data').insert(test['data']).execute()
            print(f"   ✓ SUCCESS with: {test['name']}")
            print(f"   Data: {response.data[0].keys()}")
            # Clean up
            if response.data:
                client.table('anonymized_data').delete().eq('id', response.data[0]['id']).execute()
            break
        except Exception as e:
            error_msg = str(e)[:100]
            print(f"   ✗ Failed: {error_msg}")
        
except Exception as e:
    print(f"Error: {e}")
