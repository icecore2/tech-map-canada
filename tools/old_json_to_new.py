import json
import os.path

OLD_FILENAME = 'companies-legacy.json'
NEW_FILENAME = 'companies.json'

filename_path = os.path.join('..', 'static', OLD_FILENAME)

with open(filename_path, 'r') as f:
    old_data = json.load(f)

new_data = {"companies": {}}

for company in old_data['companies']:
    company_name = company["name"]
    location_string = company["location"]
    coordinates = company["coordinates"]
    website = company["website"]
    linkedin = company["linkedIn"]
    work_fields = company["workField"]

    new_company_entry = {
        "description": "",
        "locations": [{"{}".format(location_string): coordinates}],
        "links": {"website": website, "linkedin": linkedin},
        "workFields": work_fields,
    }

    new_data["companies"][company_name] = new_company_entry

new_filename_path = os.path.join('..', 'static', NEW_FILENAME)

new_json = json.dumps(new_data, indent=4)
with open(new_filename_path, 'w') as f:
    json.dump(new_data, f)
