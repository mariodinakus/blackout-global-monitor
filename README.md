# BLACKOUT / GLOBAL MONITOR

An editorial-style global monitor for electricity, internet and digital infrastructure disruptions. The dashboard **does not** claim to know the probability of a worldwide electricity blackout. Data are observed, officially reported, news-reported or illustrative and marked accordingly.

## Included feeds

| Feed | Data | Important limitation |
|---|---|---|
| CAIDA / IODA | Connectivity events with country-level locations | Signals overlap a 48-hour observation window; not all are active or attacks. |
| Cloudflare/GitHub/OpenAI/Atlassian/DigitalOcean | Official provider status and unresolved incidents | Limited provider sample; not the internet as a whole. |
| Elexon BMRS | GB rolling system-demand proxy + fuel snapshot | Not local wire loading or reserve margin. |
| Fraunhofer ISE Energy-Charts | Continental European grid frequency from Freiburg, and European public generation by country | A frequency sensor is not worldwide power-system telemetry. |
| GDELT | Latest energy / cyber / connectivity news articles | A news article is an unverified report, not sensor confirmation; publisher location is not event location. |
| CISA KEV | Known exploited vulnerability records | Not live cyberattacks. |

## Local development

Requires Node 20+ (Node 22 recommended), no packages required.

```bash
npm run dev
# Open http://localhost:3000
npm test
```

## Deploying to existing Vercel project

**Project:** `blackout-global-monitor` (`prj_cInWmnUrGUdlP4L41giZYP51VE0F`) on Vercel team `VIBE` (`team_wANTVAJNt4bjAeZHo9U8loJ5`). **Production domain:** `blackout-global-monitor.vercel.app`.

1. Create an **empty GitHub repository** named `blackout-global-monitor` under `mariodinakus`. Do not initialize with a conflicting starter template if uploading these files.
2. Commit the contents of this directory to `main` in that repository. Do not commit `.env` or `.vercel`.
3. In Vercel go to **VIBE > blackout-global-monitor > Settings > Git** and connect `mariodinakus/blackout-global-monitor` to the **existing** Vercel project. Do not choose *Add New Project*, which would create a duplicate.
4. Confirm the production branch is `main` and that a build/deploy succeeds. Default framework should be `Other`; there is no build step, and root is the repository root.
5. Verify `/` and `/api/overview`, `/api/energy?country=gr`, `/api/news?topic=energy`, `/api/cyber`.

**Note:** The connected GitHub tools in this session do not expose `create_repository`, and the Vercel connector does not expose an action to connect a new Git repository to an existing unlinked project. The project files are provided, but these two account changes must be completed using GitHub/Vercel UI or capabilities available in Work.

## Security and provenance

There are no API keys or secrets in this repository. Server API handlers retrieve public endpoints with request timeouts and short CDN caching. Outgoing article links are escaped/sanitized client-side. Failures show *unavailable*, not zero. Real-time telemetry for global grid line overload is not publicly available through these feeds; no such values are invented.

© Map: OpenStreetMap contributors. Energy data: Energy-Charts.info (CC BY 4.0), Elexon Insights. News: GDELT Project. Infrastructure dots are illustrative known sites, not a real-time operational inventory.