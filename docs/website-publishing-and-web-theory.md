# Website Publishing and Web Theory

This document is a practical and conceptual guide to what happened when publishing `lyfjosie.ca`, and what is happening behind the scenes when any website is made available on the public internet.

It is written from the perspective of a static website hosted on GitHub Pages with a custom domain managed through Porkbun, but most of the theory applies to websites in general.

## 1. The Big Picture

Publishing a website means making files available on a server that other computers can reach over the internet.

At a high level, these are the moving pieces:

1. You own or control a domain name like `lyfjosie.ca`.
2. DNS records tell the internet where that domain should point.
3. A hosting provider serves the actual site content.
4. A TLS certificate allows browsers to trust the site over HTTPS.
5. A deployment workflow copies your latest site files onto the hosting platform.
6. A browser resolves the domain, connects to the server, requests the files, and renders the page.

In your case:

- Domain registrar and DNS provider: `Porkbun`
- Hosting provider: `GitHub Pages`
- Deployment system: `GitHub Actions`
- Site files: `index.html`, `styles.css`, `script.js`, images, and supporting assets in the repository

## 2. What the Internet Actually Is

The internet is a massive network of networks. Your laptop is connected to your router, your router connects to your ISP, your ISP connects to other networks, and eventually traffic reaches the network that hosts the server you want.

Computers do not fundamentally find each other by human-readable names. They communicate using IP addresses.

That means there are two broad problems to solve whenever you open a website:

- Name resolution: turn `lyfjosie.ca` into an IP address or a hostname chain that eventually becomes an IP address.
- Packet delivery: move network packets from your device to the server and back.

The web is an application built on top of that lower-level infrastructure.

## 3. Domain Names, Registrars, and DNS Providers

### Domain name

A domain name is a human-readable identifier, such as `lyfjosie.ca`. It exists in a hierarchy:

- `.` is the DNS root
- `.ca` is the top-level domain
- `lyfjosie.ca` is the apex or root domain for your site
- `www.lyfjosie.ca` is a subdomain

### Registrar

A registrar is the company through which you register ownership of a domain name. In your case, this appears to be Porkbun.

The registrar does not have to host your DNS, but often it does.

### DNS provider

A DNS provider hosts the authoritative DNS zone for your domain. This means it is the source of truth for records like:

- where the website points
- where mail is delivered
- how subdomains are handled
- which verification records exist

In your setup, Porkbun is both the registrar and the DNS provider.

## 4. DNS: The Internet’s Directory Service

DNS stands for Domain Name System.

Its job is to translate human-readable names into answers that software can use. Most commonly, that means turning a domain name into an IP address, but DNS can also return aliases, mail routing information, verification tokens, and more.

### Why DNS exists

Without DNS, users would have to remember server IP addresses instead of names. That would be fragile, because:

- IP addresses can change
- multiple hostnames may point to the same service
- services may move behind load balancers or CDNs

DNS decouples the stable public name from the changing underlying infrastructure.

### Recursive resolver vs authoritative nameserver

When you type a domain in a browser, your computer usually does not ask the domain owner’s DNS server directly.

Instead, it asks a recursive resolver. This is often provided by:

- your ISP
- your router
- Cloudflare (`1.1.1.1`)
- Google (`8.8.8.8`)

The recursive resolver performs the lookup on your behalf and caches the result.

The authoritative nameserver is the server that actually knows the official records for the domain. Porkbun hosts the authoritative records for your domain.

### DNS lookup flow

If a cached answer does not already exist, the resolver roughly does this:

1. Ask a root server which nameservers handle `.ca`
2. Ask a `.ca` nameserver which nameservers handle `lyfjosie.ca`
3. Ask Porkbun’s authoritative nameservers for the record for `lyfjosie.ca` or `www.lyfjosie.ca`
4. Return that answer to your computer

The answer is then cached according to TTL.

## 5. Common DNS Record Types

### A

An `A` record maps a name to an IPv4 address.

Example:

`lyfjosie.ca -> 185.199.108.153`

### AAAA

An `AAAA` record maps a name to an IPv6 address.

IPv6 is a newer addressing system with a much larger address space.

### CNAME

A `CNAME` record says that one hostname is an alias of another hostname.

Example:

`www.lyfjosie.ca -> yr5li.github.io`

This means clients looking up `www.lyfjosie.ca` should instead look up `yr5li.github.io` and use that answer.

Important: a `CNAME` does not point to an IP address. It points to another hostname.

### TXT

A `TXT` record stores text. It is often used for:

- domain verification
- email policies (`SPF`, `DKIM`, `DMARC`)
- ownership proof for external services

Your GitHub verification record is a TXT record proving you control the domain.

### MX

An `MX` record tells email senders where mail for your domain should be delivered.

It is unrelated to web hosting, but part of the same DNS zone.

### NS

An `NS` record identifies which nameservers are authoritative for the domain.

These are what delegate your domain to a DNS provider.

### ALIAS / ANAME

`ALIAS` and `ANAME` are provider-specific conveniences that behave like “CNAME-style indirection at the apex domain.”

Standard DNS does not allow a root domain like `lyfjosie.ca` to be a plain `CNAME`, because the apex also needs other records such as `NS` and `SOA`.

So providers invented `ALIAS` or `ANAME`:

- you enter a hostname target like `yr5li.github.io`
- the provider resolves it and serves synthesized `A` or `AAAA` answers to clients

This gives you the convenience of pointing the root domain to a hostname without violating DNS rules.

## 6. Apex Domain vs Subdomain

### Apex domain

The apex domain is the bare root domain:

`lyfjosie.ca`

This is also called:

- root domain
- zone apex
- naked domain

### Subdomain

A subdomain adds a label to the left:

- `www.lyfjosie.ca`
- `blog.lyfjosie.ca`
- `api.lyfjosie.ca`

Subdomains can usually use `CNAME` records freely. Apex domains cannot use `CNAME` in standard DNS.

That is why:

- `lyfjosie.ca` used `ALIAS`
- `www.lyfjosie.ca` used `CNAME`

## 7. TTL and DNS Propagation

TTL stands for Time To Live.

It is the number of seconds a resolver is allowed to cache an answer before checking again.

If TTL is `600`, a recursive resolver can keep that answer for 10 minutes.

### Why propagation takes time

“DNS propagation” is not a global instant update. It is the gradual expiration of old cached answers across many resolvers around the world.

That means:

- your DNS provider may update immediately
- your browser may still have an old answer
- your ISP’s resolver may still have an old answer
- GitHub’s systems may see the new answer before your browser does, or vice versa

Propagation is really distributed cache expiration.

## 8. Why We Added the Records We Added

### TXT verification record

GitHub asked for a TXT record so it could verify that you control `lyfjosie.ca`.

This matters for security. Without verification, someone could potentially try to claim the same domain on another service under some failure conditions.

The TXT record does not route traffic. It proves ownership.

### ALIAS on the apex

You added an `ALIAS` record so `lyfjosie.ca` points at GitHub Pages infrastructure.

That means when users ask for `lyfjosie.ca`, DNS eventually resolves to the GitHub Pages endpoints.

### CNAME for `www`

You added a `CNAME` so `www.lyfjosie.ca` points to `yr5li.github.io`.

That means the `www` subdomain also lands on GitHub Pages.

### HTTPS

You checked `Enforce HTTPS` so browsers are required to use TLS encryption.

That protects users against passive snooping and many forms of tampering.

## 9. GitHub Pages in Your Setup

GitHub Pages is a static site hosting platform connected to GitHub repositories.

In your repository:

- the website source files live in git
- a GitHub Actions workflow deploys the site
- GitHub Pages publishes the deployed artifact

### Why GitHub Actions was used

GitHub Pages can publish from:

- a branch
- or a custom GitHub Actions workflow

You used a GitHub Actions workflow, which is the more explicit and modern setup for deployments.

That workflow:

1. Checks out the repo
2. Configures Pages
3. Uploads the repository contents as the deploy artifact
4. Deploys that artifact to GitHub Pages

That means every push to `main` can automatically publish a new version of the site.

## 10. What Deployment Means

Deployment is the act of taking code or files from your development environment and making them active in the production environment.

In your case:

- development environment: your local folder on your Mac
- source of truth: the git repository
- deployment trigger: push to `main`
- deployed output: static files served by GitHub Pages

### Why git matters here

Git gives you:

- version history
- collaboration
- rollback ability
- an event stream that can trigger CI/CD workflows

Without git, you could still host files somewhere, but you would lose most of the automation and reproducibility.

## 11. What Happens When the Browser Opens Your Site

Suppose a user visits `https://lyfjosie.ca`.

### Step 1: URL parsing

The browser parses:

- scheme: `https`
- host: `lyfjosie.ca`
- path: `/`

### Step 2: DNS resolution

The browser asks the operating system to resolve `lyfjosie.ca`.

The OS may use:

- local DNS cache
- browser DNS cache
- resolver cache
- authoritative DNS, if caches miss

Eventually, it gets one or more IP addresses.

### Step 3: TCP connection

The browser opens a TCP connection to the server’s IP on port `443` for HTTPS.

TCP provides:

- reliable ordered delivery
- retransmission of lost packets
- flow control
- congestion control

Without TCP, the browser could not safely stream the HTTP response.

### Step 4: TLS handshake

Before sending normal HTTP content, the browser performs a TLS handshake.

This establishes:

- encryption keys
- server identity verification
- a secure communication channel

The browser checks the certificate:

- was it issued by a trusted certificate authority
- is it valid right now
- does it match `lyfjosie.ca`
- has it been revoked or otherwise invalidated

If the certificate matches the wrong hostname, the browser shows an error like `NET::ERR_CERT_COMMON_NAME_INVALID`.

### Step 5: HTTP request

Once TLS is established, the browser sends an HTTP request.

It looks conceptually like this:

```http
GET / HTTP/1.1
Host: lyfjosie.ca
User-Agent: ...
Accept: text/html,...
```

The `Host` header matters because multiple websites may share the same server IP.

### Step 6: Server response

GitHub Pages responds with:

- status code like `200 OK`
- headers like `Content-Type`, `Cache-Control`, `ETag`
- the HTML document body

### Step 7: Parsing and secondary requests

The browser parses the HTML and discovers:

- CSS files
- JavaScript files
- images
- fonts
- icons

It then makes more HTTP requests for those assets.

### Step 8: Rendering

The browser:

1. Parses HTML into the DOM
2. Parses CSS into style rules
3. Combines them into a render tree
4. Calculates layout
5. Paints pixels
6. Runs JavaScript and may update the page further

Your site is relatively simple because it is mostly static content plus client-side interactivity.

## 12. IP Addresses, Packets, and Routing

### IP packets

When your computer communicates with a server, data is split into packets. Those packets move across multiple devices:

- your laptop
- your router
- your ISP
- upstream transit providers
- destination network

Routers forward packets based on IP destination addresses.

### Routing

Routing decides where packets go next. Internet routing across large networks is coordinated using BGP, the Border Gateway Protocol.

You do not usually manage BGP yourself when publishing a normal website, but it is the reason traffic can find its way across the public internet.

### NAT and local addressing

Your laptop usually has a private local IP like `192.168.x.x`. Your router performs NAT, translating your internal traffic to a public IP visible on the internet.

That means external servers usually do not directly see your laptop’s private address.

## 13. HTTP, HTTPS, and the Web

### HTTP

HTTP is an application-layer protocol for requesting and transferring resources.

Resources can include:

- HTML documents
- CSS
- JavaScript
- images
- JSON data
- fonts
- video

### HTTPS

HTTPS is HTTP over TLS.

It provides:

- confidentiality: others cannot easily read the traffic
- integrity: traffic cannot be modified unnoticed
- authenticity: the browser can verify the server identity

Modern websites should always use HTTPS.

### Status codes

Common HTTP status codes:

- `200 OK`: success
- `301 Moved Permanently`: permanent redirect
- `302 Found`: temporary redirect
- `404 Not Found`: resource not found
- `500 Internal Server Error`: server-side failure

GitHub Pages often uses redirects when canonicalizing domains.

## 14. TLS Certificates and Why They Matter

A TLS certificate binds a public key to a domain name.

When the browser connects to `https://lyfjosie.ca`, it expects a certificate that is valid for `lyfjosie.ca`.

If the certificate is valid for some other hostname, the browser warns the user because the site could be an impostor or misconfigured.

### Certificate Authorities

Browsers trust certain root certificate authorities. Those authorities can issue certificates, or authorize intermediates to do so.

GitHub Pages automates certificate provisioning for custom domains once DNS is correctly configured.

### Why `www` can fail while apex works

Certificates are hostname-specific.

It is possible for:

- `lyfjosie.ca` to have a valid cert
- but `www.lyfjosie.ca` to still be misconfigured or waiting on issuance

That is why both DNS and certificate coverage have to be correct for each hostname users may visit.

## 15. Canonical Domains and Redirects

A site should have one canonical hostname.

For example, either:

- `lyfjosie.ca`
- or `www.lyfjosie.ca`

GitHub Pages can redirect between the apex and `www` when configured correctly.

This matters because otherwise the same content would exist at multiple URLs, which is messy for:

- user trust
- links
- caching
- search engines

In your setup, the apex `lyfjosie.ca` is the primary custom domain.

## 16. Static Sites vs Dynamic Sites

### Static site

A static site serves prebuilt files:

- HTML
- CSS
- JS
- images

The server does not generate each page on demand from a database.

Your current site is static.

### Dynamic site

A dynamic site typically has:

- an application server
- server-side code
- a database
- user authentication
- custom request handling

Examples include ecommerce stores, dashboards, and social apps.

### Why static hosting is simpler

Static hosting is easier because:

- less moving infrastructure
- lower attack surface
- lower cost
- easy CDN caching
- easy rollback

For a memory/birthday site, static hosting is an excellent fit.

## 17. Repositories, Build Systems, and CI/CD

### Repository

The repository stores:

- source files
- configuration
- history

### CI/CD

CI/CD stands for Continuous Integration / Continuous Deployment.

In your case, the deployment workflow is lightweight:

- commit code
- push to GitHub
- GitHub Actions runs
- Pages deploys the artifact

For more complex sites, CI/CD may also:

- run tests
- build TypeScript
- optimize images
- compile assets
- run linters
- run security scans

## 18. Caching Beyond DNS

Caching exists at many layers:

- browser cache
- service worker cache
- CDN cache
- proxy cache
- DNS cache

Caching improves performance but complicates debugging, because old versions can linger after changes.

### Typical debugging question

“Did I deploy the new code, or am I still seeing a cached old copy?”

That question comes up constantly in web publishing.

## 19. CDN and Edge Delivery

A CDN, or content delivery network, serves content from geographically distributed edge locations.

GitHub Pages sits behind infrastructure that can deliver content efficiently to users in many regions.

Why CDNs help:

- lower latency
- reduced load on origin infrastructure
- better cache efficiency
- resilience against spikes

Static sites benefit heavily from CDNs because files can be cached aggressively.

## 20. Browser Security Model

Browsers are strict because the web is hostile by default.

Important concepts:

- same-origin policy
- TLS certificate validation
- mixed content restrictions
- content security policies
- secure cookies

Even simple static sites benefit from browser security rules.

For example, if your HTTPS page tried to load insecure `http://` assets, the browser might block them or warn the user.

## 21. MIME Types and Content-Type

When a server returns a file, it also sends a `Content-Type` header.

Examples:

- `text/html`
- `text/css`
- `application/javascript`
- `image/png`
- `image/svg+xml`

Browsers use this to decide how to interpret the response.

If content types are wrong, browsers may refuse to execute scripts or apply styles.

## 22. Character Encoding and Why Mandarin Works

Your HTML uses:

```html
<meta charset="UTF-8" />
```

UTF-8 is a character encoding that supports a huge range of scripts, including Mandarin Chinese.

That is why putting Mandarin in your descriptions works correctly.

There are two related concerns:

1. Encoding: can the bytes represent the characters
2. Fonts: does the device have a font that can visually draw the glyphs

Your site already uses UTF-8, and the CSS now includes CJK-capable font fallbacks, which helps ensure Chinese text renders nicely.

## 23. Wildcard DNS Records and Why They Are Risky

A wildcard record looks like:

`*.example.com`

It means “any subdomain not otherwise defined should resolve this way.”

This can be convenient, but GitHub strongly recommends against wildcard DNS records for Pages custom domains because they can create takeover risk or confusing routing.

For your setup, a wildcard CNAME like `*.lyfjosie.ca -> yr5li.github.io` is unnecessary and potentially problematic.

If GitHub complains that `www` is improperly configured even though a `www` CNAME exists, the wildcard record is a plausible source of conflict.

## 24. Why Your `www` Warning Likely Exists

Your screenshot shows:

- an `ALIAS` for the apex
- a `CNAME` for `www`
- a wildcard `CNAME` for `*.lyfjosie.ca`

GitHub’s documentation strongly recommends not using wildcard DNS records for GitHub Pages custom domains. That wildcard is not needed for your website and may be contributing to the `InvalidCNAMEError`.

My recommendation is:

- keep the apex `ALIAS`
- keep the `www` `CNAME`
- keep the TXT verification record
- remove the wildcard `CNAME` unless you have a specific reason to route every subdomain to GitHub Pages

This is an inference based on your screenshot plus GitHub’s warning and documentation.

## 25. Why GitHub Needed Domain Verification

Domain verification is about trust and anti-takeover protection.

If a platform let anyone claim arbitrary domains without proof, attackers could:

- impersonate sites
- claim abandoned DNS targets
- take over forgotten subdomains

The TXT record proves control because only someone with access to the authoritative DNS zone should be able to add it.

## 26. DNS Misconfiguration Failure Modes

Common things that go wrong:

- wrong record type
- hostname entered incorrectly
- stale cache
- conflicting records
- wildcard records shadowing expected behavior
- certificate not yet issued
- `www` and apex pointing to different hosts
- custom domain set in DNS but not in GitHub Pages settings

These failures often look similar from the browser side, which is why DNS debugging can be frustrating.

## 27. The Difference Between “The Site Loads” and “The Configuration Is Correct”

A site can appear to load and still be wrong from a production perspective.

Examples:

- HTTP works but HTTPS cert is wrong
- apex works but `www` is broken
- browser cache hides stale deployment
- wildcard DNS is unsafe even if pages load
- redirects are inconsistent

“It loads” is necessary, but not sufficient.

Correct publishing also means:

- canonical host works
- HTTPS is valid
- redirects are clean
- no unsafe or conflicting DNS leftovers remain

## 28. What GitHub Pages Does with Your Files

When your workflow deploys:

1. GitHub checks out the repository
2. GitHub Pages creates a deploy artifact
3. The artifact is published to Pages infrastructure
4. Requests to your custom domain are mapped to that deployed content

For a static site, there is no application server executing your custom backend code.

The browser gets files as-is.

## 29. Local Development vs Production

When you run:

```bash
python3 -m http.server 4173
```

you are testing locally. That means:

- files are served from your machine
- URL looks like `http://localhost:4173`
- no public DNS is involved
- no public TLS certificate is involved

Production is different:

- site is on GitHub Pages
- domain resolves globally
- HTTPS certificate is public
- anyone can visit

Local success does not automatically guarantee production correctness.

## 30. Why Browsers Show Certificate Errors

Browsers show certificate errors when they cannot safely prove the server is really the owner of the requested hostname.

Common causes:

- hostname mismatch
- expired certificate
- self-signed certificate
- wrong DNS target
- intermediate issuance delay

The browser warning is intentionally alarming because users should not casually bypass trust failures on public sites.

## 31. The Role of Redirects

Redirects are server responses that tell the browser to fetch a different URL.

They are used to:

- canonicalize `www` vs apex
- move from HTTP to HTTPS
- move pages after site restructuring

Good redirects help preserve links and user trust.

Bad redirects cause loops, mixed hostname behavior, or broken certificates.

## 32. Performance Topics You Should Know

Publishing is not just “is it online.” Performance matters.

Key factors:

- image sizes
- number of requests
- caching strategy
- compression
- DNS latency
- TLS handshake cost
- render-blocking CSS
- JavaScript execution time

Static sites usually perform well, but large images can still dominate load time.

## 33. SEO and Discoverability Basics

Even for a personal site, these concepts are useful:

- title tags
- meta description
- canonical URLs
- valid redirects
- HTTPS everywhere
- mobile friendliness

Search engines care about stable, secure, canonical pages.

## 34. Accessibility Basics

Publishing a good site also means making it usable.

Important basics:

- semantic HTML
- alt text on images
- keyboard navigation
- adequate contrast
- meaningful button labels

This is separate from networking, but it is part of “good web publishing.”

## 35. Security Beyond HTTPS

HTTPS is necessary, but not the whole story.

Other security considerations:

- avoid unnecessary third-party scripts
- keep dependencies minimal
- avoid exposing secrets in public repos
- use domain verification
- avoid unsafe wildcard DNS
- use secure headers where applicable

For a static site, your main risks are usually:

- DNS mistakes
- domain takeover scenarios
- accidental exposure of personal information

## 36. Practical Mental Model for Publishing

When publishing any website, think in layers:

### Content layer

What files or application code define the site?

### Version-control layer

Where is the source of truth? How do changes get tracked?

### Build layer

Do files need to be compiled or transformed?

### Deployment layer

How do the built files reach production?

### Hosting layer

What infrastructure serves the files?

### Naming layer

What domain should users type?

### DNS layer

How does that domain point to the host?

### TLS layer

How does the browser trust the site?

### Browser layer

How does the user’s device fetch and render the site?

If something breaks, identify which layer is failing.

## 37. Practical Checklist for a Static Site Launch

1. Site files exist and work locally
2. Repository is pushed to GitHub
3. Deployment workflow succeeds
4. GitHub Pages publishes successfully
5. Custom domain is configured in GitHub
6. Domain ownership is verified with TXT record
7. Apex domain points correctly with `ALIAS`, `ANAME`, or `A`
8. `www` points correctly with `CNAME`
9. No conflicting or wildcard records remain
10. HTTPS certificate is issued
11. Canonical domain and redirects behave correctly
12. Browser loads without warnings

## 38. Terms You Should Be Comfortable With

- domain
- registrar
- DNS provider
- authoritative nameserver
- recursive resolver
- apex domain
- subdomain
- A record
- AAAA record
- CNAME
- ALIAS / ANAME
- TXT record
- TTL
- propagation
- IP address
- TCP
- TLS
- HTTPS
- certificate
- redirect
- CDN
- deploy
- artifact
- cache

## 39. What You Actually Needed to Do for This Site

From first principles, here is why each action was required.

### Push the repo

GitHub Pages needed your site files to exist in a GitHub repository.

### Add the workflow

GitHub Pages needed a deployment mechanism to publish the files.

### Turn on Pages

GitHub needed to know this repository should produce a live site.

### Add custom domain

GitHub needed to know that requests for `lyfjosie.ca` should map to this Pages site.

### Add TXT record

GitHub needed proof that you control the domain.

### Add ALIAS for the apex

The world needed a path from `lyfjosie.ca` to GitHub Pages.

### Add `www` CNAME

The world needed a path from `www.lyfjosie.ca` to GitHub Pages.

### Enable HTTPS

Browsers needed a trusted secure way to access the site.

## 40. Recommended Cleanup for Your Current DNS

Based on your screenshot, the DNS records should likely be reduced to:

- `ALIAS` for `lyfjosie.ca` -> `yr5li.github.io`
- `CNAME` for `www.lyfjosie.ca` -> `yr5li.github.io`
- `TXT` verification record from GitHub

The wildcard record:

- `CNAME` for `*.lyfjosie.ca` -> `yr5li.github.io`

is probably unnecessary and may be causing confusion or the GitHub warning. GitHub recommends against wildcard DNS records for Pages custom domains.

## 41. Final Intuition

The web feels magical because one short name in a browser triggers a long chain of systems:

- naming
- caching
- routing
- encryption
- hosting
- application delivery
- rendering

Publishing a site is really the work of connecting those systems cleanly.

The easiest way to stay sane is to remember:

- DNS answers the question “where should this name go?”
- TLS answers the question “can I trust who answered?”
- HTTP answers the question “what resource am I requesting?”
- hosting answers the question “who serves the content?”
- deployment answers the question “how does my latest version get there?”

If you can answer those five questions for a site, you understand most of the publishing pipeline.

## Sources

- GitHub Pages custom domain management: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages troubleshooting: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages
- GitHub Pages domain verification: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- GitHub Pages HTTPS: https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- About custom domains and GitHub Pages: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- Porkbun DNS help: https://kb.porkbun.com/article/231-how-to-add-dns-records-on-porkbun
