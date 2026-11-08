"""Exercise the static site at a subdirectory, including real offline reloads.

Build first, serve second_brain with http.server on 8002, then run this script.
Embeddings are mocked; the test does not download a model or validate its quality.
"""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from test_app import sample_pdf

base = os.getenv("BRAM_PUBLIC_TEST_URL", "http://127.0.0.1:8002/dist/")
artifacts = Path('/workspace/bram-artifacts')
artifacts.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    errors, requests = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))
    page.goto(base)
    expect(page.locator('#sample-notes')).to_be_visible()
    page.locator('#sample-notes').click()
    expect(page.locator('.document-card')).to_have_count(4)
    page.locator('#capture').click()
    page.locator('#doc-title').fill('An orchard of ideas')
    page.locator('#doc-content').fill('Apples and fruit grow in orchards. [[Learning is a practice of returning]]')
    page.locator('#doc-tags').fill('learning, fruit')
    page.locator('#save-doc').click()
    expect(page.locator('.document-card')).to_have_count(5)
    page.locator('#import-input').set_input_files({'name': 'research.pdf', 'mimeType': 'application/pdf', 'buffer': sample_pdf()})
    expect(page.locator('.document-card')).to_have_count(6, timeout=20000)
    page.locator('#search').fill('Retrieval')
    expect(page.locator('.document-card')).to_have_count(1)
    expect(page.locator('.document-card h2')).to_have_text('research')
    page.locator('#search').fill('')
    page.get_by_role('button', name='Connections', exact=True).click()
    expect(page.locator('.connection-row')).not_to_have_count(0)
    expect(page.locator('.connections-list')).to_contain_text('Linked with [[title]]')
    page.screenshot(path=str(artifacts/'bram-connections.png'), full_page=True)
    page.locator('[data-view="chat"]').click()
    page.locator('#question').fill('fruit')
    page.locator('#ask-button').click()
    expect(page.locator('.chat-message.assistant')).to_contain_text('Source excerpts · no AI generation')
    expect(page.locator('.source-link')).to_have_count(1)
    page.locator('#chat-settings').click()
    expect(page.locator('#model-status')).to_contain_text('Browser AI')
    with page.expect_download() as downloaded:
        page.get_by_role('link', name='Export library').click()
    backup_path=artifacts/'public-test-backup.json'
    downloaded.value.save_as(backup_path)
    backup=json.loads(backup_path.read_text())
    assert len(backup['documents'])==6
    assert any(d['attachment_base64'] for d in backup['documents'])
    page.locator('#restore-input').set_input_files(backup_path)
    expect(page.locator('#toast')).to_contain_text('6 existing items kept')

    # Explicit model-download consent; a deterministic fake tests ranking and invalidation.
    context.route('**/embeddings.js', lambda route: route.fulfill(content_type='text/javascript',body="export async function embed(texts){return texts.map(t=>/apple|fruit|orchard/i.test(t)?[1,0]:[0,1]);}"))
    page.on('dialog', lambda dialog: dialog.accept())
    page.locator('#build-index').click()
    expect(page.locator('#toast')).to_contain_text('up to date',timeout=15000)
    page.locator('[data-view="library"]').click()
    page.locator('#search-mode').select_option('semantic')
    page.locator('#search').fill('fruit')
    expect(page.locator('.document-card h2').first).to_have_text('An orchard of ideas')
    page.locator('#search-mode').select_option('text')
    page.locator('#search').fill('')
    expect(page.locator('.document-card')).to_have_count(6)
    await_ready="navigator.serviceWorker.ready.then(()=>true)"
    assert page.evaluate(await_ready)
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    context.set_offline(True)
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('.document-card')).to_have_count(6)
    page.locator('#capture').click()
    page.locator('#doc-title').fill('An offline thought')
    page.locator('#doc-content').fill('Saved with the network disconnected.')
    page.locator('#save-doc').click()
    expect(page.locator('.document-card')).to_have_count(7)
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('.document-card')).to_have_count(7)
    page.screenshot(path=str(artifacts/'bram-public-offline.png'),full_page=True)
    context.set_offline(False)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('#capture').click()
    expect(page.locator('#editor')).to_be_visible()
    page.locator('#editor .close-dialog').first.click()
    assert not any('/api/' in url for url in requests), requests
    assert not any('huggingface.co' in url for url in requests), 'Model weights were downloaded without explicit test setup'
    assert not errors, errors
    other=browser.new_context()
    other_page=other.new_page()
    other_page.goto(base)
    expect(other_page.locator('#stat-total')).to_have_text('0')
    other.close()
    browser.close()
    print('Public browser smoke passed: private storage, PDF extraction, connections, source answers, backup/restore, mocked semantic search, offline create/reload, mobile and profile isolation. No document API calls.')
