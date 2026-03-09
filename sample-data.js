import { ThreatEntity, ThreatRelationship } from './threat-intel.js';

/**
 * Sample Threat Intelligence Data
 * Simulates an APT campaign with various indicators and relationships
 */
export function generateSampleData() {
    const entities = [];
    const relationships = [];

    // Threat Actor
    const aptGroup = new ThreatEntity(
        'apt-38',
        'threat-actor',
        'APT-38 (Lazarus Group)',
        {
            description: 'North Korean state-sponsored advanced persistent threat group',
            tags: ['apt', 'nation-state', 'north-korea'],
            confidence: 'high'
        }
    );
    entities.push(aptGroup);

    // Campaign
    const campaign = new ThreatEntity(
        'campaign-operation-troy',
        'campaign',
        'Operation Troy',
        {
            description: 'Financial institution targeting campaign',
            tags: ['banking', 'swift', 'wire-fraud'],
            confidence: 'high',
            firstSeen: '2023-01-15T00:00:00Z'
        }
    );
    entities.push(campaign);

    // Malware
    const malware1 = new ThreatEntity(
        'malware-trojan-banker',
        'malware',
        'TrojanBanker.APT38',
        {
            description: 'Banking trojan used for SWIFT network compromise',
            tags: ['trojan', 'banker', 'rat'],
            confidence: 'high'
        }
    );
    entities.push(malware1);

    const malware2 = new ThreatEntity(
        'malware-backdoor',
        'malware',
        'DarkComet RAT',
        {
            description: 'Remote access trojan for persistence',
            tags: ['rat', 'backdoor'],
            confidence: 'high'
        }
    );
    entities.push(malware2);

    // Tools
    const tool1 = new ThreatEntity(
        'tool-mimikatz',
        'tool',
        'Mimikatz',
        {
            description: 'Credential dumping tool',
            tags: ['credential-access', 'post-exploitation'],
            confidence: 'high'
        }
    );
    entities.push(tool1);

    // Vulnerabilities
    const vuln1 = new ThreatEntity(
        'cve-2023-12345',
        'vulnerability',
        'CVE-2023-12345',
        {
            description: 'Remote code execution in banking software',
            tags: ['rce', 'critical'],
            confidence: 'high'
        }
    );
    entities.push(vuln1);

    // Infrastructure - IPs
    const ip1 = new ThreatEntity(
        'ip-c2-1',
        'ip',
        '185.234.217.89',
        {
            description: 'Command and control server',
            tags: ['c2', 'infrastructure'],
            confidence: 'high',
            country: 'Unknown'
        }
    );
    entities.push(ip1);

    const ip2 = new ThreatEntity(
        'ip-c2-2',
        'ip',
        '91.219.237.45',
        {
            description: 'Secondary C2 server',
            tags: ['c2', 'infrastructure'],
            confidence: 'medium'
        }
    );
    entities.push(ip2);

    const ip3 = new ThreatEntity(
        'ip-victim',
        'ip',
        '10.50.100.25',
        {
            description: 'Compromised internal banking server',
            tags: ['victim', 'internal'],
            confidence: 'high'
        }
    );
    entities.push(ip3);

    // Domains
    const domain1 = new ThreatEntity(
        'domain-phishing',
        'domain',
        'secure-bank-login.net',
        {
            description: 'Phishing domain mimicking legitimate bank',
            tags: ['phishing', 'infrastructure'],
            confidence: 'high'
        }
    );
    entities.push(domain1);

    const domain2 = new ThreatEntity(
        'domain-c2',
        'domain',
        'update-service.com',
        {
            description: 'C2 domain for malware communication',
            tags: ['c2', 'infrastructure'],
            confidence: 'high'
        }
    );
    entities.push(domain2);

    // File Hashes
    const hash1 = new ThreatEntity(
        'hash-malware-1',
        'hash',
        'a1b2c3d4e5f6...89ab',
        {
            description: 'SHA256 hash of TrojanBanker sample',
            tags: ['malware', 'ioc'],
            confidence: 'high',
            fullHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901289ab'
        }
    );
    entities.push(hash1);

    const hash2 = new ThreatEntity(
        'hash-malware-2',
        'hash',
        'b2c3d4e5f6a7...12cd',
        {
            description: 'SHA256 hash of DarkComet RAT sample',
            tags: ['malware', 'ioc'],
            confidence: 'high'
        }
    );
    entities.push(hash2);

    const hash3 = new ThreatEntity(
        'hash-dropper',
        'hash',
        'c3d4e5f6a7b8...34ef',
        {
            description: 'Initial dropper payload',
            tags: ['dropper', 'ioc'],
            confidence: 'medium'
        }
    );
    entities.push(hash3);

    // Create Relationships
    
    // APT Group attribution
    relationships.push(new ThreatRelationship(
        'rel-1',
        campaign.id,
        aptGroup.id,
        'attributed-to',
        { confidence: 'high' }
    ));

    // Campaign uses malware
    relationships.push(new ThreatRelationship(
        'rel-2',
        campaign.id,
        malware1.id,
        'uses',
        { confidence: 'high' }
    ));

    relationships.push(new ThreatRelationship(
        'rel-3',
        campaign.id,
        malware2.id,
        'uses',
        { confidence: 'high' }
    ));

    // APT uses tools
    relationships.push(new ThreatRelationship(
        'rel-4',
        aptGroup.id,
        tool1.id,
        'uses',
        { confidence: 'high' }
    ));

    // Malware exploits vulnerability
    relationships.push(new ThreatRelationship(
        'rel-5',
        malware1.id,
        vuln1.id,
        'exploits',
        { confidence: 'high' }
    ));

    // Infrastructure relationships
    relationships.push(new ThreatRelationship(
        'rel-6',
        domain2.id,
        ip1.id,
        'resolves-to',
        { confidence: 'high' }
    ));

    relationships.push(new ThreatRelationship(
        'rel-7',
        domain1.id,
        ip2.id,
        'resolves-to',
        { confidence: 'medium' }
    ));

    // Malware communications
    relationships.push(new ThreatRelationship(
        'rel-8',
        malware1.id,
        domain2.id,
        'communicates-with',
        { confidence: 'high' }
    ));

    relationships.push(new ThreatRelationship(
        'rel-9',
        malware2.id,
        ip1.id,
        'communicates-with',
        { confidence: 'high' }
    ));

    // Victim communications
    relationships.push(new ThreatRelationship(
        'rel-10',
        ip3.id,
        ip1.id,
        'communicates-with',
        { confidence: 'high', description: 'Observed C2 traffic' }
    ));

    // File relationships
    relationships.push(new ThreatRelationship(
        'rel-11',
        hash1.id,
        malware1.id,
        'indicates',
        { confidence: 'high' }
    ));

    relationships.push(new ThreatRelationship(
        'rel-12',
        hash2.id,
        malware2.id,
        'indicates',
        { confidence: 'high' }
    ));

    // Dropper delivers malware
    relationships.push(new ThreatRelationship(
        'rel-13',
        hash3.id,
        hash1.id,
        'drops',
        { confidence: 'medium' }
    ));

    // Phishing delivers dropper
    relationships.push(new ThreatRelationship(
        'rel-14',
        domain1.id,
        hash3.id,
        'delivers',
        { confidence: 'medium' }
    ));

    // Campaign targets
    relationships.push(new ThreatRelationship(
        'rel-15',
        campaign.id,
        ip3.id,
        'targets',
        { confidence: 'high' }
    ));

    return { entities, relationships };
}

/**
 * Create additional sample scenarios
 */
export function generateMinimalSample() {
    const entities = [];
    const relationships = [];

    // Simple phishing scenario
    const attacker = new ThreatEntity('attacker-1', 'threat-actor', 'Unknown Attacker');
    const phishingDomain = new ThreatEntity('domain-phish', 'domain', 'fake-login.com');
    const maliciousIP = new ThreatEntity('ip-1', 'ip', '192.168.1.100');
    const malware = new ThreatEntity('malware-1', 'malware', 'InfoStealer');

    entities.push(attacker, phishingDomain, maliciousIP, malware);

    relationships.push(
        new ThreatRelationship('rel-a', attacker.id, phishingDomain.id, 'uses'),
        new ThreatRelationship('rel-b', phishingDomain.id, maliciousIP.id, 'resolves-to'),
        new ThreatRelationship('rel-c', phishingDomain.id, malware.id, 'delivers')
    );

    return { entities, relationships };
}
