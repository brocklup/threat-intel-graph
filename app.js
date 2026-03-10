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

        // Context menu event handlers
        this.setupContextMenu();

        // Modal handlers
        this.setupModals();
    }

    setupContextMenu() {
        // Context menu item click handlers
        document.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const node = this.graphEngine.getContextNode();
                
                if (node) {
                    this.handleContextMenuAction(action, node);
                }
                
                this.graphEngine.hideContextMenu();
            });
        });

        // Hide context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('#cy')) {
                this.graphEngine.hideContextMenu();
            }
        });
    }

    setupModals() {
        // Create Link Modal
        document.getElementById('closeCreateLink').addEventListener('click', () => {
            document.getElementById('createLinkModal').style.display = 'none';
        });

        document.getElementById('cancelCreateLink').addEventListener('click', () => {
            document.getElementById('createLinkModal').style.display = 'none';
        });

        document.getElementById('confirmCreateLink').addEventListener('click', () => {
            this.handleCreateLinkConfirm();
        });

        // Edit Notes Modal
        document.getElementById('closeEditNotes').addEventListener('click', () => {
            document.getElementById('editNotesModal').style.display = 'none';
        });

        document.getElementById('cancelNotes').addEventListener('click', () => {
            document.getElementById('editNotesModal').style.display = 'none';
        });

        document.getElementById('saveNotes').addEventListener('click', () => {
            this.handleSaveNotes();
        });

        // Close modals on background click
        document.getElementById('createLinkModal').addEventListener('click', (e) => {
            if (e.target.id === 'createLinkModal') {
                document.getElementById('createLinkModal').style.display = 'none';
            }
        });

        document.getElementById('editNotesModal').addEventListener('click', (e) => {
            if (e.target.id === 'editNotesModal') {
                document.getElementById('editNotesModal').style.display = 'none';
            }
        });
    }

    async handleContextMenuAction(action, node) {
        const nodeId = node.data('id');
        const entity = this.threatGraph.getEntity(nodeId);

        if (!entity) return;

        switch (action) {
            case 'enrich-all':
                await this.enrichFromAllSources(entity, node);
                break;
            case 'enrich-virustotal':
                await this.enrichFromSource(entity, node, 'virustotal');
                break;
            case 'enrich-abuseipdb':
                await this.enrichFromSource(entity, node, 'abuseipdb');
                break;
            case 'edit-notes':
                this.showEditNotesModal(entity);
                break;
            case 'create-link':
                this.showCreateLinkModal(entity);
                break;
            case 'expand':
                this.graphEngine.expandNode(node);
                break;
            case 'hide':
                node.style('display', 'none');
                break;
            case 'delete':
                await this.deleteEntityFromContext(nodeId);
                break;
        }
    }

    async enrichFromAllSources(entity, node) {
        const statusDiv = document.getElementById('enrichmentStatus');
        statusDiv.textContent = `Enriching ${entity.value} from all sources...`;
        statusDiv.className = 'loading';
        statusDiv.style.display = 'block';

        try {
            const enrichmentData = await this.enrichmentEngine.enrichEntity(entity);

            entity.metadata.enrichment = enrichmentData;
            entity.metadata.enriched = true;
            entity.metadata.enrichmentTimestamp = enrichmentData.timestamp;

            await this.storage.saveEntity(entity);
            node.data('metadata', entity.metadata);
            this.updateSelectionInfo();

            const sourcesText = enrichmentData.sources?.length > 0 
                ? enrichmentData.sources.join(', ') 
                : 'No sources';
            statusDiv.textContent = `✓ Enriched from: ${sourcesText}`;
            statusDiv.className = 'success';

            node.addClass('enriched');

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

    async enrichFromSource(entity, node, source) {
        const statusDiv = document.getElementById('enrichmentStatus');
        statusDiv.textContent = `Enriching ${entity.value} from ${source}...`;
        statusDiv.className = 'loading';
        statusDiv.style.display = 'block';

        try {
            // Call enrichment for specific source
            const enrichmentData = await this.enrichmentEngine.enrichEntity(entity);

            entity.metadata.enrichment = enrichmentData;
            entity.metadata.enriched = true;
            entity.metadata.enrichmentTimestamp = enrichmentData.timestamp;

            await this.storage.saveEntity(entity);
            node.data('metadata', entity.metadata);
            this.updateSelectionInfo();

            statusDiv.textContent = `✓ Enriched from ${source}`;
            statusDiv.className = 'success';

            node.addClass('enriched');

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);

        } catch (error) {
            console.error('Enrichment error:', error);
            statusDiv.textContent = `✗ ${source} enrichment failed`;
            statusDiv.className = 'error';

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    showEditNotesModal(entity) {
        const modal = document.getElementById('editNotesModal');
        document.getElementById('notesEntityName').textContent = entity.value;
        
        // Load existing notes and tags
        document.getElementById('entityNotes').value = entity.metadata.notes || '';
        document.getElementById('entityTags').value = entity.metadata.tags?.join(', ') || '';
        
        // Store current entity ID for later
        modal.dataset.entityId = entity.id;
        
        modal.style.display = 'flex';
    }

    async handleSaveNotes() {
        const modal = document.getElementById('editNotesModal');
        const entityId = modal.dataset.entityId;
        const entity = this.threatGraph.getEntity(entityId);

        if (!entity) return;

        const notes = document.getElementById('entityNotes').value.trim();
        const tagsInput = document.getElementById('entityTags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        entity.metadata.notes = notes;
        entity.metadata.tags = tags;

        await this.storage.saveEntity(entity);

        // Update the node data
        const node = this.graphEngine.cy.getElementById(entityId);
        if (node.length > 0) {
            node.data('metadata', entity.metadata);
        }

        this.updateSelectionInfo();

        modal.style.display = 'none';
    }

    showCreateLinkModal(entity) {
        const modal = document.getElementById('createLinkModal');
        document.getElementById('linkSourceName').textContent = entity.value;
        
        // Populate target dropdown with all other entities
        const linkTarget = document.getElementById('linkTarget');
        linkTarget.innerHTML = '<option value="">Select target...</option>';
        
        for (const otherEntity of this.threatGraph.entities.values()) {
            if (otherEntity.id !== entity.id) {
                const option = document.createElement('option');
                option.value = otherEntity.id;
                option.textContent = `${ENTITY_TYPES[otherEntity.type].label}: ${otherEntity.value}`;
                linkTarget.appendChild(option);
            }
        }
        
        // Store source entity ID
        modal.dataset.sourceId = entity.id;
        
        modal.style.display = 'flex';
    }

    async handleCreateLinkConfirm() {
        const modal = document.getElementById('createLinkModal');
        const sourceId = modal.dataset.sourceId;
        const targetId = document.getElementById('linkTarget').value;
        const relType = document.getElementById('linkRelType').value;

        if (!targetId) {
            alert('Please select a target entity');
            return;
        }

        try {
            const relationship = new ThreatRelationship(null, sourceId, targetId, relType);
            this.threatGraph.addRelationship(relationship);
            this.graphEngine.addEdge(relationship);
            
            await this.storage.saveRelationship(relationship);

            this.updateStats();

            modal.style.display = 'none';
        } catch (error) {
            alert(`Error creating link: ${error.message}`);
        }
    }

    async deleteEntityFromContext(nodeId) {
        if (confirm(`Are you sure you want to delete this entity and all its connections?`)) {
            this.threatGraph.removeEntity(nodeId);
            this.graphEngine.removeNode(nodeId);
            
            await this.storage.deleteEntity(nodeId);

            this.updateNodeDropdowns();
            this.updateStats();
            this.updateSelectionInfo();
        }
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

        statusDiv.textContent = 'Creating entity...';
        statusDiv.style.color = '#3498db';

        const entity = new ThreatEntity(null, type, value, {
            description: description || `${ENTITY_TYPES[type].label}: ${value}`
        });

        statusDiv.textContent = 'Entity created, adding to graph...';

        // Add to threat graph model
        this.threatGraph.addEntity(entity);
        statusDiv.textContent = `Added to model (${this.threatGraph.entities.size} total)`;
        
        // Add to visualization
        this.graphEngine.addNode(entity);
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
    }

    async clearGraph() {
        this.threatGraph.clear();
        this.graphEngine.clear();
        await this.storage.clearAll();
        
        this.updateNodeDropdowns();
        this.updateStats();
        this.updateSelectionInfo();
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

        try {
            const enrichmentData = await this.enrichmentEngine.enrichEntity(entity);

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
