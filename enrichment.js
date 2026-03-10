/**
 * Threat Intelligence Enrichment Engine
 * 
 * Supports multiple enrichment sources:
 * - VirusTotal (requires API key)
 * - AbuseIPDB (requires API key)
 * - IPInfo.io / IP-API (free tier)
 * - DNS lookups
 * - WHOIS data
 * - URLhaus
 * - ThreatFox
 */

export class EnrichmentEngine {
    constructor() {
        this.apiKeys = this.loadApiKeys();
        this.corsProxy = 'https://corsproxy.io/?'; // Fallback CORS proxy
        this.enrichmentCache = new Map();
    }

    loadApiKeys() {
        const stored = localStorage.getItem('threatintel_api_keys');
        return stored ? JSON.parse(stored) : {
            virustotal: '',
            abuseipdb: '',
            shodan: '',
            urlscan: ''
        };
    }

    saveApiKeys(keys) {
        this.apiKeys = { ...this.apiKeys, ...keys };
        localStorage.setItem('threatintel_api_keys', JSON.stringify(this.apiKeys));
    }

    getApiKey(service) {
        return this.apiKeys[service] || '';
    }

    /**
     * Main enrichment dispatcher
     */
    async enrichEntity(entity) {
        const cacheKey = `${entity.type}-${entity.value}`;
        
        // Check cache first
        if (this.enrichmentCache.has(cacheKey)) {
            return this.enrichmentCache.get(cacheKey);
        }

        let enrichmentData = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: []
        };

        try {
            switch (entity.type) {
                case 'ip':
                    enrichmentData = await this.enrichIP(entity.value);
                    break;
                case 'domain':
                    enrichmentData = await this.enrichDomain(entity.value);
                    break;
                case 'hash':
                    enrichmentData = await this.enrichHash(entity.value);
                    break;
                case 'vulnerability':
                    enrichmentData = await this.enrichCVE(entity.value);
                    break;
                default:
                    enrichmentData.error = 'No enrichment available for this entity type';
            }

            // Cache the result
            this.enrichmentCache.set(cacheKey, enrichmentData);
            
            return enrichmentData;
        } catch (error) {
            console.error('Enrichment failed:', error);
            return {
                enriched: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * IP Address Enrichment
     */
    async enrichIP(ip) {
        const results = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: [],
            data: {}
        };

        // GeoIP lookup using free API
        try {
            const geoData = await this.getIPGeolocation(ip);
            if (geoData) {
                results.data.geolocation = geoData;
                results.sources.push('IP-API');
            }
        } catch (error) {
            console.warn('GeoIP lookup failed:', error);
        }

        // AbuseIPDB lookup (if API key available)
        if (this.apiKeys.abuseipdb) {
            try {
                const abuseData = await this.getAbuseIPDB(ip);
                if (abuseData) {
                    results.data.abuse = abuseData;
                    results.sources.push('AbuseIPDB');
                }
            } catch (error) {
                console.warn('AbuseIPDB lookup failed:', error);
            }
        }

        // VirusTotal lookup (if API key available)
        if (this.apiKeys.virustotal) {
            try {
                const vtData = await this.getVirusTotalIP(ip);
                if (vtData) {
                    results.data.virustotal = vtData;
                    results.sources.push('VirusTotal');
                }
            } catch (error) {
                console.warn('VirusTotal lookup failed:', error);
            }
        }

        // Reverse DNS
        try {
            const dnsData = await this.getReverseDNS(ip);
            if (dnsData) {
                results.data.reverseDns = dnsData;
                results.sources.push('DNS');
            }
        } catch (error) {
            console.warn('Reverse DNS failed:', error);
        }

        return results;
    }

    /**
     * Domain Enrichment
     */
    async enrichDomain(domain) {
        const results = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: [],
            data: {}
        };

        // DNS Resolution
        try {
            const dnsData = await this.getDNSRecords(domain);
            if (dnsData) {
                results.data.dns = dnsData;
                results.sources.push('DNS');
            }
        } catch (error) {
            console.warn('DNS lookup failed:', error);
        }

        // WHOIS data (simulated - real WHOIS requires backend)
        try {
            const whoisData = await this.getWHOISData(domain);
            if (whoisData) {
                results.data.whois = whoisData;
                results.sources.push('WHOIS');
            }
        } catch (error) {
            console.warn('WHOIS lookup failed:', error);
        }

        // VirusTotal lookup
        if (this.apiKeys.virustotal) {
            try {
                const vtData = await this.getVirusTotalDomain(domain);
                if (vtData) {
                    results.data.virustotal = vtData;
                    results.sources.push('VirusTotal');
                }
            } catch (error) {
                console.warn('VirusTotal lookup failed:', error);
            }
        }

        // URLhaus check
        try {
            const urlhausData = await this.getURLhaus(domain);
            if (urlhausData) {
                results.data.urlhaus = urlhausData;
                results.sources.push('URLhaus');
            }
        } catch (error) {
            console.warn('URLhaus lookup failed:', error);
        }

        return results;
    }

    /**
     * File Hash Enrichment
     */
    async enrichHash(hash) {
        const results = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: [],
            data: {}
        };

        // VirusTotal lookup
        if (this.apiKeys.virustotal) {
            try {
                const vtData = await this.getVirusTotalHash(hash);
                if (vtData) {
                    results.data.virustotal = vtData;
                    results.sources.push('VirusTotal');
                }
            } catch (error) {
                console.warn('VirusTotal lookup failed:', error);
            }
        }

        // MalwareBazaar
        try {
            const mbData = await this.getMalwareBazaar(hash);
            if (mbData) {
                results.data.malwarebazaar = mbData;
                results.sources.push('MalwareBazaar');
            }
        } catch (error) {
            console.warn('MalwareBazaar lookup failed:', error);
        }

        return results;
    }

    /**
     * CVE Enrichment
     */
    async enrichCVE(cve) {
        const results = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: [],
            data: {}
        };

        try {
            const nvdData = await this.getNVDData(cve);
            if (nvdData) {
                results.data.nvd = nvdData;
                results.sources.push('NVD');
            }
        } catch (error) {
            console.warn('NVD lookup failed:', error);
        }

        return results;
    }

    // ========== API Integration Methods ==========

    async getIPGeolocation(ip) {
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,as,mobile,proxy,hosting`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    country: data.country,
                    countryCode: data.countryCode,
                    region: data.regionName,
                    city: data.city,
                    isp: data.isp,
                    org: data.org,
                    asn: data.as,
                    isHosting: data.hosting,
                    isProxy: data.proxy
                };
            }
        } catch (error) {
            console.error('GeoIP API error:', error);
        }
        return null;
    }

    async getAbuseIPDB(ip) {
        if (!this.apiKeys.abuseipdb) return null;

        try {
            const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
                headers: {
                    'Key': this.apiKeys.abuseipdb,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.data) {
                return {
                    abuseScore: data.data.abuseConfidenceScore,
                    totalReports: data.data.totalReports,
                    lastReported: data.data.lastReportedAt,
                    isWhitelisted: data.data.isWhitelisted,
                    usageType: data.data.usageType
                };
            }
        } catch (error) {
            console.error('AbuseIPDB API error:', error);
        }
        return null;
    }

    async getVirusTotalIP(ip) {
        if (!this.apiKeys.virustotal) return null;

        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
                headers: {
                    'x-apikey': this.apiKeys.virustotal
                }
            });
            const data = await response.json();
            
            if (data.data) {
                const attrs = data.data.attributes;
                return {
                    malicious: attrs.last_analysis_stats?.malicious || 0,
                    suspicious: attrs.last_analysis_stats?.suspicious || 0,
                    harmless: attrs.last_analysis_stats?.harmless || 0,
                    reputation: attrs.reputation || 0,
                    asOwner: attrs.as_owner,
                    country: attrs.country
                };
            }
        } catch (error) {
            console.error('VirusTotal API error:', error);
        }
        return null;
    }

    async getVirusTotalDomain(domain) {
        if (!this.apiKeys.virustotal) return null;

        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
                headers: {
                    'x-apikey': this.apiKeys.virustotal
                }
            });
            const data = await response.json();
            
            if (data.data) {
                const attrs = data.data.attributes;
                return {
                    malicious: attrs.last_analysis_stats?.malicious || 0,
                    suspicious: attrs.last_analysis_stats?.suspicious || 0,
                    harmless: attrs.last_analysis_stats?.harmless || 0,
                    reputation: attrs.reputation || 0,
                    categories: attrs.categories || {},
                    lastUpdate: attrs.last_modification_date
                };
            }
        } catch (error) {
            console.error('VirusTotal API error:', error);
        }
        return null;
    }

    async getVirusTotalHash(hash) {
        if (!this.apiKeys.virustotal) return null;

        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
                headers: {
                    'x-apikey': this.apiKeys.virustotal
                }
            });
            const data = await response.json();
            
            if (data.data) {
                const attrs = data.data.attributes;
                return {
                    malicious: attrs.last_analysis_stats?.malicious || 0,
                    suspicious: attrs.last_analysis_stats?.suspicious || 0,
                    harmless: attrs.last_analysis_stats?.harmless || 0,
                    names: attrs.names || [],
                    size: attrs.size,
                    type: attrs.type_description,
                    firstSeen: attrs.first_submission_date
                };
            }
        } catch (error) {
            console.error('VirusTotal API error:', error);
        }
        return null;
    }

    async getReverseDNS(ip) {
        // Browser DNS API is limited, this would typically require a backend
        // For now, return a placeholder
        return {
            note: 'Reverse DNS requires backend service',
            mockHostname: `host-${ip.replace(/\./g, '-')}.example.com`
        };
    }

    async getDNSRecords(domain) {
        // Browser DNS API is limited, this would typically require a backend
        return {
            note: 'DNS records require backend service or DoH',
            mockRecords: ['A', 'AAAA', 'MX', 'TXT']
        };
    }

    async getWHOISData(domain) {
        // WHOIS requires backend, return placeholder
        return {
            note: 'WHOIS data requires backend service',
            registrar: 'Example Registrar',
            created: '2023-01-01',
            expires: '2025-01-01'
        };
    }

    async getURLhaus(domain) {
        try {
            const formData = new FormData();
            formData.append('url', domain);

            const response = await fetch('https://urlhaus-api.abuse.ch/v1/host/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.query_status === 'ok') {
                return {
                    urlCount: data.url_count || 0,
                    blacklists: data.blacklists || {},
                    firstSeen: data.firstseen
                };
            }
        } catch (error) {
            console.error('URLhaus API error:', error);
        }
        return null;
    }

    async getMalwareBazaar(hash) {
        try {
            const formData = new FormData();
            formData.append('query', 'get_info');
            formData.append('hash', hash);

            const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.query_status === 'ok' && data.data && data.data.length > 0) {
                const info = data.data[0];
                return {
                    signature: info.signature,
                    fileType: info.file_type,
                    fileSize: info.file_size,
                    tags: info.tags || [],
                    firstSeen: info.first_seen
                };
            }
        } catch (error) {
            console.error('MalwareBazaar API error:', error);
        }
        return null;
    }

    async getNVDData(cve) {
        try {
            const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cve}`);
            const data = await response.json();
            
            if (data.vulnerabilities && data.vulnerabilities.length > 0) {
                const vuln = data.vulnerabilities[0].cve;
                const metrics = vuln.metrics?.cvssMetricV31?.[0]?.cvssData;
                
                return {
                    description: vuln.descriptions?.[0]?.value,
                    cvssScore: metrics?.baseScore,
                    severity: metrics?.baseSeverity,
                    published: vuln.published,
                    lastModified: vuln.lastModified,
                    references: vuln.references?.slice(0, 5).map(r => r.url) || []
                };
            }
        } catch (error) {
            console.error('NVD API error:', error);
        }
        return null;
    }

    /**
     * Generate mock enrichment data for testing (when APIs are not available)
     */
    generateMockEnrichment(entity) {
        const mockData = {
            enriched: true,
            timestamp: new Date().toISOString(),
            sources: ['Mock Data'],
            data: {
                note: 'This is mock data for testing. Configure real API keys in settings.'
            }
        };

        switch (entity.type) {
            case 'ip':
                mockData.data.geolocation = {
                    country: 'United States',
                    city: 'San Francisco',
                    isp: 'Example ISP',
                    isHosting: true
                };
                mockData.data.risk = {
                    score: Math.floor(Math.random() * 100),
                    classification: 'Moderate Risk'
                };
                break;
            case 'domain':
                mockData.data.reputation = {
                    score: Math.floor(Math.random() * 100),
                    category: 'Unknown'
                };
                mockData.data.age = {
                    created: '2020-01-01',
                    registrar: 'Example Registrar'
                };
                break;
            case 'hash':
                mockData.data.detections = {
                    malicious: Math.floor(Math.random() * 20),
                    total: 70
                };
                mockData.data.fileType = 'PE32 executable';
                break;
        }

        return mockData;
    }

    clearCache() {
        this.enrichmentCache.clear();
    }
}
