# Enrichment Guide

The Threat Intelligence Graph tool supports automatic enrichment of entities using various threat intelligence APIs and free services.

## What is Enrichment?

Enrichment automatically gathers additional information about your indicators (IPs, domains, hashes, etc.) from external threat intelligence sources. This helps you:

- **Assess Risk** - Get reputation scores and abuse data
- **Gather Context** - Learn about geolocation, ownership, and infrastructure
- **Validate Threats** - Check indicators against malware databases
- **Save Time** - Automate manual lookups across multiple sources

## Getting Started

### 1. Configure API Keys (Optional but Recommended)

Click the **⚙️ Settings** button in the header to configure API keys for premium threat intelligence sources:

**Recommended Free API Keys:**
- **VirusTotal** - 4 requests/minute on free tier
  - Sign up: https://www.virustotal.com/gui/join-us
  - Get API key: https://www.virustotal.com/gui/my-apikey
  
- **AbuseIPDB** - 1000 checks/day on free tier
  - Sign up: https://www.abuseipdb.com/register
  - Get API key: https://www.abuseipdb.com/account/api

**Optional Advanced Keys:**
- **Shodan** - Port scanning and service detection
- **URLScan** - Website scanning and screenshots

### 2. Add Entities to Your Graph

Add IPs, domains, file hashes, or CVEs to your graph using the "Add Entity" form.

### 3. Enrich an Entity

1. Click on any node in the graph
2. Click the **🔍 Enrich Entity** button in the Actions panel
3. Wait for enrichment to complete (usually 1-3 seconds)
4. View enriched data in the Selection Details panel

### 4. Enriched Entity Indicators

Enriched entities show:
- **Green double border** on the node in the graph
- **✓ Enriched** status in the details panel
- Additional data sections with enrichment results

## Supported Enrichment Types

### IP Address Enrichment

**Free Sources:**
- IP-API: Geolocation, ISP, organization, hosting/proxy detection
- URLhaus: Malicious URL associations

**With API Keys:**
- VirusTotal: Reputation, detection ratios, community votes
- AbuseIPDB: Abuse confidence score, report history
- Shodan: Open ports, services, vulnerabilities

**Data Displayed:**
- Country, city, region
- ISP and organization
- Hosting/proxy/VPN detection
- Abuse score and threat level
- VirusTotal detections
- Associated malicious URLs

### Domain Enrichment

**Free Sources:**
- URLhaus: Malicious URL database
- DNS Lookups (requires backend)

**With API Keys:**
- VirusTotal: Reputation, categories, detections
- URLScan: Screenshots, HTTP data, certificates

**Data Displayed:**
- VirusTotal detection ratios
- Domain categories
- Reputation scores
- Associated malicious files
- WHOIS data (registrar, creation date)

### File Hash Enrichment (SHA256/MD5)

**Free Sources:**
- MalwareBazaar: Malware samples database

**With API Keys:**
- VirusTotal: Antivirus detections, file details

**Data Displayed:**
- Total detections / engines count
- File type and size
- Associated malware families
- First/last seen dates
- File names

### CVE Enrichment

**Free Sources:**
- NVD (National Vulnerability Database)

**Data Displayed:**
- CVSS score and severity
- Vulnerability description
- Publication dates
- Reference links
- Affected products

## Enrichment Best Practices

### API Rate Limits

**Be aware of rate limits:**
- VirusTotal free: 4 requests/minute
- AbuseIPDB free: 1000 requests/day
- IP-API: 45 requests/minute

**Tip:** Enrichment results are cached in memory! Re-enriching the same indicator uses the cache.

### When to Enrich

**Good Times to Enrich:**
- After adding high-priority indicators
- When investigating suspicious activity
- Before sharing analysis with stakeholders
- When you need reputation data

**Avoid Over-Enriching:**
- Don't enrich every entity immediately
- Focus on key indicators in your investigation
- Batch enrich after building your graph

### Data Privacy

**Security Notes:**
- API keys stored in browser localStorage (not sent to any server)
- All enrichment happens client-side in your browser
- Lookups go directly to the threat intelligence APIs
- No data is stored on external servers by this tool

**Caution:** When using public APIs, you're sending indicators to third parties. Avoid enriching sensitive internal IPs or confidential data.

## Enrichment Data Storage

- Enrichment data is stored in the entity's metadata
- Persists in IndexedDB with the rest of your graph
- Exported with your graph data (JSON export)
- Includes timestamp and source information

## Troubleshooting

### "Enrichment failed" Error

**Common causes:**
1. **No API key configured** - Configure keys in Settings
2. **API rate limit exceeded** - Wait and try again
3. **Invalid API key** - Verify your key in Settings
4. **Network error** - Check your internet connection
5. **CORS issues** - Some APIs may require CORS proxy

**Check the browser console (F12) for detailed error messages**

### No Enrichment Data Shown

- Not all sources return data for every indicator
- Some IPs/domains may have no reputation data
- Ensure the indicator format is correct
- Verify API keys are entered correctly

### Free Alternative: Mock Data

If you don't have API keys, the tool can generate mock enrichment data for testing:

```javascript
// In browser console:
const mockData = enrichmentEngine.generateMockEnrichment(entity);
```

## Supported APIs

### Currently Integrated

| Service | Type | Free Tier | What It Provides |
|---------|------|-----------|------------------|
| **IP-API** | GeoIP | ✅ Yes (no key) | Location, ISP, hosting detection |
| **VirusTotal** | Multi | ✅ Limited | Reputation, detections, relationships |
| **AbuseIPDB** | IP Reputation | ✅ Limited | Abuse scores, report history |
| **URLhaus** | URL/Domain | ✅ Yes (no key) | Malicious URL database |
| **MalwareBazaar** | File Hash | ✅ Yes (no key) | Malware sample database |
| **NVD** | CVE | ✅ Yes (no key) | Vulnerability details |

### Future Additions (Planned)

- AlienVault OTX
- ThreatFox
- GreyNoise
- Censys
- SecurityTrails
- PassiveTotal
- Hybrid Analysis

## Advanced Usage

### Bulk Enrichment (Coming Soon)

Future feature to enrich all entities in your graph at once.

### Custom Enrichment Sources

The enrichment engine is modular. Developers can add new sources by:

1. Adding API integration method in `enrichment.js`
2. Updating the enrichment dispatcher
3. Adding data display logic in `app.js`

### Enrichment Automation

You can trigger enrichment programmatically:

```javascript
// In browser console after selecting the app:
await app.handleEnrichNode();

// Or enrich a specific entity:
const entity = app.threatGraph.getEntity('entity-id');
const data = await app.enrichmentEngine.enrichEntity(entity);
```

## Privacy & Compliance

**Data Handling:**
- Your API keys never leave your browser
- Direct API calls from client to threat intelligence services
- No middleman or proxy server involved
- You control what data is enriched

**Compliance Considerations:**
- Check your organization's policies on external API usage
- Be cautious with sensitive/internal IPs
- Review API provider privacy policies
- Consider private deployments for sensitive investigations

## Support & Resources

- Open browser console (F12) to see enrichment logs
- Check API provider status pages for outages
- Review API documentation for data formats
- Test with known-bad indicators (e.g., test-malware.com)

---

**Tip:** Start with free APIs (IP-API, URLhaus, MalwareBazaar) to see enrichment in action, then add VirusTotal and AbuseIPDB keys for comprehensive threat intelligence!
