import json
import os
from collections import defaultdict

def load_companies(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data.get('companies', {})

def find_duplicates(companies):
    duplicates = defaultdict(list)
    for name, details in companies.items():
        duplicates[name].append(details)
    return {name: details for name, details in duplicates.items() if len(details) > 1}

def print_duplicates(duplicates):
    if duplicates:
        print("Duplicate companies found:")
        for name, details in duplicates.items():
            print(f"  {name}:")
            for detail in details:
                locations = [loc for loc in detail.get('locations', [])]
                print(f"    - Locations: {locations}")
    else:
        print("No duplicate companies found.")

if __name__ == '__main__':
    json_file_path = os.path.abspath(os.path.join('..', 'static', 'companies.json'))
    companies = load_companies(json_file_path)
    duplicates = find_duplicates(companies)
    print_duplicates(duplicates)