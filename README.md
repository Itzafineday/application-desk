# Application Desk

A job application tracker in a single HTML page.

- Paste a LinkedIn posting (or just its link) and the company, role, location,
  pay band and posted date are pulled out for you. Duplicates are caught by URL.
- Track each job through queued, working, applied, interview, offer and closed,
  with a fit score and notes.
- Draft and edit a cover letter per job, fix em dashes in one click, and save
  it as a one-page PDF.
- Keep a question thread per job for an AI assistant to answer.

It runs as a [Claude](https://claude.ai) artifact: the jobs live in the
artifact's shared database, so Claude can read the queue, score postings,
draft letters and answer questions, and the page updates live.

## Try it
Serve the `public` folder and open it in a browser. Outside claude.ai the page
runs as a demo with fictional jobs, and nothing is saved.

```
npx serve public
```

or, with Python: `python -m http.server 4310 --directory public`. Opening
`index.html` straight from disk won't work, because browsers block it from
reading the sample data.

Status: early. See [docs/roadmap.md](docs/roadmap.md) for what's next and
[docs/schema.md](docs/schema.md) for the data model.

## Contributing
Read [AGENTS.md](AGENTS.md) first: it covers the privacy rules and the
pre-commit hook, for people and AI agents alike. Run the tests with
`node --test` (Node 18 or later, nothing to install).

## License
[MIT](LICENSE)
