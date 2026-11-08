# B-Ram: free website deployment

The public edition is a static website. Documents and original files are saved in each visitor's IndexedDB database. There is no shared document server, API key, account, or server-side LLM bill. The Python/SQLite edition remains available for local desktop use.

## Build

Requires Node.js 24 and npm:

```bash
cd second_brain
npm ci
npm run build
```

Deploy **only `dist/`**. Never deploy the repository root, `data/`, test artifacts, or personal backups. The build copies an explicit list of application files and bundled runtime assets. `.npmrc` disables dependency lifecycle scripts because this browser target does not use the native ONNX runtime; esbuild uses its npm-distributed platform binary.

## GitHub Pages

GitHub Pages is free for public repositories on GitHub Free. The existing `kallurayaankit/research-agent` repository is public. A branch named **`bram-site`** can contain the generated site at its root.

In the repository's **Settings → Pages**, choose:

1. **Deploy from a branch**.
2. Branch **`bram-site`**, folder **`/ (root)`**.
3. Save. Wait for the Pages build/deployment to complete.

The expected address is `https://kallurayaankit.github.io/research-agent/`. This address is not proof of a completed deployment; verify that it responds successfully and renders B-Ram after Pages is enabled. GitHub provides the HTTPS subdomain; a purchased custom domain is not required.

The deployment script refuses to overwrite an existing remote branch without fetching and extending its history. It publishes only generated output. Source development stays on the separate `bram-app` branch.

```bash
python scripts/deploy_pages.py
```

Git push access and GitHub API access are separate. If API access is blocked, uploading the branch does not enable Pages. Enable it in GitHub's settings, or grant this environment access to `api.github.com` and `kallurayaankit.github.io` so the agent can configure and verify it. The existing Git proxy handles Git operations; no token belongs in this code or the browser.

## Other free static hosts

The same `dist/` folder can be uploaded to a free static hosting project. There are no server functions or build-time secrets. Use HTTPS so IndexedDB, service workers, and browser AI have a secure context. Provider account authentication and their current plan limits still apply.

## Advanced features and their limits

| Feature | Implementation | Limits |
| --- | --- | --- |
| Offline app | Installable web manifest and versioned service-worker cache | Open once online; browser controls installation. Models must be downloaded before offline AI. |
| Private local library | IndexedDB documents, attachments, vectors, and review state | Per browser profile and website origin. Clearing site data deletes it. Export backups. |
| Local semantic search | Quantized MiniLM with Hugging Face Tokenizers and ONNX WebAssembly | Opt-in model download from Hugging Face; CPU/memory and storage required. |
| Hybrid retrieval | BM25-style keyword scores + reciprocal-rank fusion of vector matches | Exact scans suit personal libraries; large collections need a vector index. |
| Connections map | Explicit `[[Note title]]` links, shared tags, and semantic matches | Shows 60 recently updated items; semantic matches require an index. |
| Browser AI | Feature-detected experimental Prompt API; cited retrieval context | Browser/hardware support varies. No general availability claim. Without a model, answers show clearly labelled source excerpts. |
| Portable backups | Same JSON format as the Python edition, with attachments | Manual transfer, not two-way sync. Existing IDs are preserved on restore. |

The website never sends document content to an app API or model endpoint. Model-file downloads still contact Hugging Face, and the website host receives ordinary request metadata. Browser-provided AI processing is governed by the browser implementation; verify that it provides on-device processing before enabling it. Content in the library is not published with the website.

## Validation

Run the backend suite with `python -m pytest -q`. For the public browser test:

```bash
python -m http.server 8002 --bind 127.0.0.1
# In another terminal, using the development Python environment:
python tests/public_browser_smoke.py
```

The public test covers a subdirectory deployment, PDF text extraction, captures, search, graph links, source excerpts, backup/restore, semantic ranking with deterministic mock embeddings, actual offline create/reload, mobile layout, and isolation between browser profiles. Mock vectors do not validate downloaded model quality; live browser-native generation requires a supported device.

`python tests/embedding_runtime_smoke.py` additionally executes the real browser tokenizer and ONNX WebAssembly runtime with the tiny synthetic encoder in `tests/fixtures/tiny_encoder.onnx`. It validates padded batching, pooling, and normalization without external downloads. The fixture is an integration test, not a language model. Live MiniLM downloads and native browser-AI output remain separate checks.

## Sources checked for this release

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): static hosting and `github.io` addresses.
- [GitHub's Pages plan availability source](https://github.com/github/docs/blob/main/data/reusables/gated-features/pages.md): free hosting for public repositories.
- [Prompt API explainer](https://github.com/webmachinelearning/prompt-api): experimental availability, feature detection, session lifecycle, and current limitations.
- [Hugging Face Tokenizers](https://github.com/huggingface/tokenizers.js) and [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/): browser tokenization and inference; this release pins the npm dependencies in `package-lock.json`.

These are practical current additions, not features assumed to work merely because the year is 2026. Automatic encrypted sync, OCR, multimodal retrieval, and passkeys would require additional design and validation.
