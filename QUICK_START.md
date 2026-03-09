# Quick Start Guide

## Open the Application

### Option 1: Direct Browser Open (Simplest)
```bash
open index.html
```
Just double-click `index.html` in your file browser.

⚠️ **Note:** Some browsers may restrict IndexedDB when opening files directly. If you encounter issues, use Option 2.

### Option 2: Local Web Server (Recommended)

**Using the provided script:**
```bash
./start.sh
```

**Or manually:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Then open: http://localhost:8000

## First Steps

1. **Load Sample Data**
   - Click "Load Sample Threat Intel" button
   - Explore the pre-loaded APT campaign

2. **Interact with the Graph**
   - Click nodes/edges to view details
   - Double-click nodes to expand connections
   - Drag nodes to reposition
   - Scroll to zoom in/out

3. **Add Your Own Data**
   - Use the left sidebar to add entities
   - Create relationships between entities
   - Data is automatically saved in your browser

4. **Export Your Work**
   - Click "Export Data" to save as JSON
   - Import data back later with "Import Data"

## Tips

- **Node Colors** = Entity types (see legend)
- **Edge Colors** = Relationship types
- **Selection** = Click node/edge to highlight connections
- **Layouts** = Change visualization layouts in the sidebar

## Troubleshooting

**Graph not loading?**
- Make sure you're using a modern browser
- Try using a local web server instead of opening the file directly

**Data not saving?**
- Check browser's IndexedDB is enabled
- Make sure you're not in private/incognito mode

**Performance issues?**
- Limit graph size to < 1000 nodes
- Use simpler layouts (circle/grid) for large graphs

## Need Help?

See the full README.md for complete documentation.
