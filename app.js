import { ThreatGraph, ThreatEntity, ThreatRelationship, ENTITY_TYPES, RELATIONSHIP_TYPES } from './threat-intel.js';
import { GraphEngine } from './graph-engine.js';
import { ThreatGraphStorage } from './storage.js';
import { generateSampleData } from './sample-data.js';
import { EnrichmentEngine } from './enrichment.js';

/**
 * Main Application Controller
 */
class ThreatIntelApp {
    constructor() {
        this.threatGraph = new ThreatGraph();
        this.storage = new ThreatGraphStorage();
        this.enrichmentEngine = new EnrichmentEngine();
        this.graphEngine = null;
        
        this.init();
    }

    async init() {
        // Initialize storage
        await this.storage.init();

        // Initialize graph engine
        const container = document.getElementById('cy');
        this.graphEngine = new GraphEngine(container, this.threatGraph);

        // Try to load saved data
        await this.loadSavedData();

        // Setup UI event handlers
        this.setupEventHandlers();

        // Initial stats update
        this.updateStats();
    }

    async loadSavedData() {
        try {
            const data = await this.storage.loadGraph();
            if (data.entities.length > 0 || data.relationships.length > 0) {
                // Clear existing graph and reload data
                this.threatGraph.clear();
                
                // Add all entities
                data.entities.forEach(entityData => {
                    const entity = ThreatEntity.fromJSON(entityData);
                    this.threatGraph.addEntity(entity);
                });
                
                // Add all relationships
                data.relationships.forEach(relData => {
                    try {
                        const rel = ThreatRelationship.fromJSON(relData);
                        this.threatGraph.addRelationship(rel);
                    } catch (error) {
                        console.warn('Skipping invalid relationship:', error.message);
                    }
                });
                
                this.graphEngine.loadFromThreatGraph();
                console.log('Loaded saved graph data:', data.entities.length, 'entities,', data.relationships.length, 'relationships');
            }
        } catch (error) {
            console.warn('No saved data to load:', error);
        }
    }

    setupEventHandlers() {
        // Add Entity Form
        document.getElementById('addEntityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddEntity();
        });

        // Add Relationship Form
        document.getElementById('addRelationshipForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddRelationship();
        });

        // Load Sample Data
        document.getElementById('loadSampleData').addEventListener('click', () => {
            this.loadSampleData();
        });

        // Clear Graph
        document.getElementById('clearGraph').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire graph?')) {
                this.clearGraph();
            }
        });

        // Export Data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Import Data
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Layout Controls
        document.getElementById('applyLayout').addEventListener('click', () => {
            const layoutType = document.getElementById('layoutType').value;
            this.graphEngine.applyLayout(layoutType, true);
        });

        // Graph Controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.graphEngine.zoomIn();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.graphEngine.zoomOut();
        });

        document.getElementById('fitGraph').addEventListener('click', () => {
            this.graphEngine.fit();
        });

        // Node Actions
        document.getElementById('expandNode').addEventListener('click', () => {
            const selected = this.graphEngine.getSelectedElement();
            if (selected && selected.isNode()) {
                this.graphEngine.expandNode(selected);
            }
        });

        document.getElementById('hideNode').addEventListener('click', () => {
            const selected = this.graphEngine.getSelectedElement();
            if (selected && selected.isNode()) {
                selected.style('display', 'none');
            }
        });

        document.getElementById('deleteNode').addEventListener('click', () => {
            this.handleDeleteNode();
        });

        // Enrichment
        document.getElementById('enrichNode').addEventListener('click', () => {
            this.handleEnrichNode();
        });

        // Settings Modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('clearApiKeys').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all API keys?')) {
                this.clearApiKeys();
            }
        });

        // Close modal on background click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });

        // Selection listener
        this.graphEngine.cy.on('select unselect', () => {
            this.updateSelectionInfo();
            this.updateStats();
        });

        // Selection info update
        this.graphEngine.cy.on('tap', () => {
            this.updateSelectionInfo();
        });
    }

    handleAddEntity() {
        const type = document.getElementById('entityType').value;
        const value = document.getElementById('entityValue').value.trim();
        const description = document.getElementById('entityDescription').value.trim();
        const statusDiv = document.getElementById('addEntityStatus');

        if (!value) {
            alert('Please enter a value for the entity');
            return;
        }

        console.log('Creating entity:', type, value);
        statusDiv.textContent = 'Creating entity...';
        statusDiv.style.color = '#3498db';

        const entity = new ThreatEntity(null, type, value, {
            description: description || `${ENTITY_TYPES[type].label}: ${value}`
        });

        console.log('Entity created:', entity);
        statusDiv.textContent = 'Entity created, adding to graph...';

        // Add to threat graph model
        this.threatGraph.addEntity(entity);
        console.log('Entity added to graph model. Total entities:', this.threatGraph.entities.size);
        statusDiv.textContent = `Added to model (${this.threatGraph.entities.size} total)`;
        
        // Add to visualization
        this.graphEngine.addNode(entity);
        console.log('Entity added to visualization');
        statusDiv.textContent = 'Added to visualization!';
        statusDiv.style.color = '#2ecc71';
        
        // Save to storage
        this.storage.saveEntity(entity).catch(err => {
            console.error('Failed to save entity:', err);
        });

        // Update dropdowns
        this.updateNodeDropdowns();

        // Update stats
        this.updateStats();

        // Clear form
        document.getElementById('entityValue').value = '';
        document.getElementById('entityDescription').value = '';

        console.log('✅ Successfully added entity:', entity.value);
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    }

    handleAddRelationship() {
        const sourceId = document.getElementById('sourceNode').value;
        const targetId = document.getElementById('targetNode').value;
        const type = document.getElementById('relationshipType').value;

        if (!sourceId || !targetId) {
            alert('Please select both source and target entities');
            return;
        }

        if (sourceId === targetId) {
            alert('Source and target must be different entities');
            return;
        }

        try {
            const relationship = new ThreatRelationship(null, sourceId, targetId, type);
            this.threatGraph.addRelationship(relationship);
            this.graphEngine.addEdge(relationship);
            
            // Save to storage
            this.storage.saveRelationship(relationship);

            // Update stats
            this.updateStats();

            console.log('Added relationship:', relationship);
        } catch (error) {
            alert(`Error adding relationship: ${error.message}`);
        }
    }

    async handleDeleteNode() {
        const selected = this.graphEngine.getSelectedElement();
        if (!selected || !selected.isNode()) {
            alert('Please select a node to delete');
            return;
        }

        const nodeId = selected.data('id');
        
        if (confirm(`Are you sure you want to delete this node and all its connections?`)) {
            // Remove from graph
            this.threatGraph.removeEntity(nodeId);
            this.graphEngine.removeNode(nodeId);
            
            // Remove from storage
            await this.storage.deleteEntity(nodeId);

            // Update UI
            this.updateNodeDropdowns();
            this.updateStats();
            this.updateSelectionInfo();
        }
    }

    loadSampleData() {
        const { entities, relationships } = generateSampleData();

        // Clear existing data
        this.threatGraph.clear();
        this.graphEngine.clear();

        // Add entities
        entities.forEach(entity => {
            this.threatGraph.addEntity(entity);
        });

        // Add relationships
        relationships.forEach(rel => {
            try {
                this.threatGraph.addRelationship(rel);
            } catch (error) {
                console.warn('Skipping invalid relationship:', error.message);
            }
        });

        // Load into visualization
        this.graphEngine.loadFromThreatGraph();

        // Save to storage
        this.storage.saveGraph(this.threatGraph);

        // Update UI
        this.updateNodeDropdowns();
        this.updateStats();

        console.log('Loaded sample data:', entities.length, 'entities,', relationships.length, 'relationships');
    }

    async clearGraph() {
        this.threatGraph.clear();
        this.graphEngine.clear();
        await this.storage.clearAll();
        
        this.updateNodeDropdowns();
        this.updateStats();
        this.updateSelectionInfo();

        console.log('Graph cleared');
    }

    async exportData() {
        try {
            const jsonData = await this.storage.exportToJSON();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `threat-intel-graph-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Exported graph data');
        } catch (error) {
            alert(`Export failed: ${error.message}`);
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            await this.storage.importFromJSON(text);
            
            // Reload the graph
            await this.loadSavedData();
            
            this.updateNodeDropdowns();
            this.updateStats();

            alert('Data imported successfully');
            console.log('Imported graph data from file');
        } catch (error) {
            alert(`Import failed: ${error.message}`);
        }
    }

    updateNodeDropdowns() {
        const sourceSelect = document.getElementById('sourceNode');
        const targetSelect = document.getElementById('targetNode');

        // Clear existing options except first
        sourceSelect.innerHTML = '<option value="">Select source...</option>';
        targetSelect.innerHTML = '<option value="">Select target...</option>';

        // Add options for each entity
        for (const entity of this.threatGraph.entities.values()) {
            const option = document.createElement('option');
            option.value = entity.id;
            option.textContent = `${ENTITY_TYPES[entity.type].label}: ${entity.value}`;
            
            sourceSelect.appendChild(option);
            targetSelect.appendChild(option.cloneNode(true));
        }
    }

    updateStats() {
        const stats = this.graphEngine.getStats();
        
        document.getElementById('nodeCount').textContent = stats.nodes;
        document.getElementById('edgeCount').textContent = stats.edges;
        document.getElementById('selectedCount').textContent = stats.selected;
    }

    updateSelectionInfo() {
        const selected = this.graphEngine.getSelectedElement();
        const infoDiv = document.getElementById('selectionInfo');
        const actionsDiv = document.getElementById('nodeActions');

        if (!selected) {
            infoDiv.innerHTML = '<p class="help-text">Click on a node or edge to view details</p>';
            actionsDiv.style.display = 'none';
            return;
        }

        if (selected.isNode()) {
            const data = selected.data();
            const entity = this.threatGraph.getEntity(data.id);
            
            if (entity) {
                const typeInfo = ENTITY_TYPES[entity.type];
                let html = `
                    <div class="info-row">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${typeInfo.label} ${typeInfo.icon}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Value:</span>
                        <span class="info-value">${entity.value}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span class="info-value">${entity.metadata.description || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Confidence:</span>
                        <span class="info-value">${entity.metadata.confidence || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">First Seen:</span>
                        <span class="info-value">${new Date(entity.metadata.firstSeen).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Connections:</span>
                        <span class="info-value">${this.threatGraph.getConnectedEntities(entity.id).length}</span>
                    </div>
                `;

                // Add enrichment data if available
                if (entity.metadata.enriched && entity.metadata.enrichment) {
                    const enrichment = entity.metadata.enrichment;
                    html += `
                        <div class="info-row" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            <span class="info-label">🔍 Enrichment Status:</span>
                            <span class="info-value" style="color: #2ecc71;">✓ Enriched</span>
                        </div>
                    `;

                    if (enrichment.sources && enrichment.sources.length > 0) {
                        html += `
                            <div class="info-row">
                                <span class="info-label">Sources:</span>
                                <span class="info-value">${enrichment.sources.join(', ')}</span>
                            </div>
                        `;
                    }

                    // Display type-specific enrichment data
                    if (enrichment.data) {
                        if (enrichment.data.geolocation) {
                            const geo = enrichment.data.geolocation;
                            html += `
                                <div class="info-row">
                                    <span class="info-label">Location:</span>
                                    <span class="info-value">${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">ISP:</span>
                                    <span class="info-value">${geo.isp || 'Unknown'}</span>
                                </div>
                            `;
                        }

                        if (enrichment.data.abuse) {
                            html += `
                                <div class="info-row">
                                    <span class="info-label">Abuse Score:</span>
                                    <span class="info-value">${enrichment.data.abuse.abuseScore}%</span>
                                </div>
                            `;
                        }

                        if (enrichment.data.virustotal) {
                            const vt = enrichment.data.virustotal;
                            html += `
                                <div class="info-row">
                                    <span class="info-label">VT Detections:</span>
                                    <span class="info-value" style="color: ${vt.malicious > 0 ? '#e74c3c' : '#2ecc71'}">
                                        ${vt.malicious} malicious / ${vt.suspicious} suspicious
                                    </span>
                                </div>
                            `;
                        }
                    }

                    html += `
                        <div class="info-row">
                            <span class="info-label">Last Enriched:</span>
                            <span class="info-value">${new Date(enrichment.timestamp).toLocaleString()}</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="info-row" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            <span class="info-label">🔍 Enrichment:</span>
                            <span class="info-value" style="color: #95a5a6;">Not enriched</span>
                        </div>
                    `;
                }

                infoDiv.innerHTML = html;
            }
            actionsDiv.style.display = 'flex';
        } else if (selected.isEdge()) {
            const data = selected.data();
            const relationship = this.threatGraph.getRelationship(data.id);
            
            if (relationship) {
                const source = this.threatGraph.getEntity(relationship.source);
                const target = this.threatGraph.getEntity(relationship.target);
                const relTypeInfo = RELATIONSHIP_TYPES[relationship.type];
                
                infoDiv.innerHTML = `
                    <div class="info-row">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${relTypeInfo.label}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Source:</span>
                        <span class="info-value">${source?.value || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Target:</span>
                        <span class="info-value">${target?.value || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Confidence:</span>
                        <span class="info-value">${relationship.metadata.confidence || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">First Seen:</span>
                        <span class="info-value">${new Date(relationship.metadata.firstSeen).toLocaleDateString()}</span>
                    </div>
                `;
            }
            actionsDiv.style.display = 'none';
        }
    }

    // Enrichment Methods
    async handleEnrichNode() {
        const selected = this.graphEngine.getSelectedElement();
        if (!selected || !selected.isNode()) {
            alert('Please select a node to enrich');
            return;
        }

        const nodeId = selected.data('id');
        const entity = this.threatGraph.getEntity(nodeId);
        
        if (!entity) {
            alert('Entity not found');
            return;
        }

        const statusDiv = document.getElementById('enrichmentStatus');
        statusDiv.textContent = `Enriching ${entity.value}...`;
        statusDiv.className = 'loading';
        statusDiv.style.display = 'block';

        console.log('Enriching entity:', entity);

        try {
            const enrichmentData = await this.enrichmentEngine.enrichEntity(entity);
            
            console.log('Enrichment completed:', enrichmentData);

            // Update entity metadata with enrichment data
            entity.metadata.enrichment = enrichmentData;
            entity.metadata.enriched = true;
            entity.metadata.enrichmentTimestamp = enrichmentData.timestamp;

            // Save updated entity
            await this.storage.saveEntity(entity);

            // Update the cytoscape node data
            selected.data('metadata', entity.metadata);

            // Update display
            this.updateSelectionInfo();

            // Show success
            const sourcesText = enrichmentData.sources?.length > 0 
                ? enrichmentData.sources.join(', ') 
                : 'No sources';
            statusDiv.textContent = `✓ Enriched from: ${sourcesText}`;
            statusDiv.className = 'success';

            // Add visual indicator to node
            selected.addClass('enriched');

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);

        } catch (error) {
            console.error('Enrichment error:', error);
            statusDiv.textContent = `✗ Enrichment failed: ${error.message}`;
            statusDiv.className = 'error';

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Settings Methods
    openSettings() {
        const modal = document.getElementById('settingsModal');
        
        // Load current API keys
        const keys = this.enrichmentEngine.apiKeys;
        document.getElementById('apiKeyVT').value = keys.virustotal || '';
        document.getElementById('apiKeyAbuseIPDB').value = keys.abuseipdb || '';
        document.getElementById('apiKeyShodan').value = keys.shodan || '';
        document.getElementById('apiKeyURLScan').value = keys.urlscan || '';

        modal.style.display = 'flex';
    }

    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    saveSettings() {
        const keys = {
            virustotal: document.getElementById('apiKeyVT').value.trim(),
            abuseipdb: document.getElementById('apiKeyAbuseIPDB').value.trim(),
            shodan: document.getElementById('apiKeyShodan').value.trim(),
            urlscan: document.getElementById('apiKeyURLScan').value.trim()
        };

        this.enrichmentEngine.saveApiKeys(keys);
        
        alert('Settings saved successfully!');
        this.closeSettings();
        
        console.log('API keys saved (keys hidden for security)');
    }

    clearApiKeys() {
        this.enrichmentEngine.saveApiKeys({
            virustotal: '',
            abuseipdb: '',
            shodan: '',
            urlscan: ''
        });

        document.getElementById('apiKeyVT').value = '';
        document.getElementById('apiKeyAbuseIPDB').value = '';
        document.getElementById('apiKeyShodan').value = '';
        document.getElementById('apiKeyURLScan').value = '';

        alert('All API keys cleared');
        console.log('API keys cleared');
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThreatIntelApp();
    });
} else {
    new ThreatIntelApp();
}
