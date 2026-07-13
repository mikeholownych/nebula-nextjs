#!/usr/bin/env python3
"""
Pilot Client Score Calculator

Calculates weighted scores for potential pilot clients based on evaluation criteria.
"""

import json
import sys
from pathlib import Path

def load_client_data(file_path='client_data.json'):
    """Load client data from JSON file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {file_path} not found")
        sys.exit(1)

def calculate_client_score(client):
    """
    Calculate weighted score for a client based on evaluation criteria
    
    Scoring weights:
    - Current Relationship: 30%
    - Problem Complexity: 25% 
    - Budget Availability: 20%
    - Strategic Fit: 15%
    - Implementation Readiness: 10%
    """
    # Default scores - in a real implementation, these would be based on actual data
    scores = {
        'current_relationship': 8,  # 1-10 scale
        'problem_complexity': 9,   # 1-10 scale  
        'budget_availability': 7,  # 1-10 scale
        'strategic_fit': 8,        # 1-10 scale
        'implementation_readiness': 7  # 1-10 scale
    }
    
    # Calculate weighted score
    weighted_score = (
        scores['current_relationship'] * 0.30 +
        scores['problem_complexity'] * 0.25 +
        scores['budget_availability'] * 0.20 +
        scores['strategic_fit'] * 0.15 +
        scores['implementation_readiness'] * 0.10
    )
    
    return round(weighted_score, 2), scores

def generate_score_matrix(clients):
    """Generate score matrix for all clients"""
    results = []
    
    for client in clients:
        total_score, component_scores = calculate_client_score(client)
        results.append({
            'name': client['name'],
            'industry': client['industry'],
            'spend': client['spend'],
            'conversions': client['conversions'],
            'total_score': total_score,
            **component_scores
        })
    
    return results

def save_score_matrix(results, output_file='pilot_client_scores.json'):
    """Save score matrix to JSON file"""
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Score matrix saved to {output_file}")
    return results

def print_score_matrix(results):
    """Print formatted score matrix"""
    print("\n=== Pilot Client Score Matrix ===")
    print("| Client         | Industry        | Spend   | Conversions | Total Score | CR | PC | BA | SF | IR |")
    print("|-----------------|-----------------|---------|-------------|-------------|----|----|----|----|----|")
    
    for result in results:
        print(f"| {result['name']:<17} | {result['industry']:<15} | ${result['spend']:>7} | {result['conversions']:>11} | {result['total_score']:>11.2f} | "
              f"{result['current_relationship']:^3} | {result['problem_complexity']:^3} | {result['budget_availability']:^3} | "
              f"{result['strategic_fit']:^3} | {result['implementation_readiness']:^3} |")

def main():
    """Main function"""
    # Load client data
    clients = load_client_data()
    
    # Generate score matrix
    results = generate_score_matrix(clients)
    
    # Save results
    results = save_score_matrix(results)
    
    # Print results
    print_score_matrix(results)
    
    # Identify top candidates
    sorted_results = sorted(results, key=lambda x: x['total_score'], reverse=True)
    
    print("\n=== Top 5 Candidate Clients ===")
    for i, result in enumerate(sorted_results[:5], 1):
        print(f"{i}. {result['name']} ({result['industry']}) - Total Score: {result['total_score']:.2f}")

if __name__ == "__main__":
    main()