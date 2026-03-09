import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './threat-intel.js';

/**
 * Graph Visualization Engine using Cytoscape.js
 */
export class GraphEngine {
    constructor(container, threatGraph) {
        this.container = container;
        this.threatGraph = threatGraph;
        this.cy = null;
        this.selectedElement = null;
        this.init();
    }

    init() {
        console.log('Initializing GraphEngine with container:', this.container);
        
        if (!this.container) {
            console.error('Container element not found!');
            return;
        }
        
        // Register cola extension if available
        if (typeof cytoscape !== 'undefined' && typeof cola !== 'undefined' && cytoscape('layout', 'cola') === undefined) {
            try {
                cytoscape.use(cytoscapeCola);
                console.log('Cola layout extension registered');
            } catch (error) {
                console.warn('Could not register cola layout:', error);
            }
        }
        
        this.cy = cytoscape({
            container: this.container,
            
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': ele => {
                            const type = ele.data('type');
                            return ENTITY_TYPES[type]?.color || '#95a5a6';
                        },
                        'label': 'data(label)',
                        'color': '#ecf0f1',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '12px',
                        'width': '60px',
                        'height': '60px',
                        'border-width': '3px',
                        'border-color': '#2c3e50',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'font-weight': 'bold',
                        'text-outline-width': 2,
                        'text-outline-color': '#1a1a1a',
                        'shape': ele => {
                            const type = ele.data('type');
                            return ENTITY_TYPES[type]?.shape || 'ellipse';
                        }
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': '5px',
                        'border-color': '#3498db',
                        'z-index': 9999
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': ele => {
                            const type = ele.data('type');
                            return RELATIONSHIP_TYPES[type]?.color || '#95a5a6';
                        },
                        'target-arrow-color': ele => {
                            const type = ele.data('type');
                            return RELATIONSHIP_TYPES[type]?.color || '#95a5a6';
                        },
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '10px',
                        'color': '#ecf0f1',
                        'text-outline-width': 2,
                        'text-outline-color': '#1a1a1a',
                        'text-background-color': '#2d2d2d',
                        'text-background-opacity': 0.8,
                        'text-background-padding': '3px',
                        'line-style': ele => {
                            const type = ele.data('type');
                            return RELATIONSHIP_TYPES[type]?.style || 'solid';
                        }
                    }
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'width': 5,
                        'line-color': '#3498db',
                        'target-arrow-color': '#3498db',
                        'z-index': 9999
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'border-width': '5px',
                        'border-color': '#f39c12',
                        'z-index': 9998
                    }
                },
                {
                    selector: '.enriched',
                    style: {
                        'border-width': '4px',
                        'border-color': '#2ecc71',
                        'border-style': 'double'
                    }
                },
                {
                    selector: '.dimmed',
                    style: {
                        'opacity': 0.3
                    }
                }
            ],

            layout: {
                name: 'cose',
                animate: true,
                nodeRepulsion: 8000,
                idealEdgeLength: 100,
                edgeElasticity: 100,
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                padding: 50
            },

            minZoom: 0.2,
            maxZoom: 3,
            wheelSensitivity: 0.5
        });

        console.log('Cytoscape initialized successfully. Nodes:', this.cy.nodes().length);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Node/Edge selection
        this.cy.on('tap', 'node, edge', (event) => {
            this.selectedElement = event.target;
            this.highlightConnected(event.target);
        });

        // Background tap (deselect)
        this.cy.on('tap', (event) => {
            if (event.target === this.cy) {
                this.selectedElement = null;
                this.clearHighlights();
            }
        });

        // Double-click to expand
        this.cy.on('dbltap', 'node', (event) => {
            const node = event.target;
            this.expandNode(node);
        });

        // Context menu prevention
        this.cy.on('cxttap', (event) => {
            event.preventDefault();
        });
    }

    highlightConnected(element) {
        // Remove previous highlights
        this.cy.elements().removeClass('highlighted dimmed');

        if (element.isNode()) {
            // Highlight connected nodes and edges
            const connected = element.neighborhood().add(element);
            const notConnected = this.cy.elements().not(connected);
            
            connected.addClass('highlighted');
            notConnected.addClass('dimmed');
        } else if (element.isEdge()) {
            // Highlight edge and connected nodes
            const nodes = element.connectedNodes();
            element.addClass('highlighted');
            nodes.addClass('highlighted');
            
            this.cy.elements().not(element).not(nodes).addClass('dimmed');
        }
    }

    clearHighlights() {
        this.cy.elements().removeClass('highlighted dimmed');
    }

    expandNode(node) {
        const entityId = node.data('id');
        const connectedEntities = this.threatGraph.getConnectedEntities(entityId);
        
        // Show connected entities if they're hidden
        connectedEntities.forEach(entity => {
            const existingNode = this.cy.getElementById(entity.id);
            if (existingNode.length > 0) {
                existingNode.removeClass('hidden');
            }
        });

        // Animate the expansion
        node.animate({
            style: { 'width': '80px', 'height': '80px' },
            duration: 300
        }).animate({
            style: { 'width': '60px', 'height': '60px' },
            duration: 300
        });
    }

    addNode(entity) {
        console.log('GraphEngine.addNode called with:', entity);
        
        if (!this.cy) {
            console.error('Cytoscape not initialized!');
            return;
        }
        
        if (this.cy.getElementById(entity.id).length > 0) {
            console.warn('Node already exists:', entity.id);
            return;
        }

        const nodeData = {
            group: 'nodes',
            data: {
                id: entity.id,
                label: this.formatLabel(entity),
                type: entity.type,
                value: entity.value,
                metadata: entity.metadata
            }
        };

        console.log('Adding node with data:', nodeData);
        const node = this.cy.add(nodeData);
        console.log('Node added to Cytoscape. Total nodes:', this.cy.nodes().length);
        
        // Run layout with animation to show the change
        console.log('Applying layout...');
        this.applyLayout('cose', true);
        
        // Fit viewport to show all nodes including the new one
        setTimeout(() => {
            console.log('Fitting viewport and highlighting new node');
            this.fit();
            // Briefly highlight the new node
            node.addClass('highlighted');
            setTimeout(() => node.removeClass('highlighted'), 1500);
        }, 100);
    }

    addEdge(relationship) {
        if (this.cy.getElementById(relationship.id).length > 0) {
            console.warn('Edge already exists:', relationship.id);
            return;
        }

        const edgeData = {
            group: 'edges',
            data: {
                id: relationship.id,
                source: relationship.source,
                target: relationship.target,
                label: RELATIONSHIP_TYPES[relationship.type]?.label || relationship.type,
                type: relationship.type,
                metadata: relationship.metadata
            }
        };

        const edge = this.cy.add(edgeData);
        
        // Run layout with animation
        this.applyLayout('cose', true);
        
        // Fit viewport and highlight the new edge
        setTimeout(() => {
            this.fit();
            edge.addClass('highlighted');
            setTimeout(() => edge.removeClass('highlighted'), 1500);
        }, 100);
    }

    removeNode(id) {
        const node = this.cy.getElementById(id);
        if (node.length > 0) {
            node.remove();
        }
    }

    removeEdge(id) {
        const edge = this.cy.getElementById(id);
        if (edge.length > 0) {
            edge.remove();
        }
    }

    formatLabel(entity) {
        let label = entity.value;
        
        // Truncate long labels
        if (label.length > 20) {
            label = label.substring(0, 17) + '...';
        }

        return label;
    }

    clear() {
        this.cy.elements().remove();
        this.selectedElement = null;
    }

    applyLayout(layoutName, animate = true) {
        // Default to cose if cola/force-directed is requested but not available
        if (layoutName === 'cola' && typeof cola === 'undefined') {
            console.warn('Cola layout not available, falling back to cose');
            layoutName = 'cose';
        }
        
        let layoutConfig = {
            name: layoutName,
            animate: animate,
            animationDuration: 500,
            padding: 50
        };

        switch (layoutName) {
            case 'cola':
                layoutConfig = {
                    ...layoutConfig,
                    randomize: false,
                    maxSimulationTime: 2000,
                    nodeSpacing: 50,
                    edgeLength: 150
                };
                break;
            case 'cose':
                layoutConfig = {
                    ...layoutConfig,
                    nodeRepulsion: 8000,
                    idealEdgeLength: 100,
                    edgeElasticity: 100,
                    nestingFactor: 5,
                    gravity: 80,
                    numIter: 1000
                };
                break;
            case 'circle':
                layoutConfig = {
                    ...layoutConfig,
                    radius: 200
                };
                break;
            case 'grid':
                layoutConfig = {
                    ...layoutConfig,
                    rows: undefined,
                    cols: undefined
                };
                break;
            case 'breadthfirst':
                layoutConfig = {
                    ...layoutConfig,
                    directed: true,
                    spacingFactor: 1.5
                };
                break;
        }

        try {
            const layout = this.cy.layout(layoutConfig);
            layout.run();
        } catch (error) {
            console.error('Layout failed:', error);
            // Fallback to simple preset layout
            this.cy.layout({ name: 'preset' }).run();
        }
    }

    fit() {
        this.cy.fit(null, 50);
    }

    zoomIn() {
        this.cy.zoom(this.cy.zoom() * 1.2);
        this.cy.center();
    }

    zoomOut() {
        this.cy.zoom(this.cy.zoom() * 0.8);
        this.cy.center();
    }

    getSelectedElement() {
        return this.selectedElement;
    }

    getStats() {
        return {
            nodes: this.cy.nodes().length,
            edges: this.cy.edges().length,
            selected: this.cy.$(':selected').length
        };
    }

    // Load complete graph from ThreatGraph
    loadFromThreatGraph() {
        this.clear();

        // Add all nodes
        for (const entity of this.threatGraph.entities.values()) {
            const nodeData = {
                group: 'nodes',
                data: {
                    id: entity.id,
                    label: this.formatLabel(entity),
                    type: entity.type,
                    value: entity.value,
                    metadata: entity.metadata
                }
            };
            this.cy.add(nodeData);
        }

        // Add all edges
        for (const relationship of this.threatGraph.relationships.values()) {
            const edgeData = {
                group: 'edges',
                data: {
                    id: relationship.id,
                    source: relationship.source,
                    target: relationship.target,
                    label: RELATIONSHIP_TYPES[relationship.type]?.label || relationship.type,
                    type: relationship.type,
                    metadata: relationship.metadata
                }
            };
            this.cy.add(edgeData);
        }

        this.applyLayout('cola', true);
        this.fit();
    }

    // Export graph as image
    exportImage(format = 'png') {
        return this.cy.png({
            output: 'blob',
            bg: '#1a1a1a',
            full: true,
            scale: 2
        });
    }
}
