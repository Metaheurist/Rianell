"""
Supabase client and data operations.
"""
import sys
import json
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

from . import config
from . import encryption
from .sample_data import get_seasonal_factor, get_weekly_pattern

supabase_client = None
supabase_service_client = None
SUPABASE_AVAILABLE = False


def check_supabase_availability():
    """Check if Supabase is available (system/venv or local lib)."""
    global SUPABASE_AVAILABLE
    try:
        __import__('supabase')
        config.logger.debug("Supabase found in system/venv Python")
        SUPABASE_AVAILABLE = True
        return True
    except ImportError:
        pass
    if config.LOCAL_LIB_DIR.exists():
        try:
            if str(config.LOCAL_LIB_DIR) not in sys.path:
                sys.path.insert(0, str(config.LOCAL_LIB_DIR))
            __import__('supabase')
            config.logger.debug("Supabase found in local lib")
            SUPABASE_AVAILABLE = True
            return True
        except ImportError:
            pass
    SUPABASE_AVAILABLE = False
    return False


def init_supabase_client():
    """Initialize Supabase client."""
    global supabase_client
    if not SUPABASE_AVAILABLE:
        check_supabase_availability()
    if not SUPABASE_AVAILABLE:
        return None
    try:
        from supabase import create_client
        if supabase_client is None:
            supabase_client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
            config.logger.info("Supabase client initialized successfully")
        return supabase_client
    except Exception as e:
        config.logger.warning(f"Could not create Supabase client: {e}")
        return None


def get_supabase_service_client():
    """
    Client using the Supabase secret key (service_role; bypasses RLS).
    Use only in trusted server code, never in the browser.
    Required for server-side inserts into anonymized_data when RLS is enabled and rows have no auth.uid().
    """
    global supabase_service_client
    if not SUPABASE_AVAILABLE:
        check_supabase_availability()
    if not SUPABASE_AVAILABLE:
        return None
    key = (config.SUPABASE_SERVICE_KEY or "").strip()
    if not key:
        return None
    try:
        from supabase import create_client
        if supabase_service_client is None:
            supabase_service_client = create_client(config.SUPABASE_URL, key)
            config.logger.info("Supabase secret-key client initialized (service_role; RLS bypass for server-side ops)")
        return supabase_service_client
    except Exception as e:
        config.logger.warning(f"Could not create Supabase service client: {e}")
        return None


def run_sql(sql):
    """Execute SQL via DATABASE_URL or Supabase RPC."""
    if config.DATABASE_URL:
        try:
            try:
                import psycopg
                conn = psycopg.connect(config.DATABASE_URL)
            except Exception:
                import psycopg2
                conn = psycopg2.connect(config.DATABASE_URL)
            cur = conn.cursor()
            cur.execute(sql)
            rows = cur.fetchall() if cur.description else None
            conn.commit()
            cur.close()
            conn.close()
            return rows if rows is not None else {'status': 'ok'}
        except Exception as e:
            config.logger.error(f"Direct SQL execution failed: {e}")
            raise
    if config.SUPABASE_SERVICE_KEY:
        try:
            import requests
            rpc_url = config.SUPABASE_URL.rstrip('/') + '/rest/v1/rpc/exec_sql'
            headers = {
                'apikey': config.SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {config.SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            }
            resp = requests.post(rpc_url, headers=headers, json={'q': sql}, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            config.logger.error(f"RPC SQL execution failed: {e}")
            raise
    raise RuntimeError('No method available to execute SQL. Set DATABASE_URL or SUPABASE_SERVICE_KEY.')


def try_restart_anonymized_data_id_sequence():
    """
    After wiping anonymized_data, reset the id sequence so new rows start at 1.
    Uses run_sql(): DATABASE_URL (direct Postgres) when set, otherwise exec_sql RPC with service_role.
    The RPC is optional-many projects do not define it; DATABASE_URL is the reliable path.
    """
    try:
        run_sql('ALTER SEQUENCE public.anonymized_data_id_seq RESTART WITH 1;')
        return True
    except Exception as e:
        config.logger.info(f"Could not auto-reset anonymized_data id sequence: {e}")
        return False


def search_supabase_data(condition=None, limit=100):
    """Search anonymized_data in Supabase."""
    # Prefer service_role key so RLS doesn't block server-side sample inserts.
    client = get_supabase_service_client() or init_supabase_client()
    if not client:
        return None
    try:
        query = client.table('anonymized_data').select('*')
        if condition:
            query = query.eq('medical_condition', condition)
        query = query.limit(limit).order('created_at', desc=True)
        response = query.execute()
        data = response.data
        if data:
            for record in data:
                encrypted_log = record.get('anonymized_logs') or record.get('anonymized_log')
                if encrypted_log and isinstance(encrypted_log, str):
                    try:
                        decrypted_log = encryption.decrypt_anonymized_data(encrypted_log)
                        if decrypted_log:
                            record['anonymized_logs'] = record['anonymized_log'] = decrypted_log
                    except Exception as e:
                        config.logger.warning(f"Error decrypting record {record.get('id')}: {e}")
        return data
    except Exception as e:
        config.logger.error(f"Error searching Supabase: {e}", exc_info=True)
        return None


def export_supabase_data(output_path=None, condition=None):
    """Export Supabase data to CSV."""
    if output_path is None:
        output_path = config.PROJECT_ROOT / f'supabase_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    data = search_supabase_data(condition=condition, limit=10000)
    if not data:
        return None
    try:
        headers = ['id', 'medical_condition', 'created_at', 'updated_at']
        log_headers = []
        if data:
            first_log = data[0].get('anonymized_logs') or data[0].get('anonymized_log', {})
            if isinstance(first_log, dict):
                log_headers = list(first_log.keys())
        all_headers = headers + log_headers
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=all_headers)
            writer.writeheader()
            for record in data:
                row = {
                    'id': record.get('id', ''),
                    'medical_condition': record.get('medical_condition', ''),
                    'created_at': record.get('created_at', ''),
                    'updated_at': record.get('updated_at', '')
                }
                encrypted_log = record.get('anonymized_logs') or record.get('anonymized_log')
                log_data = encryption.decrypt_anonymized_data(encrypted_log) if encrypted_log else {}
                if isinstance(log_data, dict):
                    for key in log_headers:
                        value = log_data.get(key, '')
                        if isinstance(value, (list, dict)):
                            value = json.dumps(value)
                        row[key] = value
                writer.writerow(row)
        config.logger.info(f"Exported {len(data)} records to {output_path}")
        return str(output_path)
    except Exception as e:
        config.logger.error(f"Error exporting Supabase data: {e}", exc_info=True)
        return None


def generate_and_post_sample_data_to_supabase(num_days=90, medical_condition="Medical Condition", base_weight=75.0):
    """Generate and post sample anonymized data to Supabase. Returns count posted."""
    global SUPABASE_AVAILABLE
    SUPABASE_AVAILABLE = check_supabase_availability()
    if not SUPABASE_AVAILABLE:
        config.logger.error("Cannot post sample data: Supabase not available")
        return 0
    # Prefer service role client so RLS does not block server-side sample inserts.
    client = get_supabase_service_client() or init_supabase_client()
    if not client:
        return 0
    try:
        today = datetime.now()
        end_date = today - timedelta(days=1)
        start_date = end_date - timedelta(days=num_days - 1)
        healthy_foods = [
            {'name': 'Grilled chicken, 200g', 'calories': 330, 'protein': 62},
            {'name': 'Brown rice, 150g', 'calories': 165, 'protein': 3.5},
            {'name': 'Steamed vegetables', 'calories': 50, 'protein': 2},
            {'name': 'Salmon fillet, 180g', 'calories': 360, 'protein': 50},
        ]
        exercise_templates = [
            'Walking, 30 minutes', 'Yoga, 20 minutes', 'Swimming, 25 minutes',
            'Cycling, 40 minutes', 'Stretching, 15 minutes'
        ]
        random_batch = [random.random() for _ in range(1000)]
        random_index = [0]
        def get_random():
            if random_index[0] >= len(random_batch):
                random_batch[:] = [random.random() for _ in range(1000)]
                random_index[0] = 0
            result = random_batch[random_index[0]]
            random_index[0] += 1
            return result
        current_weight = base_weight
        flare_state = False
        flare_duration = 0
        recovery_phase = 0
        baseline_health = 6.0
        posted_count = 0
        batch_data = []
        for day in range(num_days):
            date = start_date + timedelta(days=day)
            date_str = date.strftime('%Y-%m-%d')
            month = date.month - 1
            day_of_week = date.weekday()
            seasonal_factor = get_seasonal_factor(month)
            weekly_pattern = get_weekly_pattern(day_of_week)
            years_progress = day / 365.25
            baseline_health = min(7.5, 6.0 + (years_progress / 10) * 1.5)
            flare_chance = 0.12 + (seasonal_factor * 0.1)
            if flare_duration > 0:
                flare_duration -= 1
                if flare_duration == 0:
                    flare_state = False
                    recovery_phase = 1
            elif get_random() < flare_chance:
                flare_state = True
                flare_duration = random.randint(2, 5)
            else:
                recovery_phase += 1
            recovery_boost = min(0.3, recovery_phase * 0.05) if 0 < recovery_phase < 7 else 0
            r_vals = [get_random() for _ in range(10)]
            if flare_state:
                fatigue = max(1, min(10, round(baseline_health - 3 + (r_vals[0] * 3))))
                stiffness = max(1, min(10, round(baseline_health - 2.5 + (r_vals[1] * 3))))
                back_pain = max(1, min(10, round(baseline_health - 2 + (r_vals[2] * 3))))
                sleep = max(1, min(10, round(baseline_health - 4 + (r_vals[3] * 2))))
                mood = max(1, min(10, round(baseline_health - 3.5 + (r_vals[4] * 2))))
            else:
                sleep = max(1, min(10, round(baseline_health + (r_vals[0] * 2) + seasonal_factor + weekly_pattern + recovery_boost)))
                fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (r_vals[1] * 1.5))))
                stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (r_vals[2] * 1.5))))
                back_pain = max(1, min(10, round(stiffness + (r_vals[3] * 1) - 0.5)))
                mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r_vals[4] * 1))))
            has_exercise = get_random() < 0.4
            current_weight += -0.02 if has_exercise else 0.01
            current_weight = max(70, min(80, current_weight))
            weight = round(current_weight, 1)
            food_items = []
            exercise_items = []
            if get_random() < 0.65:
                for _ in range(random.randint(1, 3)):
                    t = random.choice(healthy_foods)
                    food_items.append({'name': t['name'], 'calories': round(t['calories'] * (1 + (get_random() - 0.5) * 0.15)), 'protein': round(t['protein'] * (1 + (get_random() - 0.5) * 0.15), 1)})
            if get_random() < (0.15 if flare_state else 0.6):
                exercise_items = random.sample(exercise_templates, min(1 if flare_state else random.randint(1, 2), len(exercise_templates)))
            r_extra = [get_random() for _ in range(5)]
            anonymized_log = {
                'date': date_str, 'bpm': int(65 + (fatigue - 5) * 2 + (r_extra[0] * 8)), 'weight': weight,
                'fatigue': fatigue, 'stiffness': stiffness, 'backPain': back_pain, 'sleep': sleep,
                'jointPain': max(1, min(10, round(stiffness * 0.7 + (r_extra[1] * 1.2)))),
                'mobility': max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 + (r_extra[2] * 1)))),
                'dailyFunction': max(1, min(10, round(baseline_health + 0.5 + (r_extra[3] * 1)))),
                'swelling': max(1, min(10, round(baseline_health - 1 + (r_extra[4] * 1.5)))),
                'flare': 'Yes' if flare_state else 'No', 'mood': mood,
                'irritability': max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 + (get_random() * 1.5)))),
                'weatherSensitivity': max(1, min(10, round(5 + (stiffness - 5) * 0.5))),
                'steps': max(1000, min(15000, round(6000 + (get_random() * 2000 - 1000)))),
                'hydration': round(6 + (get_random() * 2 - 1), 1), 'food': food_items, 'exercise': exercise_items
            }
            batch_data.append({'medical_condition': medical_condition, 'anonymized_logs': encryption.encrypt_anonymized_data(anonymized_log)})
            if len(batch_data) >= 100 or day == num_days - 1:
                try:
                    client.table('anonymized_data').insert(batch_data).execute()
                    posted_count += len(batch_data)
                    config.logger.info(f"Posted batch: {posted_count}/{num_days} records...")
                    batch_data = []
                except Exception as e:
                    config.logger.error(f"Error posting batch: {e}")
                    for record in batch_data:
                        try:
                            client.table('anonymized_data').insert(record).execute()
                            posted_count += 1
                        except Exception:
                            pass
                    batch_data = []
        config.logger.info(f"Generated and posted {posted_count} sample records to Supabase")
        return posted_count
    except Exception as e:
        config.logger.error(f"Error generating and posting sample data: {e}", exc_info=True)
        return 0
