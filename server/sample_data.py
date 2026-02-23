"""
Sample data generation: CSV and seasonal/weekly helpers.
"""
import json
import random
import csv
from datetime import datetime, timedelta
from pathlib import Path

from . import config


def get_seasonal_factor(month):
    """Calculate seasonal factor (winter worse, summer better)."""
    if month == 11 or month == 0 or month == 1:
        return -0.3
    if 2 <= month <= 4:
        return 0
    if 5 <= month <= 7:
        return 0.2
    return 0


def get_weekly_pattern(day_of_week):
    """Calculate day of week pattern (weekends better)."""
    if day_of_week in (5, 6):
        return 0.15
    return -0.1


def generate_sample_csv_data(num_days=90, base_weight=75.0, output_path=None):
    """Generate randomized health data and save to CSV. Returns path to file."""
    if output_path is None:
        output_path = config.PROJECT_ROOT / f'health_data_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    try:
        today = datetime.now()
        end_date = today - timedelta(days=1)
        start_date = end_date - timedelta(days=num_days - 1)
        batch_size = 1000
        random_batch = [random.random() for _ in range(batch_size)]
        random_index = 0

        def get_random():
            nonlocal random_index, random_batch
            if random_index >= len(random_batch):
                random_batch = [random.random() for _ in range(batch_size)]
                random_index = 0
            result = random_batch[random_index]
            random_index += 1
            return result

        healthy_foods = [
            {'name': 'Grilled chicken, 200g', 'calories': 330, 'protein': 62},
            {'name': 'Brown rice, 150g', 'calories': 165, 'protein': 3.5},
            {'name': 'Steamed vegetables', 'calories': 50, 'protein': 2},
            {'name': 'Salmon fillet, 180g', 'calories': 360, 'protein': 50},
            {'name': 'Quinoa salad', 'calories': 220, 'protein': 8},
            {'name': 'Greek yogurt, 150g', 'calories': 130, 'protein': 11},
            {'name': 'Oatmeal with berries', 'calories': 200, 'protein': 5},
            {'name': 'Mixed nuts, 30g', 'calories': 180, 'protein': 5},
            {'name': 'Eggs, 2 large', 'calories': 140, 'protein': 12},
            {'name': 'Grilled fish, 200g', 'calories': 280, 'protein': 45}
        ]
        comfort_foods = [
            {'name': 'Pizza slice', 'calories': 280, 'protein': 12},
            {'name': 'Pasta, 200g', 'calories': 250, 'protein': 8},
            {'name': 'Bread, 2 slices', 'calories': 160, 'protein': 6},
            {'name': 'Chocolate bar', 'calories': 220, 'protein': 3}
        ]
        exercise_templates = [
            'Walking, 30 minutes', 'Yoga, 20 minutes', 'Swimming, 25 minutes',
            'Cycling, 40 minutes', 'Stretching, 15 minutes', 'Light jogging, 20 minutes',
            'Pilates, 30 minutes', 'Tai Chi, 25 minutes', 'Water aerobics, 30 minutes',
            'Physical therapy exercises, 20 minutes', 'Gentle strength training, 15 minutes',
            'Balance exercises, 10 minutes'
        ]
        current_weight = base_weight
        flare_state = False
        flare_duration = 0
        recovery_phase = 0
        baseline_health = 6.0
        entries = []

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
            r1, r2, r3, r4, r5, r6, r7, r8, r9, r10 = [get_random() for _ in range(10)]
            if flare_state:
                fatigue = max(1, min(10, round(baseline_health - 3 + (r1 * 3))))
                stiffness = max(1, min(10, round(baseline_health - 2.5 + (r2 * 3))))
                back_pain = max(1, min(10, round(baseline_health - 2 + (r3 * 3))))
                joint_pain = max(1, min(10, round(baseline_health - 2.5 + (r4 * 2.5))))
                sleep = max(1, min(10, round(baseline_health - 4 + (r5 * 2))))
                mobility = max(1, min(10, round(baseline_health - 4 + (r6 * 2))))
                daily_function = max(1, min(10, round(baseline_health - 3.5 + (r7 * 2.5))))
                swelling = max(1, min(10, round(baseline_health - 3 + (r8 * 2.5))))
                mood = max(1, min(10, round(baseline_health - 3.5 + (r9 * 2))))
                irritability = max(1, min(10, round(baseline_health - 2 + (r10 * 3))))
                bpm = int(70 + (get_random() * 15))
            else:
                sleep = max(1, min(10, round(baseline_health + (r1 * 2) + seasonal_factor + weekly_pattern + recovery_boost)))
                fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (r2 * 1.5))))
                stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (r3 * 1.5) + recovery_boost)))
                back_pain = max(1, min(10, round(stiffness + (r4 * 1) - 0.5)))
                joint_pain = max(1, min(10, round(stiffness * 0.7 + (r5 * 1.2))))
                mobility = max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (r6 * 1) + recovery_boost)))
                daily_function = max(1, min(10, round(mobility * 0.9 + (r7 * 1))))
                swelling = max(1, min(10, round(joint_pain * 0.6 + (r8 * 1))))
                mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (r9 * 1) + weekly_pattern + recovery_boost)))
                irritability = max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (r10 * 1.5))))
                bpm = int(65 + (fatigue - 5) * 2 + (get_random() * 8) + (seasonal_factor * 3))
            has_exercise = get_random() < 0.4
            current_weight += -0.02 if has_exercise else 0.01
            current_weight = max(70, min(80, current_weight))
            weight = round(current_weight, 1)
            food_items = []
            exercise_items = []
            exercise_chance = 0.15 if flare_state else (0.6 if mood > 6 else 0.3)
            if get_random() < exercise_chance:
                num_exercise = 1 if flare_state else random.randint(1, 2)
                exercise_items = random.sample(exercise_templates, min(num_exercise, len(exercise_templates)))
            if get_random() < 0.65:
                num_food = random.randint(1, 3)
                food_pool = healthy_foods if (mood > 6 and not flare_state) else (healthy_foods + comfort_foods if flare_state else healthy_foods)
                for _ in range(num_food):
                    template = random.choice(food_pool)
                    food_items.append({
                        'name': template['name'],
                        'calories': round(template['calories'] * (1 + (get_random() - 0.5) * 0.15)),
                        'protein': round(template['protein'] * (1 + (get_random() - 0.5) * 0.15), 1)
                    })
            weather_sensitivity = max(1, min(10, round(5 + (stiffness - 5) * 0.5 - seasonal_factor * 2)))
            steps = max(1000, min(15000, round(6000 + (mobility - 5) * 800 + (mood - 5) * 500 - (fatigue - 5) * 400 + (get_random() * 2000 - 1000))))
            hydration = round(6 + (1 if exercise_items else 0) + (get_random() * 2 - 1), 1)
            energy_clarity_options = ["High Energy", "Moderate Energy", "Low Energy", "Mental Clarity", "Brain Fog", "Good Concentration", "Poor Concentration", "Mental Fatigue", "Focused", "Distracted"]
            energy_clarity = ""
            r_energy = get_random()
            if sleep >= 7 and mood >= 7:
                energy_clarity = random.choice(["High Energy", "Mental Clarity", "Good Concentration"]) if r_energy < 0.7 else random.choice(energy_clarity_options)
            elif sleep < 5 or mood < 5:
                energy_clarity = random.choice(["Low Energy", "Brain Fog", "Mental Fatigue"]) if r_energy < 0.6 else random.choice(energy_clarity_options)
            else:
                energy_clarity = random.choice(energy_clarity_options) if r_energy < 0.4 else ""
            notes = ""
            if get_random() < 0.12:
                if flare_state:
                    notes = "Flare-up day - increased symptoms"
                elif 0 < recovery_phase < 3:
                    notes = "Recovering from flare - feeling better"
                elif seasonal_factor < -0.2:
                    notes = "Winter symptoms - more stiffness"
                elif sleep < 5:
                    notes = "Poor sleep last night"
                else:
                    notes = random.choice([
                        "Feeling better today", "Morning stiffness was manageable",
                        "Had a good night's sleep", "Some joint pain in the morning",
                        "Feeling tired", "Good day overall", "Minor flare symptoms",
                        "Exercised today, feeling good"
                    ])
            food_json = json.dumps(food_items) if food_items else ""
            exercise_json = json.dumps(exercise_items) if exercise_items else ""
            entry = {
                'Date': date_str, 'BPM': str(bpm), 'Weight': str(weight), 'Fatigue': str(fatigue),
                'Stiffness': str(stiffness), 'Back Pain': str(back_pain), 'Sleep': str(sleep),
                'Joint Pain': str(joint_pain), 'Mobility': str(mobility), 'Daily Function': str(daily_function),
                'Swelling': str(swelling), 'Flare': 'Yes' if flare_state else 'No', 'Mood': str(mood),
                'Irritability': str(irritability), 'Weather Sensitivity': str(weather_sensitivity),
                'Steps': str(steps), 'Hydration': str(hydration), 'Energy Clarity': energy_clarity,
                'Stressors': '', 'Symptoms': '', 'Pain Location': '', 'Food': food_json,
                'Exercise': exercise_json, 'Notes': notes
            }
            entries.append(entry)

        headers = [
            'Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain',
            'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling',
            'Flare', 'Mood', 'Irritability', 'Weather Sensitivity', 'Steps', 'Hydration',
            'Energy Clarity', 'Stressors', 'Symptoms', 'Pain Location', 'Food', 'Exercise', 'Notes'
        ]
        def escape_csv_value(value):
            if value is None or value == '':
                return ''
            value_str = str(value)
            if ',' in value_str or '"' in value_str or '\n' in value_str:
                return '"' + value_str.replace('"', '""') + '"'
            return value_str
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            csvfile.write(','.join(headers) + '\n')
            for entry in entries:
                row = [escape_csv_value(entry.get(h, '')) for h in headers]
                csvfile.write(','.join(row) + '\n')
        config.logger.info(f"Generated {len(entries)} entries and saved to '{output_path}'")
        return str(output_path)
    except Exception as e:
        config.logger.error(f"Error generating CSV data: {e}", exc_info=True)
        return None
