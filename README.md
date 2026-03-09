# Cyber Threat Intelligence Graph

A fully browser-based threat intelligence investigation tool with interactive graph visualization. Analyze and visualize relationships between threat actors, malware, infrastructure, and other indicators of compromise (IOCs).

## Features

### 🎯 Core Capabilities
- **Interactive Graph Visualization** - Built on Cytoscape.js with force-directed layouts
- **Threat Entity Management** - Support for IPs, domains, file hashes, malware, threat actors, vulnerabilities, campaigns, and tools
- **Relationship Mapping** - Visualize connections between entities with typed relationships
- **Local Persistence** - All data stored in browser IndexedDB (no server required)
- **Import/Export** - Save and share investigation data as JSON

### 🔍 Investigation Features
- **Entity Details Panel** - View metadata, confidence levels, and timestamps
- **Connected Entity Analysis** - Expand nodes to reveal relationships
- **Selection Highlighting** - Automatically highlight connected nodes and edges
- **Path Finding** - Built-in shortest path algorithm between entities
- **Statistics Dashboard** - Real-time graph metrics

### 🎨 Visualization
- **Multiple Layout Algorithms** - Force-directed, circle, grid, and hierarchical layouts
- **Entity Type Styling** - Color-coded nodes by entity type with unique shapes
- **Relationship Styling** - Edge colors and styles based on relationship type
- **Zoom & Pan Controls** - Smooth navigation of complex graphs
- **Responsive Design** - Dark theme optimized for long investigation sessions

## Getting Started

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or server required
- No dependencies to install

### Quick Start

1. **Open the application**
   ```bash
   # Simply open index.html in your browser
   open index.html
   ```

   Or use a local web server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

2. **Load sample data**
   - Click "Load Sample Threat Intel" to see an example APT campaign

3. **Start investigating**
   - Click nodes and edges to view details
   - Add new entities and relationships
   - Use layout controls to organize the graph

## Usage Guide

### Adding Entities

1. Select entity type (IP, Domain, Hash, etc.)
2. Enter the value (e.g., IP address, domain name)
3. Optionally add a description
4. Click "Add Entity"

**Supported Entity Types:**
- 🌐 **IP Address** - Network infrastructure
- 🔗 **Domain** - Domain names and hostnames
- # **File Hash** - SHA256/MD5 hashes
- 🦠 **Malware** - Malware families and variants
- 👤 **Threat Actor** - APT groups and attackers
- ⚠️ **Vulnerability** - CVEs and security weaknesses
- 🎯 **Campaign** - Attack campaigns
- 🔧 **Tool** - Attack tools and utilities

### Creating Relationships

1. Select source entity from dropdown
2. Choose relationship type
3. Select target entity
4. Click "Add Relationship"

**Relationship Types:**
- **Communicates With** - Network communication
- **Resolves To** - DNS resolution
- **Downloads** - File downloads
- **Uses** - Tool/malware usage
- **Exploits** - Vulnerability exploitation
- **Attributed To** - Actor attribution
- **Targets** - Campaign/attack targets
- **Delivers** - Payload delivery
- **Drops** - File dropping behavior
- **Indicates** - Indicator relationships

### Investigation Techniques

**Expand Connected Entities**
- Double-click a node to expand its connections
- Use the "Expand Connections" button

**Find Shortest Path**
- The graph model includes path-finding capabilities
- Useful for understanding attack chains

**Filter by Entity Type**
- Nodes are color-coded by type
- Reference the legend in the info panel

**Export Investigation**
- Export graph as JSON for sharing
- Import previously saved investigations

## Architecture

### File Structure
```
threat-intel-graph/
├── index.html           # Main HTML application
├── styles.css          # Application styling
├── app.js              # Main application controller
├── threat-intel.js     # Data models and graph logic
├── graph-engine.js     # Cytoscape visualization engine
├── storage.js          # IndexedDB persistence layer
└── sample-data.js      # Sample APT campaign data
```

### Technology Stack
- **Cytoscape.js** - Graph visualization and layout
- **IndexedDB** - Client-side data persistence
- **ES6 Modules** - Modern JavaScript architecture
- **Vanilla JavaScript** - No framework dependencies

### Data Model

**ThreatEntity**
```javascript
{
  id: string,
  type: string,
  value: string,
  metadata: {
    description: string,
    tags: string[],
    confidence: 'low' | 'medium' | 'high',
    firstSeen: timestamp,
    lastSeen: timestamp
  }
}
```

**ThreatRelationship**
```javascript
{
  id: string,
  source: entityId,
  target: entityId,
  type: string,
  metadata: {
    confidence: 'low' | 'medium' | 'high',
    firstSeen: timestamp,
    lastSeen: timestamp,
    bidirectional: boolean
  }
}
```

## Sample Data

The application includes a sample APT campaign with:
- APT-38 (Lazarus Group) threat actor
- Operation Troy campaign
- Banking trojans and RATs
- Command & control infrastructure
- Phishing domains
- Exploited vulnerabilities
- File hashes and IOCs

## Privacy & Security

- **100% Client-Side** - All processing happens in your browser
- **No External Servers** - No data transmitted to external services
- **Local Storage Only** - Data stored in browser IndexedDB
- **No Analytics** - No tracking or telemetry
- **Offline Capable** - Works without internet connection

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Keyboard Shortcuts

- **Ctrl/Cmd + Click** - Multi-select nodes
- **Mouse Wheel** - Zoom in/out
- **Click + Drag** - Pan canvas
- **Double-Click Node** - Expand connections

## Advanced Features

### Custom Layouts
Switch between layout algorithms:
- **Force-Directed (Cola)** - Follows force simulation
- **Circle** - Circular arrangement
- **Grid** - Grid-based positioning
- **Hierarchical** - Tree-like structure

### Data Export Format
JSON structure for import/export:
```json
{
  "entities": [...],
  "relationships": [...]
}
```

### Analysis Methods
- Entity statistics by type
- Relationship statistics by type
- Connected entity queries
- Shortest path calculation

## Use Cases

1. **Threat Investigation** - Map relationships between IOCs
2. **Campaign Analysis** - Visualize APT campaigns and TTPs
3. **Infrastructure Mapping** - Track attacker infrastructure
4. **Malware Analysis** - Connect malware families and variants
5. **Attribution Research** - Link activities to threat actors
6. **Training & Education** - Teach threat intelligence concepts

## Limitations

- Client-side only (no collaboration features)
- Limited to browser memory/storage capacity
- No automated enrichment or OSINT integration
- No real-time threat feed integration

## Future Enhancements

Potential additions:
- STIX 2.1 import/export
- Timeline visualization
- Attack pattern (MITRE ATT&CK) integration
- PDF report generation
- Graph search and filtering
- Bulk import from CSV
- Graph comparison/diff

## Contributing

This is a standalone browser application. To extend:
1. Modify the entity types in `threat-intel.js`
2. Add relationship types in the same file
3. Customize styling in `styles.css`
4. Extend analysis methods in `ThreatGraph` class

## License

This tool is provided as-is for threat intelligence investigation purposes.

## Credits

- **Cytoscape.js** - Graph visualization library
- **Cola.js** - Force-directed layout algorithm
- Built with modern web standards

---

**Note:** This tool is for defensive security and threat intelligence purposes. Use responsibly and in compliance with applicable laws and regulations.
