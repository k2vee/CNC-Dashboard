import sqlite3
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Path to your SQLite database file
database_file = r"C:\\Users\\lauju\\OneDrive - Singapore Polytechnic\\intern\\motor_data\\5min run loop.dxpdb"


def fetch_node_key_to_node_id_mapping():
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()
    cursor.execute('SELECT NodeKey, NodeId FROM NodeIdKey')
    rows = cursor.fetchall()
    conn.close()

    # Create a dictionary mapping NodeKey to NodeId
    node_key_mapping = dict(rows)
    return node_key_mapping


# Function to fetch data based on group
def fetch_data_by_group(group):
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()

    # Fetch NodeKey-to-NodeId mapping
    node_key_mapping = fetch_node_key_to_node_id_mapping()

    query = 'SELECT * FROM HistoricalData'
    if group != 'All':
        group_node_keys = generate_group_node_keys(
            node_key_mapping).get(group, [])
        if group_node_keys:
            # Enclose each node key in single quotes
            node_keys_str = ', '.join(map(lambda x: f"'{x}'", group_node_keys))
            query += f" WHERE NodeKey IN ({node_keys_str})"

    cursor.execute(query)
    rows = cursor.fetchall()

    # Map NodeKey to NodeId
    data = []
    for row in rows:
        node_key = row[0]
        node_id = node_key_mapping.get(node_key)
        if node_id:
            data.append({
                'NodeKey': node_key,
                'NodeId': node_id,
                'Value': row[1],
                'Datatype': row[2],
                'Size': row[3],
                'Quality': row[4],
                'SourceTimeStamp': row[5],
                'ServerTimeStamp': row[6]
            })

    conn.close()
    return data


# Function to generate group node keys based on NodeId mapping
def generate_group_node_keys(node_key_mapping):
    group_node_keys = {}
    for node_key, node_id in node_key_mapping.items():
        group = get_group_from_node_id(node_id)
        group_node_keys.setdefault(group, []).append(node_key)
    return group_node_keys


def get_group_from_node_id(node_id):
    if 'Current' in node_id:
        return 'Current'
    elif 'CYCCNT' in node_id:
        return 'CYCCNT'
    elif 'MAXCUR' in node_id:
        return 'MAXCUR'
    elif 'MACPOS' in node_id:
        return 'MACPOS'
    elif 'MATPOS' in node_id:
        return 'MATPOS'
    elif 'SCAPOS' in node_id:
        return 'SCAPOS'
    elif 'RemainCommand' in node_id:
        return 'RemainCommand'
    elif 'CurrentPosition' in node_id:
        return 'CurrentPosition'
    elif 'Gain' in node_id:
        return 'Gain'
    elif 'Droop' in node_id:
        return 'Droop'
    elif 'LEDDisplay' in node_id:
        return 'LEDDisplay'
    elif 'ControlInput' in node_id:
        return 'ControlInput'
    elif 'ControlOutput' in node_id:
        return 'ControlOutput'
    elif 'Speed' in node_id:
        return 'Speed'
    elif 'CycleCount' in node_id:
        return 'CycleCount'
    elif 'Load' in node_id:
        return 'Load'
    # Add more conditions as needed or handle the default case

    # If none of the conditions match, return a default value or raise an exception
    return 'UnknownGroup'


def fetch_field_groups():
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT NodeId FROM NodeIdKey')
    rows = cursor.fetchall()
    conn.close()

    # Create a dictionary to store group names and associated NodeId values
    field_groups = {}

    for row in rows:
        if row[0] is not None:
            node_id = row[0]
            group = get_group_from_node_id(node_id)

            # Append NodeId to the corresponding group in the dictionary
            field_groups.setdefault(group, []).append(node_id)

    return field_groups


@app.route('/')
def index():
    print("Accessed the '/' route.")

    # Fetch values from the updated database
    data = fetch_data_by_group('All')

    # Fetch field groups from the database
    field_groups = fetch_field_groups()

    print("Data fetched. Rendering template.")

    # Render the template with the fetched data and field groups
    return render_template('index2.html', data=data, field_groups=field_groups)


@app.route('/api/data')
def get_group_data():
    print("Accessed the '/api/data' route.")

    # Get group parameter from the query string
    group = request.args.get('group', 'All')

    # Fetch values from the updated database based on the selected group
    data = fetch_data_by_group(group)

    # Fetch field groups from the database
    field_groups = fetch_field_groups()

    print("Data fetched. Converting to JSON.")

    # Return JSON response with both data and field_groups
    return jsonify(data=data, field_groups=field_groups)


if __name__ == "__main__":
    app.run(debug=True, port=5500)