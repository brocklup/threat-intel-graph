/**
 * Threat Intelligence Entity Model
 */
export class ThreatEntity {
    constructor(id, type, value, metadata = {}) {
        this.id = id || this.generateId();
        this.type = type;
        this.value = value;
        this.metadata = {
            description: '',
            tags: [],
            confidence: 'medium',
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            ...metadata
        };
    }

    generateId() {
        return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            value: this.value,
            metadata: this.metadata
        };
    }

    static fromJSON(json) {
        return new ThreatEntity(json.id, json.type, json.value, json.metadata);
    }
}

/**
 * Relationship between threat entities
 */
export class ThreatRelationship {
    constructor(id, source, target, type, metadata = {}) {
        this.id = id || this.generateId();
        this.source = source;
        this.target = target;
        this.type = type;
        this.metadata = {
            confidence: 'medium',
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            bidirectional: false,
            ...metadata
        };
    }

    generateId() {
        return `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            source: this.source,
            target: this.target,
            type: this.type,
            metadata: this.metadata
        };
    }

    static fromJSON(json) {
        return new ThreatRelationship(json.id, json.source, json.target, json.type, json.metadata);
    }
}

/**
 * Entity Type Configuration
 */
export const ENTITY_TYPES = {
    'ip': {
        label: 'IP Address',
        color: '#e74c3c',
        icon: '🌐',
        shape: 'ellipse'
    },
    'domain': {
        label: 'Domain',
        color: '#3498db',
        icon: '🔗',
        shape: 'round-rectangle'
    },
    'hash': {
        label: 'File Hash',
        color: '#2ecc71',
        icon: '#',
        shape: 'rectangle'
    },
    'malware': {
        label: 'Malware',
        color: '#9b59b6',
        icon: '🦠',
        shape: 'diamond'
    },
    'threat-actor': {
        label: 'Threat Actor',
        color: '#e67e22',
        icon: '👤',
        shape: 'pentagon'
    },
    'vulnerability': {
        label: 'Vulnerability',
        color: '#f39c12',
        icon: '⚠️',
        shape: 'triangle'
    },
    'campaign': {
        label: 'Campaign',
        color: '#1abc9c',
        icon: '🎯',
        shape: 'hexagon'
    },
    'tool': {
        label: 'Tool',
        color: '#34495e',
        icon: '🔧',
        shape: 'octagon'
    }
};

/**
 * Relationship Type Configuration
 */
export const RELATIONSHIP_TYPES = {
    'communicates-with': {
        label: 'Communicates With',
        color: '#3498db',
        style: 'solid'
    },
    'resolves-to': {
        label: 'Resolves To',
        color: '#2ecc71',
        style: 'solid'
    },
    'downloads': {
        label: 'Downloads',
        color: '#e74c3c',
        style: 'solid'
    },
    'uses': {
        label: 'Uses',
        color: '#9b59b6',
        style: 'dashed'
    },
    'exploits': {
        label: 'Exploits',
        color: '#f39c12',
        style: 'solid'
    },
    'attributed-to': {
        label: 'Attributed To',
        color: '#e67e22',
        style: 'dotted'
    },
    'targets': {
        label: 'Targets',
        color: '#e74c3c',
        style: 'solid'
    },
    'delivers': {
        label: 'Delivers',
        color: '#9b59b6',
        style: 'solid'
    },
    'drops': {
        label: 'Drops',
        color: '#2ecc71',
        style: 'solid'
    },
    'indicates': {
        label: 'Indicates',
        color: '#95a5a6',
        style: 'dashed'
    }
};

/**
 * Threat Intelligence Graph Model
 */
export class ThreatGraph {
    constructor() {
        this.entities = new Map();
        this.relationships = new Map();
    }

    addEntity(entity) {
        if (!(entity instanceof ThreatEntity)) {
            throw new Error('Invalid entity: must be instance of ThreatEntity');
        }
        this.entities.set(entity.id, entity);
        return entity;
    }

    getEntity(id) {
        return this.entities.get(id);
    }

    removeEntity(id) {
        // Remove all relationships connected to this entity
        const relToRemove = [];
        for (const [relId, rel] of this.relationships) {
            if (rel.source === id || rel.target === id) {
                relToRemove.push(relId);
            }
        }
        relToRemove.forEach(relId => this.relationships.delete(relId));
        
        return this.entities.delete(id);
    }

    addRelationship(relationship) {
        if (!(relationship instanceof ThreatRelationship)) {
            throw new Error('Invalid relationship: must be instance of ThreatRelationship');
        }
        
        // Verify source and target exist
        if (!this.entities.has(relationship.source)) {
            throw new Error(`Source entity ${relationship.source} not found`);
        }
        if (!this.entities.has(relationship.target)) {
            throw new Error(`Target entity ${relationship.target} not found`);
        }
        
        this.relationships.set(relationship.id, relationship);
        return relationship;
    }

    getRelationship(id) {
        return this.relationships.get(id);
    }

    removeRelationship(id) {
        return this.relationships.delete(id);
    }

    getConnectedEntities(entityId) {
        const connected = new Set();
        for (const rel of this.relationships.values()) {
            if (rel.source === entityId) {
                connected.add(rel.target);
            }
            if (rel.target === entityId) {
                connected.add(rel.source);
            }
        }
        return Array.from(connected).map(id => this.getEntity(id));
    }

    getRelationshipsForEntity(entityId) {
        const relationships = [];
        for (const rel of this.relationships.values()) {
            if (rel.source === entityId || rel.target === entityId) {
                relationships.push(rel);
            }
        }
        return relationships;
    }

    clear() {
        this.entities.clear();
        this.relationships.clear();
    }

    toJSON() {
        return {
            entities: Array.from(this.entities.values()).map(e => e.toJSON()),
            relationships: Array.from(this.relationships.values()).map(r => r.toJSON())
        };
    }

    static fromJSON(json) {
        const graph = new ThreatGraph();
        
        // Add entities first
        if (json.entities) {
            json.entities.forEach(entityData => {
                const entity = ThreatEntity.fromJSON(entityData);
                graph.addEntity(entity);
            });
        }
        
        // Then add relationships
        if (json.relationships) {
            json.relationships.forEach(relData => {
                const rel = ThreatRelationship.fromJSON(relData);
                try {
                    graph.addRelationship(rel);
                } catch (error) {
                    console.warn('Skipping invalid relationship:', error.message);
                }
            });
        }
        
        return graph;
    }

    // Analysis methods
    getEntityStats() {
        const stats = {};
        for (const entity of this.entities.values()) {
            stats[entity.type] = (stats[entity.type] || 0) + 1;
        }
        return stats;
    }

    getRelationshipStats() {
        const stats = {};
        for (const rel of this.relationships.values()) {
            stats[rel.type] = (stats[rel.type] || 0) + 1;
        }
        return stats;
    }

    findShortestPath(sourceId, targetId) {
        // BFS to find shortest path
        const queue = [[sourceId]];
        const visited = new Set([sourceId]);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === targetId) {
                return path;
            }

            const connectedIds = this.getConnectedEntities(current).map(e => e.id);
            for (const nextId of connectedIds) {
                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    queue.push([...path, nextId]);
                }
            }
        }

        return null; // No path found
    }
}
