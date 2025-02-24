import json
import os.path
from collections import defaultdict


def validate_no_duplicate_companies(companies):
    companies_by_name = defaultdict(list)

    for company in companies:
        name = company['name']

        # Add company to dictionaries
        companies_by_name[name].append(company)

    # Check for duplicates by name
    duplicates_by_name = {name: companies for name, companies in companies_by_name.items() if len(companies) > 1}

    if duplicates_by_name:
        print("Duplicate companies found:")
        if duplicates_by_name:
            print("\nDuplicates by name:")
            for name, dupes in duplicates_by_name.items():
                print(f"  {name}:")
                for company in dupes:
                    print(f"    - {company['location']}")

    else:
        print("No duplicate companies found.")


if __name__ == '__main__':
    json_file_path = os.path.abspath(os.path.join('..', 'static', 'companies.json'))

    # Load the JSON data
    with open(json_file_path, 'r') as f:
        companies = json.load(f)

    # Run the validation
    validate_no_duplicate_companies(companies['companies'])
