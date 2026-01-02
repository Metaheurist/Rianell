9036#!/usr/bin/env python3
"""
Generate randomized sample health data for Health App import.
Creates a CSV file with realistic health metrics over a specified date range.
Uses the same pattern-based generation as demo mode in JavaScript.
"""

import csv
import random
from datetime import datetime, timedelta
import os
import json

def get_seasonal_factor(month):
    """Calculate seasonal factor (winter worse, summer better)."""
    # Winter months (Dec, Jan, Feb) = -0.3, Spring/Fall = 0, Summer = +0.2
    if month == 11 or month == 0 or month == 1:  # Dec, Jan, Feb
        return -0.3
    if 2 <= month <= 4:  # Mar, Apr, May
        return 0
    if 5 <= month <= 7:  # Jun, Jul, Aug
        return 0.2
    return 0  # Sep, Oct, Nov

def get_weekly_pattern(day_of_week):
    """Calculate day of week pattern (weekends better)."""
    # Sunday = 6, Saturday = 5 (better), Weekdays = worse
    if day_of_week == 6 or day_of_week == 5:  # Weekend boost
        return 0.15
    return -0.1  # Weekday stress

def generate_sample_data(num_days=90, start_date=None, base_weight=75.0):
    """
    Generate randomized health data entries with realistic patterns.
    
    Args:
        num_days: Number of days of data to generate (default: 90)
        start_date: Start date (default: today - num_days)
        base_weight: Base weight in kg (default: 75.0)
    
    Returns:
        List of dictionaries containing health log entries
    """
    # Generate dates for the past num_days, ending yesterday (most recent entry)
    if start_date is None:
        # Get today's date - use actual current date, not hardcoded
        today = datetime.now()
        # Start from num_days ago, end yesterday (so we have num_days total)
        end_date = today - timedelta(days=1)  # Yesterday
        start_date = end_date - timedelta(days=num_days - 1)  # num_days before yesterday
        
        # Validate dates are reasonable (supports up to 10 years back)
        # This prevents issues if system date is wrong
        if start_date.year < 2014 or start_date.year > 2035:
            print(f"Warning: Generated start date {start_date.strftime('%Y-%m-%d')} seems incorrect.")
            print(f"Current system date: {today.strftime('%Y-%m-%d')}")
            # Recalculate from a safe date
            today = datetime(2024, 12, 31) if today.year < 2024 else today
            end_date = today - timedelta(days=1)
            start_date = end_date - timedelta(days=num_days - 1)
    
    entries = []
    
    # Track state for realistic trends and patterns
    current_weight = base_weight
    flare_state = False
    flare_duration = 0
    recovery_phase = 0  # Days since last flare (for recovery patterns)
    baseline_health = 6.0  # Baseline health score (improves over time)
    
    # Pattern tracking for correlations
    previous_sleep = 7
    previous_mood = 7
    previous_fatigue = 4
    previous_stiffness = 3
    
    # Food templates
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
        'Walking, 30 minutes',
        'Yoga, 20 minutes',
        'Swimming, 25 minutes',
        'Cycling, 40 minutes',
        'Stretching, 15 minutes',
        'Light jogging, 20 minutes',
        'Pilates, 30 minutes',
        'Tai Chi, 25 minutes',
        'Water aerobics, 30 minutes',
        'Physical therapy exercises, 20 minutes',
        'Gentle strength training, 15 minutes',
        'Balance exercises, 10 minutes'
    ]
    
    # Generate exactly num_days of consecutive daily entries with patterns
    for day in range(num_days):
        date = start_date + timedelta(days=day)
        date_str = date.strftime('%Y-%m-%d')  # Format: YYYY-MM-DD
        month = date.month - 1  # 0-11
        day_of_week = date.weekday()  # 0-6 (Monday = 0)
        
        # Calculate patterns
        seasonal_factor = get_seasonal_factor(month)
        weekly_pattern = get_weekly_pattern(day_of_week)
        
        # Long-term improvement trend (baseline health improves over time)
        years_progress = day / 365.25
        baseline_health = 6.0 + (years_progress / 10) * 1.5  # Improves from 6.0 to 7.5 over 10 years
        baseline_health = min(7.5, baseline_health)
        
        # Flare-up pattern: More likely in winter, less likely in summer
        flare_chance = 0.12 + (seasonal_factor * 0.1)  # Higher in winter
        if flare_duration > 0:
            flare_duration -= 1
            recovery_phase = 0
            if flare_duration == 0:
                flare_state = False
                recovery_phase = 1
        elif random.random() < flare_chance:
            flare_state = True
            flare_duration = random.randint(2, 5)
            recovery_phase = 0
        else:
            recovery_phase += 1
        
        # Recovery pattern: Gradual improvement after flare
        recovery_boost = min(0.3, recovery_phase * 0.05) if recovery_phase > 0 and recovery_phase < 7 else 0
        
        # Base values with patterns
        if flare_state:
            # During flare: All symptoms worse, clear correlations
            fatigue = max(1, min(10, round(baseline_health - 3 + (random.random() * 3) - (seasonal_factor * 2))))
            stiffness = max(1, min(10, round(baseline_health - 2.5 + (random.random() * 3) - (seasonal_factor * 2))))
            back_pain = max(1, min(10, round(baseline_health - 2 + (random.random() * 3) - (seasonal_factor * 2))))
            joint_pain = max(1, min(10, round(baseline_health - 2.5 + (random.random() * 2.5) - (seasonal_factor * 1.5))))
            sleep = max(1, min(10, round(baseline_health - 4 + (random.random() * 2) - (seasonal_factor * 1.5))))
            mobility = max(1, min(10, round(baseline_health - 4 + (random.random() * 2) - (seasonal_factor * 1.5))))
            daily_function = max(1, min(10, round(baseline_health - 3.5 + (random.random() * 2.5) - (seasonal_factor * 1.5))))
            swelling = max(1, min(10, round(baseline_health - 3 + (random.random() * 2.5) - (seasonal_factor * 1))))
            mood = max(1, min(10, round(baseline_health - 3.5 + (random.random() * 2) - (seasonal_factor * 1.5))))
            irritability = max(1, min(10, round(baseline_health - 2 + (random.random() * 3) - (seasonal_factor * 1))))
            bpm = int(70 + (random.random() * 15) + (seasonal_factor * 5))
        else:
            # Normal state: Clear correlations and patterns
            # Sleep quality affects everything
            sleep_quality = baseline_health + (random.random() * 2) + seasonal_factor + weekly_pattern + recovery_boost
            sleep = max(1, min(10, round(sleep_quality)))
            
            # Fatigue inversely correlates with sleep (strong correlation)
            fatigue = max(1, min(10, round(baseline_health - (sleep - 5) * 0.8 + (random.random() * 1.5) - seasonal_factor)))
            
            # Stiffness correlates with weather (winter worse)
            stiffness = max(1, min(10, round(baseline_health - 2 - (seasonal_factor * 2) + (random.random() * 1.5) + recovery_boost)))
            
            # Back pain correlates with stiffness (strong correlation)
            back_pain = max(1, min(10, round(stiffness + (random.random() * 1) - 0.5)))
            
            # Joint pain correlates with stiffness
            joint_pain = max(1, min(10, round(stiffness * 0.7 + (random.random() * 1.2))))
            
            # Mobility inversely correlates with stiffness and fatigue
            mobility = max(1, min(10, round(baseline_health + 1 - (stiffness - 5) * 0.5 - (fatigue - 5) * 0.3 + (random.random() * 1) + recovery_boost)))
            
            # Daily function correlates with mobility and mood
            daily_function = max(1, min(10, round(mobility * 0.9 + (random.random() * 1))))
            
            # Swelling correlates with joint pain
            swelling = max(1, min(10, round(joint_pain * 0.6 + (random.random() * 1))))
            
            # Mood correlates with sleep and inversely with fatigue (strong correlations)
            mood = max(1, min(10, round(baseline_health + 0.5 + (sleep - 5) * 0.6 - (fatigue - 5) * 0.4 + (random.random() * 1) + weekly_pattern + recovery_boost)))
            
            # Irritability inversely correlates with mood and sleep
            irritability = max(1, min(10, round(baseline_health - 2 - (mood - 5) * 0.5 - (sleep - 5) * 0.3 + (random.random() * 1.5))))
            
            # BPM correlates with stress/fatigue
            bpm = int(65 + (fatigue - 5) * 2 + (random.random() * 8) + (seasonal_factor * 3))
        
        # Store for next iteration (for trend patterns)
        previous_sleep = sleep
        previous_mood = mood
        previous_fatigue = fatigue
        previous_stiffness = stiffness
        
        # Weight: Gradual improvement pattern (loses weight when exercising, gains when not)
        has_exercise = random.random() < 0.4
        weight_change = -0.02 if has_exercise else 0.01  # Exercise = weight loss
        current_weight += weight_change
        current_weight = max(70, min(80, current_weight))
        weight = round(current_weight, 1)
        
        # Notes: Add meaningful notes that reflect patterns
        notes = ""
        if random.random() < 0.12:
            if flare_state:
                notes = "Flare-up day - increased symptoms"
            elif recovery_phase > 0 and recovery_phase < 3:
                notes = "Recovering from flare - feeling better"
            elif seasonal_factor < -0.2:
                notes = "Winter symptoms - more stiffness"
            elif sleep < 5:
                notes = "Poor sleep last night"
            else:
                notes_options = [
                    "Feeling better today",
                    "Morning stiffness was manageable",
                    "Had a good night's sleep",
                    "Some joint pain in the morning",
                    "Feeling tired",
                    "Good day overall",
                    "Minor flare symptoms",
                    "Exercised today, feeling good"
                ]
                notes = random.choice(notes_options)
        
        # Generate food and exercise data with clear impact patterns
        food_items = []
        exercise_items = []
        
        # Exercise pattern: More exercise on good days, less on flare days
        exercise_chance = 0.15 if flare_state else (0.6 if mood > 6 else 0.3)
        if random.random() < exercise_chance:
            num_exercise_items = 1 if flare_state else random.randint(1, 2)
            exercise_items = random.sample(exercise_templates, min(num_exercise_items, len(exercise_templates)))
        
        # Food pattern: Better nutrition on good days, comfort food on bad days
        food_chance = 0.65
        if random.random() < food_chance:
            num_food_items = random.randint(1, 3)
            # Use healthy foods on good days, mix on bad days
            food_pool = healthy_foods if (mood > 6 and not flare_state) else (healthy_foods + comfort_foods if flare_state else healthy_foods)
            
            for _ in range(num_food_items):
                template = random.choice(food_pool)
                calorie_variation = 1 + (random.random() - 0.5) * 0.15
                protein_variation = 1 + (random.random() - 0.5) * 0.15
                food_items.append({
                    'name': template['name'],
                    'calories': round(template['calories'] * calorie_variation),
                    'protein': round(template['protein'] * protein_variation, 1)
                })
        
        # Energy/Clarity: Correlates with sleep and mood
        energy_clarity_options = ["High Energy", "Moderate Energy", "Low Energy", "Mental Clarity", "Brain Fog", "Good Concentration", "Poor Concentration", "Mental Fatigue", "Focused", "Distracted"]
        energy_clarity = ""
        if sleep >= 7 and mood >= 7:
            energy_clarity = random.choice(["High Energy", "Mental Clarity", "Good Concentration"]) if random.random() < 0.7 else random.choice(energy_clarity_options)
        elif sleep < 5 or mood < 5:
            energy_clarity = random.choice(["Low Energy", "Brain Fog", "Mental Fatigue"]) if random.random() < 0.6 else random.choice(energy_clarity_options)
        else:
            energy_clarity = random.choice(energy_clarity_options) if random.random() < 0.4 else ""
        
        # Stressors: More on flare days, weather-related in winter
        stressors_options = ["Work deadline", "Family conflict", "Financial stress", "Social event", "Travel", "Weather change", "Sleep disruption", "Physical overexertion", "Emotional stress", "Health concern", "Relationship issue"]
        stressors = []
        if flare_state:
            # During flares, more likely to have stressors
            num_stressors = random.randint(1, 2)
            if seasonal_factor < -0.2:
                stressors.append("Weather change")
            if sleep < 5:
                stressors.append("Sleep disruption")
            if num_stressors > len(stressors):
                stressors.extend(random.sample([s for s in stressors_options if s not in stressors], 
                                               min(num_stressors - len(stressors), len(stressors_options))))
        elif random.random() < 0.3:
            num_stressors = random.randint(0, 1)
            if seasonal_factor < -0.2 and random.random() < 0.5:
                stressors.append("Weather change")
            if num_stressors > len(stressors):
                stressors.extend(random.sample([s for s in stressors_options if s not in stressors], 
                                               min(num_stressors - len(stressors), len(stressors_options))))
        
        # Symptoms: Correlate with flare state and other metrics
        symptoms_options = ["Headache", "Nausea", "Dizziness", "Muscle aches", "Joint swelling", "Stiffness", "Fatigue", "Brain fog", "Sleep disturbance", "Mood changes", "Irritability"]
        symptoms = []
        if flare_state:
            num_symptoms = random.randint(2, 4)
            flare_symptoms = ["Joint swelling", "Stiffness", "Muscle aches", "Fatigue"]
            symptoms.extend(flare_symptoms)
            if num_symptoms > len(symptoms):
                available = [s for s in symptoms_options if s not in symptoms]
                symptoms.extend(random.sample(available, min(num_symptoms - len(symptoms), len(available))))
        elif fatigue > 6 or stiffness > 6:
            if random.random() < 0.4:
                symptoms.append("Fatigue" if fatigue > 6 else "Stiffness")
        
        # Pain location: Correlates with back pain and joint pain
        pain_location = ""
        if back_pain > 5:
            pain_location = random.choice(["Lower back", "Upper back", "Hips"]) if random.random() < 0.6 else random.choice(["Lower back", "Upper back"])
        elif joint_pain > 5:
            joint_locations = ["Knees", "Hips", "Ankles", "Wrists", "Hands"]
            pain_location = random.choice(joint_locations)
        
        # Weather sensitivity: Higher in winter, correlates with stiffness
        weather_sensitivity = max(1, min(10, round(5 + (stiffness - 5) * 0.5 - seasonal_factor * 2)))
        
        # Steps: Correlates with mobility and mood (good days = more steps)
        steps = max(1000, min(15000, round(6000 + (mobility - 5) * 800 + (mood - 5) * 500 - (fatigue - 5) * 400 + (random.random() * 2000 - 1000))))
        
        # Hydration: Slightly higher on exercise days
        hydration = max(2, min(12, round(6 + (1 if exercise_items else 0) + (random.random() * 2 - 1))))
        
        flare = "Yes" if flare_state else "No"
        
        # Format food and exercise as JSON strings (matching app format)
        food_json = json.dumps(food_items) if food_items else ""
        exercise_json = json.dumps(exercise_items) if exercise_items else ""
        
        entry = {
            'Date': date_str,
            'BPM': str(bpm),
            'Weight': str(weight),
            'Fatigue': str(fatigue),
            'Stiffness': str(stiffness),
            'Back Pain': str(back_pain),
            'Sleep': str(sleep),
            'Joint Pain': str(joint_pain),
            'Mobility': str(mobility),
            'Daily Function': str(daily_function),
            'Swelling': str(swelling),
            'Flare': flare,
            'Mood': str(mood),
            'Irritability': str(irritability),
            'Weather Sensitivity': str(weather_sensitivity),
            'Steps': str(steps),
            'Hydration': str(round(hydration, 1)),
            'Energy Clarity': energy_clarity,
            'Stressors': ', '.join(stressors) if stressors else '',
            'Symptoms': ', '.join(symptoms) if symptoms else '',
            'Pain Location': pain_location,
            'Food': food_json,
            'Exercise': exercise_json,
            'Notes': notes
        }
        
        entries.append(entry)
    
    return entries

def save_to_csv(entries, filename='health_data_sample.csv'):
    """
    Save entries to CSV file in the format expected by the Health App.
    Overwrites existing file if it exists.
    
    Args:
        entries: List of dictionaries containing health log entries
        filename: Output filename (default: 'health_data_sample.csv')
    """
    if not entries:
        print("No entries to save.")
        return
    
    # Check if file exists and will be overwritten
    if os.path.exists(filename):
        print(f"Note: '{filename}' already exists. Overwriting with new data...")
    
    # CSV headers matching the app's export format (including food and exercise)
    headers = [
        'Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain',
        'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling',
        'Flare', 'Mood', 'Irritability', 'Weather Sensitivity', 'Steps', 'Hydration',
        'Energy Clarity', 'Stressors', 'Symptoms', 'Pain Location', 'Food', 'Exercise', 'Notes'
    ]
    
    # Write CSV manually to match app's exact format (no CSV module quirks)
    # 'w' mode automatically overwrites existing files
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        # Write header exactly as app exports it
        csvfile.write(','.join(headers) + '\n')
        # Write data rows
        for entry in entries:
            # Helper function to escape CSV values
            def escape_csv_value(value):
                if value is None or value == '':
                    return ''
                value_str = str(value)
                # If contains comma, quote, or newline, wrap in quotes and escape quotes
                if ',' in value_str or '"' in value_str or '\n' in value_str:
                    return '"' + value_str.replace('"', '""') + '"'
                return value_str
            
            row = [
                escape_csv_value(entry['Date']),
                escape_csv_value(entry['BPM']),
                escape_csv_value(entry['Weight']),
                escape_csv_value(entry['Fatigue']),
                escape_csv_value(entry['Stiffness']),
                escape_csv_value(entry['Back Pain']),
                escape_csv_value(entry['Sleep']),
                escape_csv_value(entry['Joint Pain']),
                escape_csv_value(entry['Mobility']),
                escape_csv_value(entry['Daily Function']),
                escape_csv_value(entry['Swelling']),
                escape_csv_value(entry['Flare']),
                escape_csv_value(entry['Mood']),
                escape_csv_value(entry['Irritability']),
                escape_csv_value(entry.get('Weather Sensitivity', '')),
                escape_csv_value(entry.get('Steps', '')),
                escape_csv_value(entry.get('Hydration', '')),
                escape_csv_value(entry.get('Energy Clarity', '')),
                escape_csv_value(entry.get('Stressors', '')),
                escape_csv_value(entry.get('Symptoms', '')),
                escape_csv_value(entry.get('Pain Location', '')),
                escape_csv_value(entry.get('Food', '')),
                escape_csv_value(entry.get('Exercise', '')),
                escape_csv_value(entry.get('Notes', ''))
            ]
            csvfile.write(','.join(row) + '\n')
    
    print(f"Generated {len(entries)} entries and saved to '{filename}'")
    print(f"File location: {os.path.abspath(filename)}")

def main():
    """Main function to generate sample data."""
    print("=" * 60)
    print("Health App - Sample Data Generator")
    print("=" * 60)
    print()
    
    # Prompt for number of days (supports up to 10 years = ~3,650 days)
    max_days = 3650  # 10 years
    while True:
        try:
            days_input = input(f"Enter number of days to generate (1-{max_days}, default: 90): ").strip()
            if days_input == "":
                num_days = 90
                break
            num_days = int(days_input)
            if num_days <= 0:
                print("Please enter a positive number.")
                continue
            if num_days > max_days:
                print(f"Maximum supported: {max_days} days (10 years). Please enter a smaller number.")
                continue
            if num_days > 1000:
                years = num_days / 365.25
                print(f"Generating {num_days} days (~{years:.1f} years) of data. This may take a moment...")
            break
        except ValueError:
            print("Please enter a valid number.")
    
    # Configuration
    base_weight = 75.0  # Starting weight in kg
    
    print()
    if num_days <= 1000:
        print(f"Generating {num_days} days of randomized health data...")
    else:
        years = num_days / 365.25
        print(f"Generating {num_days} days (~{years:.1f} years) of randomized health data...")
        print("This may take a moment for large datasets...")
    print(f"Base weight: {base_weight} kg")
    print()
    
    # Generate data (supports up to 10 years / 3650 days)
    entries = generate_sample_data(
        num_days=num_days,
        base_weight=base_weight
    )
    
    # Save to CSV
    filename = 'health_data_sample.csv'
    save_to_csv(entries, filename)
    
    print()
    print("=" * 60)
    print("Sample Data Summary:")
    print("=" * 60)
    print(f"  - Total entries: {len(entries)}")
    print(f"  - Date range: {entries[0]['Date']} to {entries[-1]['Date']}")
    
    # Count flares
    flares = sum(1 for e in entries if e['Flare'] == 'Yes')
    print(f"  - Flare-up days: {flares} ({flares/len(entries)*100:.1f}%)")
    
    # Average metrics
    avg_bpm = sum(int(e['BPM']) for e in entries) / len(entries)
    avg_weight = sum(float(e['Weight']) for e in entries) / len(entries)
    avg_fatigue = sum(int(e['Fatigue']) for e in entries) / len(entries)
    avg_sleep = sum(int(e['Sleep']) for e in entries) / len(entries)
    
    print(f"  - Average BPM: {avg_bpm:.0f}")
    print(f"  - Average Weight: {avg_weight:.1f} kg")
    print(f"  - Average Fatigue: {avg_fatigue:.1f}/10")
    print(f"  - Average Sleep: {avg_sleep:.1f}/10")
    print()
    print("To import this data:")
    print("  1. Open your Health App")
    print("  2. Go to 'View Logs' tab")
    print("  3. Click 'Import Data'")
    print(f"  4. Select '{filename}'")
    print()
    print("=" * 60)

if __name__ == '__main__':
    main()
