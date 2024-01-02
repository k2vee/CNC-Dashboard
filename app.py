import sqlite3
from flask import Flask, render_template, jsonify, request
from markupsafe import escape

app = Flask(__name__)

# Path to your SQLite database file
database_file = r'5min run loop.dxpdb'

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
    # C:
    # Honestly don't need to connect/close/reconnect so much if you just define a function to do that
    # Pass the query, return the results, do all the file handling outside
    # but this works too, not my style, but it works
    conn = sqlite3.connect(database_file)
    cursor = conn.cursor()

    # Fetch NodeKey-to-NodeId mapping
    node_key_mapping = fetch_node_key_to_node_id_mapping()

    query = 'SELECT * FROM HistoricalData'
    if group != 'All':
        # C: Passes dict of node_key & node_id, swaps them around, smooshes keys with the same id into an associated list inside a dict,
        # C: then filters to specified 'group' (key), storing values (list of node_keys) as 'group_node_keys' 
        group_node_keys = generate_group_node_keys(
            node_key_mapping).get(group, [])
        # C: Validity check/check if empty
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
        # C: why (Edit: oh ok)
        node_id = node_key_mapping.get(node_key)
        if node_id:
            # C: Appending a new dictionary for every row???
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
# C: Returns a dictionary.
def generate_group_node_keys(node_key_mapping):
    group_node_keys = {}
    for node_key, node_id in node_key_mapping.items():
        # C: Passes string, get substring back
        group = get_group_from_node_id(node_id)
        # C: If 'group' exists as a key in dictionary, nothing happens.
        # C: If doesn't exist, add node_key (it's a number) as its value.
        # C: Swaps key and value/id around and smooshes all the node_keys associated with the same id into one list
        # C: For ID-ing which entries in NodeIdKey table correspond to what group/category
        group_node_keys.setdefault(group, []).append(node_key)
    return group_node_keys

# C: Searches for substring, returns substring.
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

# C: Why this one do the same thing as gen-node-keys function but with id instead of keys (edit: for other stuff idk)
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

# redirects to Table page, though im not sure this is the best way to do it
@app.route('/')
def redirect():
    return Table()

@app.route('/Table')
def Table(): 
    print("Accessed the '/Table' route.")

    # To resolve: This can be better optimized, don't have to fetch the entire db everytime
    # Fetch values from the updated database
    data = fetch_data_by_group('All')
    # Fetch field groups from the database
    field_groups = fetch_field_groups()
    print("Data fetched. Rendering template.")

    # Render the template with the fetched data and field groups
    return render_template('Table.html', data=data, field_groups=field_groups)

@app.route('/MotorCurrents')
def MotorCurrents():
    print("Accessed the '/MotorCurrents' route.")
    return render_template('MotorCurrents.html')

@app.route('/CycleCounts')
def CycleCounts():
    print("Accessed the '/CycleCounts' route.")
    return render_template('CycleCounts.html')

@app.route('/api/data/<group>')
def get_group_data(group):
    print("Accessed the '/api/data' route.")

    # Get group parameter from the query string
    # group = request.args.get('group', 'All')

    # Fetch values from the updated database based on the selected group
    data = fetch_data_by_group(escape(group))

    # Fetch field groups from the database
    field_groups = fetch_field_groups()

    print("Data fetched. Converting to JSON.")

    # Return JSON response with both data and field_groups
    return jsonify(data=data, field_groups=field_groups)

if __name__ == "__main__":
    app.run(debug=True, port=5500)