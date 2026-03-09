/**
 * IndexedDB Storage Manager for Threat Intelligence Graph
 */
export class ThreatGraphStorage {
    constructor(dbName = 'ThreatIntelDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create entities store
                if (!db.objectStoreNames.contains('entities')) {
                    const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
                    entityStore.createIndex('type', 'type', { unique: false });
                    entityStore.createIndex('value', 'value', { unique: false });
                }

                // Create relationships store
                if (!db.objectStoreNames.contains('relationships')) {
                    const relStore = db.createObjectStore('relationships', { keyPath: 'id' });
                    relStore.createIndex('source', 'source', { unique: false });
                    relStore.createIndex('target', 'target', { unique: false });
                    relStore.createIndex('type', 'type', { unique: false });
                }

                // Create metadata store for graph-level information
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };
        });
    }

    async saveGraph(graph) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(
            ['entities', 'relationships', 'metadata'],
            'readwrite'
        );

        const entityStore = transaction.objectStore('entities');
        const relStore = transaction.objectStore('relationships');
        const metaStore = transaction.objectStore('metadata');

        // Clear existing data
        await this._clearStore(entityStore);
        await this._clearStore(relStore);

        // Save entities
        for (const entity of graph.entities.values()) {
            entityStore.add(entity.toJSON());
        }

        // Save relationships
        for (const rel of graph.relationships.values()) {
            relStore.add(rel.toJSON());
        }

        // Save metadata
        metaStore.put({
            key: 'lastSaved',
            value: new Date().toISOString()
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async loadGraph() {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(
            ['entities', 'relationships'],
            'readonly'
        );

        const entityStore = transaction.objectStore('entities');
        const relStore = transaction.objectStore('relationships');

        const entities = await this._getAllFromStore(entityStore);
        const relationships = await this._getAllFromStore(relStore);

        return {
            entities,
            relationships
        };
    }

    async saveEntity(entity) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(['entities'], 'readwrite');
        const store = transaction.objectStore('entities');
        
        return new Promise((resolve, reject) => {
            const request = store.put(entity.toJSON());
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveRelationship(relationship) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(['relationships'], 'readwrite');
        const store = transaction.objectStore('relationships');
        
        return new Promise((resolve, reject) => {
            const request = store.put(relationship.toJSON());
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEntity(id) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(
            ['entities', 'relationships'],
            'readwrite'
        );

        const entityStore = transaction.objectStore('entities');
        const relStore = transaction.objectStore('relationships');

        // Delete entity
        entityStore.delete(id);

        // Delete all related relationships
        const sourceIndex = relStore.index('source');
        const targetIndex = relStore.index('target');

        const sourceRels = await this._getAllFromIndex(sourceIndex, id);
        const targetRels = await this._getAllFromIndex(targetIndex, id);

        [...sourceRels, ...targetRels].forEach(rel => {
            relStore.delete(rel.id);
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async deleteRelationship(id) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(['relationships'], 'readwrite');
        const store = transaction.objectStore('relationships');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction(
            ['entities', 'relationships'],
            'readwrite'
        );

        await this._clearStore(transaction.objectStore('entities'));
        await this._clearStore(transaction.objectStore('relationships'));

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Helper methods
    _clearStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    _getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _getAllFromIndex(index, key) {
        return new Promise((resolve, reject) => {
            const request = index.getAll(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async exportToJSON() {
        const data = await this.loadGraph();
        return JSON.stringify(data, null, 2);
    }

    async importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.entities || !data.relationships) {
                throw new Error('Invalid data format');
            }

            // Clear existing data
            await this.clearAll();

            // Import new data
            const transaction = this.db.transaction(
                ['entities', 'relationships'],
                'readwrite'
            );

            const entityStore = transaction.objectStore('entities');
            const relStore = transaction.objectStore('relationships');

            data.entities.forEach(entity => entityStore.add(entity));
            data.relationships.forEach(rel => relStore.add(rel));

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
}
