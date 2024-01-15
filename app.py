import sqlite3
from flask import Flask, render_template, jsonify, request, g, Response
from markupsafe import escape

app = Flask(__name__)

# Path to SQLite database file
database_file = r'5min run loop.dxpdb'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(database_file)
    return db

def fetch_by_group_limit(group):
    cursor = get_db().cursor()

    # Fetch NodeKey-to-NodeId mapping
    node_key_mapping = fetch_node_key_to_node_id_mapping()

    query = 'SELECT * FROM HistoricalData'
    if group != 'All':
        # Passes dict of node_key & node_id, swaps them around, smooshes keys with the same id into an associated list inside a dict,
        # then filters to specified 'group' (key), storing values (list of node_keys) as 'group_node_keys' 
        group_node_keys = generate_group_node_keys(
            node_key_mapping).get(group, [])
        # C: Validity check/check if empty
        if group_node_keys:
            # Enclose each node key in single quotes
            node_keys_str = ', '.join(map(lambda x: f"'{x}'", group_node_keys))
            query += f" WHERE NodeKey IN ({node_keys_str}) ORDER BY rowid DESC LIMIT 100"

    cursor.execute(query)
    rows = cursor.fetchall()

    # Map NodeKey to NodeId
    data = []
    for row in rows:
        node_key = row[0]
        node_id = node_key_mapping.get(node_key)
        if node_id:
            # Appending a new dictionary for every row
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
    return data    

def fetch_by_singular(id):
    # Put id/substring in a sequence to pass into cursor.execute
    id = '%' + id + '%';
    param = (id,)
    cursor = get_db().cursor()

    # Get the NodeKey for the NodeId that has the substring 'id'
    query = 'SELECT NodeKey FROM NodeIdKey WHERE NodeId LIKE ?'
    cursor.execute(query, param)
    rows = cursor.fetchall()

    # Get the row for which NodeId corresponds to NodeKey
    query = f'SELECT * FROM HistoricalData WHERE NodeKey = ({rows[0][0]}) ORDER BY rowid DESC LIMIT 1'
    cursor.execute(query)
    rows = cursor.fetchall()
    
    node_key_mapping = fetch_node_key_to_node_id_mapping()
    # Map NodeKey to NodeId
    data = []
    for row in rows:
        node_key = row[0]
        node_id = node_key_mapping.get(node_key)
        if node_id:
            # Appending a new dictionary for every row
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
    return data

# Function to fetch data based on group
def fetch_by_group(group):
    cursor = get_db().cursor()

    # Fetch NodeKey-to-NodeId mapping
    node_key_mapping = fetch_node_key_to_node_id_mapping()

    query = 'SELECT * FROM HistoricalData'
    if group != 'All':
        # Passes dict of node_key & node_id, swaps them around, smooshes keys with the same id into an associated list inside a dict,
        # then filters to specified 'group' (key), storing values (list of node_keys) as 'group_node_keys' 
        group_node_keys = generate_group_node_keys(
            node_key_mapping).get(group, [])
        # Validity check/check if empty
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
    return data

def fetch_node_key_to_node_id_mapping():
    cursor = get_db().cursor()
    cursor.execute('SELECT NodeKey, NodeId FROM NodeIdKey')
    rows = cursor.fetchall()

    # Create a dictionary mapping NodeKey to NodeId
    node_key_mapping = dict(rows)
    return node_key_mapping

# Why this one do the same thing as gen-node-keys function but with id instead of keys (edit: for other stuff idk)
def fetch_field_groups():
    cursor = get_db().cursor()
    cursor.execute('SELECT DISTINCT NodeId FROM NodeIdKey')
    rows = cursor.fetchall()

    # Create a dictionary to store group names and associated NodeId values
    field_groups = {}

    for row in rows:
        if row[0] is not None:
            node_id = row[0]
            group = get_group_from_node_id(node_id)

            # Append NodeId to the corresponding group in the dictionary
            field_groups.setdefault(group, []).append(node_id)
    
    return field_groups

# Function to generate group node keys based on NodeId mapping
# Returns a dictionary.
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

# Searches for substring, returns substring.
def get_group_from_node_id(node_id):
    if 'CurrentPosition' in node_id:
        return 'CurrentPosition'
    elif 'Current' in node_id:
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

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# redirects to Table page
@app.route('/')
def redirect():
    return Table()

@app.route('/Table')
def Table(): 
    print("Accessed the '/Table' route.")

    # To resolve: This can be better optimized, don't have to fetch the entire db everytime
    # Fetch values from the updated database
    data = fetch_by_group('All')
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

@app.route('/api/data')
def get_group_data():
    print("Accessed the '/api/data' route.")

    # Get group parameter from the query string
    group = request.args.get('group')
    id = request.args.get('id')

    if group:
        # Fetch values from the updated database based on the selected group
        data = fetch_by_group_limit(group)
    elif id:
        data = fetch_by_singular(id)
    else:
        return Response("No parameters submitted!", status=400)

    print("Data fetched. Converting to JSON.")
    # Return JSON response with both data and field_groups
    return jsonify(data=data)

if __name__ == "__main__":
    app.run(debug=True, port=5500)