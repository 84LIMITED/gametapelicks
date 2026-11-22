# SEO and GEO guide for Gametape Licks

SEO is ranking in search results. GEO is getting cited when ChatGPT, Claude, Perplexity, Gemini or Google's AI answers explain a guitar topic. Both start with the same thing: pages that answer a real question clearly, on a site other people link to.

Note: the site started as public but unpromoted. This guide assumes that has changed and the goal is now to be found.

## What the build already does

`npm run build` handles these for every page, so you do not repeat them by hand.

- A unique `<title>` and meta description, a canonical URL, and `index, follow` robots meta.
- Open Graph and Twitter tags.
- JSON-LD: Organization and WebSite on the home page, Article and BreadcrumbList on lessons, BreadcrumbList on list pages.
- `sitemap.xml` with `lastmod` taken from each lesson's `updated` date.
- `robots.txt` that allows crawling and points to the sitemap.
- `llms.txt`, generated from the lessons and topics.
- A visible "Updated" date on each lesson.
- Topics with no published lesson stay out of the site, which avoids thin pages.

`npm test` fails when a title runs over 70 characters, a description falls outside 40 to 175, a title repeats, a canonical is wrong, JSON-LD does not parse, or a lesson lacks a `#faq` section.

## Per-lesson checklist

Fill these in `lesson.json` and `body.html` for every new lesson.

1. `seoTitle`: under 65 characters. Lead with the thing a player would type into a search box, then the brand. Example: "Hunting for 3rds: Major and Minor 3rds on Guitar | Gametape Licks".
2. `description`: 70 to 170 characters. Say what the lesson teaches and what the player gets.
3. `intro`: the first paragraph answers the main question in two or three sentences. Search engines and AI answers lift this text.
4. Headings that match questions people ask ("Where is the 3rd on the guitar neck?").
5. A `#faq` section ("Quick answers") with four to six short Q&A cards. Each answer stands alone in two or three sentences.
6. `published` and `updated` dates. Change `updated` only when the lesson content changes.
7. Link to related lessons from the body, using descriptive link text.
8. Alt text or a text caption for every diagram.

## Target queries

Write lessons around these, one main query per lesson.

- how to find the 3rd on guitar
- chord tone soloing guitar
- target 3rds guitar solo
- Trey Anastasio soloing lesson
- 12 bar blues soloing over changes
- Mixolydian vs blues guitar soloing
- how to solo over chord changes

Check the results page for each query before writing. Note what the top results cover and what they leave out. The gap is the lesson's angle: the why and the pattern recognition.

## Off-site work (this is where most of the gain is)

The build cannot do these. Put them on a calendar.

1. Verify the domain in Google Search Console and Bing Webmaster Tools. Submit `https://gametapelicks.com/sitemap.xml` in both. Bing feeds several AI search products, so it matters.
2. Add a real author. Fill `author` in `src/site.json` with a name and URL, and write a short bio on the About page that says who teaches these lessons and why they can. People and AI systems both weigh who is behind a page.
3. Add `sameAs` profile links (YouTube, Instagram, Reddit profile) to `org.sameAs` in `src/site.json`.
4. Earn mentions. Post useful answers, with a link only where it helps, in r/guitar, r/Phish, r/jamband, Phish and Trey forums, and guitar Discords. Share lessons with teachers and bloggers who cover the same ground. Third-party mentions are the best supported driver of AI citations.
5. Publish a YouTube walkthrough per lesson and link it from the page. Video results appear in both search and AI answers.
6. Keep lessons fresh. Revisit each one every few months, improve it, and bump `updated`.

## Robots policy for AI crawlers

AI crawlers fall into groups. The current `robots.txt` allows all of them.

| Group | Examples | Effect of blocking |
| --- | --- | --- |
| Search indexers | OAI-SearchBot, Claude-SearchBot, PerplexityBot | Your pages stop appearing in those products' answers |
| User fetchers | ChatGPT-User, Claude-User | A user who pastes your link cannot get it read |
| Training bots | GPTBot, ClaudeBot | Your text stays out of future model training |
| Training-control tokens | Google-Extended, Applebot-Extended | Keeps content out of Gemini and Apple model training; search ranking is unaffected |

Decide once. A common choice for a site that wants citations and wants to keep its lessons out of training data is to allow the first two groups and disallow the last two. To do that, add blocks like this to `robots.txt` in `scripts/build.mjs`:

```
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```

Robots rules are requests that well-behaved crawlers honor. They do not enforce anything.

## What is proven and what is not

- Proven: clear titles, useful content, crawlable pages, fast load, mobile layout, and links from other sites help search ranking.
- Google states that no special markup is needed to appear in its AI features. Article and Breadcrumb data can earn rich results. FAQ and HowTo markup no longer produce rich results in Google, which is why the FAQ section here is visible text and carries no FAQ schema.
- Unproven: that JSON-LD, `llms.txt` or FAQ sections raise how often AI tools cite a site. They cost little and help readers, so they stay in, with no promise attached.

## Measurement

- Search Console: impressions, clicks and average position per query, weekly.
- Analytics: watch referrals from chatgpt.com, perplexity.ai, claude.ai, gemini.google.com and copilot.microsoft.com.
- Monthly prompt test: ask ChatGPT, Claude, Perplexity and Gemini each target query. Record whether Gametape Licks appears, which page, and which sources appear instead. Keep the log in `docs/seo-log.md`.
- Review after 90 days. Double down on lessons that earn impressions and rewrite the ones that do not.
