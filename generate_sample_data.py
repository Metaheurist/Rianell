#!/usr/bin/env python3
"""
Generate randomized sample health data for Health App import.
Creates a CSV file with realistic health metrics over a specified date range.
"""

import csv
import random
from datetime import datetime, timedelta
import os

def generate_sample_data(num_days=30, start_date=None, base_weight=75.0):
    """
    Generate randomized health data entries.
    
    Args:
        num_days: Number of days of data to generate (default: 30)
        start_date: Start date (default: today - num_days)
        base_weight: Base weight in kg (default: 75.0)
    
    Returns:
        List of dictionaries containing health log entries
    """
    if start_date is None:
        start_date = datetime.now() - timedelta(days=num_days)
    
    entries = []
    
    # Track state for realistic trends
    current_weight = base_weight
    flare_state = False
    flare_duration = 0
    
    for day in range(num_days):
        date = start_date + timedelta(days=day)
        date_str = date.strftime('%Y-%m-%d')
        
        # Simulate flare-ups (flare can last 2-5 days)
        if flare_duration > 0:
            flare_duration -= 1
            if flare_duration == 0:
                flare_state = False
        elif random.random() < 0.15:  # 15% chance of starting a flare
            flare_state = True
            flare_duration = random.randint(2, 5)
        
        # During flare-ups, symptoms are worse
        if flare_state:
            fatigue_base = random.randint(5, 9)
            stiffness_base = random.randint(6, 10)
            back_pain_base = random.randint(6, 10)
            joint_pain_base = random.randint(5, 9)
            sleep_base = random.randint(3, 6)
            mobility_base = random.randint(3, 6)
            daily_function_base = random.randint(3, 7)
            swelling_base = random.randint(4, 8)
            mood_base = random.randint(3, 6)
            irritability_base = random.randint(5, 9)
            flare = "Yes"
        else:
            # Normal day ranges
            fatigue_base = random.randint(2, 6)
            stiffness_base = random.randint(1, 5)
            back_pain_base = random.randint(1, 5)
            joint_pain_base = random.randint(1, 4)
            sleep_base = random.randint(6, 9)
            mobility_base = random.randint(6, 9)
            daily_function_base = random.randint(6, 9)
            swelling_base = random.randint(1, 3)
            mood_base = random.randint(5, 9)
            irritability_base = random.randint(1, 4)
            flare = "No"
        
        # BPM: Resting heart rate (60-90 normal, can be higher during flare)
        if flare_state:
            bpm = random.randint(70, 95)
        else:
            bpm = random.randint(60, 85)
        
        # Weight: Slight variation around base (within ±2kg)
        weight_change = random.uniform(-0.3, 0.3)
        current_weight += weight_change
        weight = round(current_weight, 1)
        
        # Generate notes occasionally
        notes_options = [
            "",
            "Feeling good today",
            "Morning stiffness was manageable",
            "Had a good workout",
            "Rest day",
            "Weather change affecting symptoms",
            "Slept well",
            "Feeling tired",
            "Pain medication helped",
            "Good mobility today",
            "Some joint swelling",
            "Feeling optimistic",
            "Challenging day",
            "Symptoms improving",
            "Need more rest"
        ]
        notes = random.choice(notes_options)
        
        entry = {
            'Date': date_str,
            'BPM': str(bpm),
            'Weight': str(weight),
            'Fatigue': str(fatigue_base),
            'Stiffness': str(stiffness_base),
            'Back Pain': str(back_pain_base),
            'Sleep': str(sleep_base),
            'Joint Pain': str(joint_pain_base),
            'Mobility': str(mobility_base),
            'Daily Function': str(daily_function_base),
            'Swelling': str(swelling_base),
            'Flare': flare,
            'Mood': str(mood_base),
            'Irritability': str(irritability_base),
            'Notes': notes
        }
        
        entries.append(entry)
    
    return entries

def save_to_csv(entries, filename='health_data_sample.csv'):
    """
    Save entries to CSV file in the format expected by the Health App.
    
    Args:
        entries: List of dictionaries containing health log entries
        filename: Output filename (default: 'health_data_sample.csv')
    """
    if not entries:
        print("No entries to save.")
        return
    
    # CSV headers matching the app's export format
    headers = [
        'Date', 'BPM', 'Weight', 'Fatigue', 'Stiffness', 'Back Pain',
        'Sleep', 'Joint Pain', 'Mobility', 'Daily Function', 'Swelling',
        'Flare', 'Mood', 'Irritability', 'Notes'
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=headers)
        writer.writeheader()
        writer.writerows(entries)
    
    print(f"✅ Generated {len(entries)} entries and saved to '{filename}'")
    print(f"📁 File location: {os.path.abspath(filename)}")

def main():
    """Main function to generate sample data."""
    print("=" * 60)
    print("Health App - Sample Data Generator")
    print("=" * 60)
    print()
    
    # Configuration
    num_days = 30  # Generate 30 days of data
    base_weight = 75.0  # Starting weight in kg
    
    print(f"Generating {num_days} days of randomized health data...")
    print(f"Base weight: {base_weight} kg")
    print()
    
    # Generate data
    entries = generate_sample_data(
        num_days=num_days,
        base_weight=base_weight
    )
    
    # Save to CSV
    filename = 'health_data_sample.csv'
    save_to_csv(entries, filename)
    
    print()
    print("=" * 60)
    print("📋 Sample Data Summary:")
    print("=" * 60)
    print(f"  • Total entries: {len(entries)}")
    print(f"  • Date range: {entries[0]['Date']} to {entries[-1]['Date']}")
    
    # Count flares
    flares = sum(1 for e in entries if e['Flare'] == 'Yes')
    print(f"  • Flare-up days: {flares} ({flares/len(entries)*100:.1f}%)")
    
    # Average metrics
    avg_bpm = sum(int(e['BPM']) for e in entries) / len(entries)
    avg_weight = sum(float(e['Weight']) for e in entries) / len(entries)
    avg_fatigue = sum(int(e['Fatigue']) for e in entries) / len(entries)
    avg_sleep = sum(int(e['Sleep']) for e in entries) / len(entries)
    
    print(f"  • Average BPM: {avg_bpm:.0f}")
    print(f"  • Average Weight: {avg_weight:.1f} kg")
    print(f"  • Average Fatigue: {avg_fatigue:.1f}/10")
    print(f"  • Average Sleep: {avg_sleep:.1f}/10")
    print()
    print("💡 To import this data:")
    print("   1. Open your Health App")
    print("   2. Go to 'View Logs' tab")
    print("   3. Click '📥 Import Data'")
    print(f"   4. Select '{filename}'")
    print()
    print("=" * 60)

if __name__ == '__main__':
    main()
