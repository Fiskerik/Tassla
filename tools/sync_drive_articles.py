"""Reviewed Drive DOCX -> Tassla article payloads. Python stdlib + system openssl only."""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

MAX_BYTES = 4_000_000
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'
DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
NATIVE = 'application/vnd.google-apps.document'
BUNDLE = Path(__file__).resolve().parents[1] / 'docs/content/artiklar/drive-articles-v1.json'
ALLOWED = {'metadata_schema_version', 'article_key', 'version', 'Format', 'Appsektion',
           'min_age_weeks', 'max_age_weeks', 'Rasurval', 'breed_ids', 'Ämneskategori',
           'topic_code', 'Händelsekrav', 'event_offset_start_days', 'event_offset_end_days',
           'Redaktionell avgränsning', 'Sakgranskning', 'review_reference', 'reviewed_at',
           'Publiceringsstatus', 'is_ai_generated'}
RULE_FIELDS = {'rule_key', 'min_age_weeks', 'max_age_weeks', 'Händelsekrav',
               'event_offset_start_days', 'event_offset_end_days', 'Nivå'}


class ValidationError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise ValidationError(message)


def text(node):
    return ''.join((n.text or '') if n.tag == W + 't' else ' ' for n in node.iter() if n.tag in (W + 't', W + 'tab', W + 'br', W + 'cr')).strip()


def integer(value, optional=False):
    if optional and value in ('', 'null'):
        return None
    require(bool(re.fullmatch(r'-?\d+', value)), 'Invalid integer metadata')
    return int(value)


def document(data):
    require(len(data) <= MAX_BYTES, 'DOCX too large')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        require(len(entries) <= 300 and sum(e.file_size for e in entries) <= 12_000_000, 'Expanded DOCX too large')
        require(all(e.file_size <= max(1, e.compress_size) * 200 for e in entries), 'Excessive ZIP compression')
        require(not any('embeddings/' in e.filename or 'media/' in e.filename for e in entries), 'Embedded media unsupported')
        require(len({e.filename for e in entries}) == len(entries), 'Duplicate ZIP entries')
        raw = archive.read('word/document.xml')
        require(b'<!DOCTYPE' not in raw.upper() and b'<!ENTITY' not in raw.upper(), 'XML entities unsupported')
        root = ET.fromstring(raw)
    body = root.find('w:body', NS)
    require(body is not None, 'Missing document body')
    tables, paragraphs = [], []
    for node in body:
        if node.tag == W + 'tbl':
            fields = {}
            for row in node.findall('w:tr', NS):
                cells = row.findall('w:tc', NS)
                values = [text(cell) for cell in cells]
                if len(values) == 1 or (len(values) == 2 and values[0] == values[1]):
                    require('METADATA' in values[0].upper() or 'MÅLGRUPP' in values[0].upper(), 'Unknown table heading')
                    continue
                require(len(values) == 2 and values[0] not in fields, 'Duplicate or malformed metadata field')
                fields[values[0]] = values[1]
            tables.append(fields)
        elif node.tag == W + 'p':
            value = text(node)
            if not value:
                continue
            require(not node.findall('.//w:drawing', NS) and not node.findall('.//w:object', NS), 'Unsupported article object')
            style_node = node.find('w:pPr/w:pStyle', NS)
            style = style_node.get(W + 'val', '') if style_node is not None else ''
            # Only external HTTPS hyperlinks are representable as plain text here.
            require(not node.findall('.//w:hyperlink', NS), 'Move hyperlinks to the Källor section as plain HTTPS URLs')
            require(len(value) <= 15000, 'Article paragraph too long')
            paragraphs.append((style, value))
        else:
            require(node.tag == W + 'sectPr', 'Unsupported document structure')
    require(tables and paragraphs, 'Metadata and article text required')
    return tables, paragraphs


def rule(fields, key):
    event = fields.get('Händelsekrav', 'none')
    require(event in ('none', 'expected_homecoming'), 'Unsupported event requirement')
    minimum = integer(fields['min_age_weeks'])
    maximum = integer(fields['max_age_weeks'], True)
    start = integer(fields.get('event_offset_start_days', ''), True)
    end = integer(fields.get('event_offset_end_days', ''), True)
    require(minimum >= 0 and (maximum is None or maximum >= minimum), 'Invalid age interval')
    require((event == 'none' and start is None and end is None) or
            (event == 'expected_homecoming' and start is not None and end is not None and -365 <= start <= end <= 0), 'Invalid event window')
    require(bool(re.fullmatch(r'[a-z][a-z0-9_]{0,63}', key)), 'Invalid rule key')
    return dict(rule_key=key, min_age_weeks=minimum, max_age_weeks=maximum,
                event_kind=event, start_days=start, end_days=end)


def parse_docx(data, source_id, modified_at, approved=None):
    tables, paragraphs = document(data)
    fields = tables[0]
    require(set(fields) <= ALLOWED, 'Unknown metadata field')
    require(fields.get('Format') == 'Artikel' and fields.get('Appsektion') == 'Kunskap', 'Unsupported content type')
    source_hash = hashlib.sha256(data).hexdigest()
    if approved is not None:
        require(source_id == approved['source_id'] and source_hash == approved['source_hash'], 'Approved source fingerprint differs')
    else:
        require(fields.get('metadata_schema_version') == '1', 'Metadata schema version 1 required')
        # Native exports can differ at ZIP level without a document edit. Hash the
        # parsed source structure for the new metadata contract instead.
        source_hash = hashlib.sha256(json.dumps([tables, paragraphs], ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()).hexdigest()
        require(integer(fields.get('version', '1')) >= 1, 'Invalid editorial version')
        require(fields.get('Sakgranskning') == 'Godkänd' and fields.get('Publiceringsstatus') == 'Publicera', 'Article not ready for publication')
        require(fields.get('is_ai_generated') in ('true', 'false'), 'Explicit AI origin required')
        require(fields.get('review_reference') and fields.get('reviewed_at'), 'Review evidence required')
    title, parts, refs, sources = None, [], [], []
    section = 'body'
    editorial = fields.get('Redaktionell avgränsning', '')
    for style, value in paragraphs:
        if value.startswith('Redaktionell avgränsning'):
            if not editorial:
                editorial = value.partition(':')[2].strip()
            continue
        if value.upper().replace(' ', '') == 'TASSLA/KUNSKAP':
            continue
        if title is None:
            require(style.lower() in ('rubrik', 'title', 'titel', 'heading1', 'rubrik1'), 'Article title must use Title or Heading 1')
            title = value
            continue
        if value.casefold() in ('läs mer', 'källor'):
            section = 'refs' if value.casefold() == 'läs mer' else 'sources'
            continue
        if section == 'refs':
            refs.append(value)
            continue
        if section == 'sources':
            require(value.startswith('https://') and not any(c.isspace() for c in value), 'Sources must be plain HTTPS URLs')
            sources.append(value)
            continue
        heading = {'rubrik2': '## ', 'heading2': '## ', 'rubrik3': '### ', 'heading3': '### '}.get(style.lower())
        if heading:
            parts.append(heading + value)
        elif value.startswith(('Tips: ', 'Viktigt: ')):
            parts.append('> ' + value)
        elif style.lower() in ('punktlista', 'listbullet'):
            parts.append('- ' + value)
        else:
            require(style.lower() in ('', 'normal', 'bodytext', 'brödtext'), 'Unsupported paragraph style')
            require(node_safe(value), 'Unsupported Markdown in paragraph')
            parts.append(value)
    require(title and len(title) <= 160 and parts, 'Article title/body required')
    body = '\n\n'.join(parts)
    require(len(body) <= 100000, 'Article text too large')
    tokens = re.findall(r'\{\{[^}]*\}\}', body + title)
    require(not tokens, 'Dog-specific article personalization is unsupported')
    if approved:
        result = dict(approved)
        for key in ('body', 'title', 'related_source_refs'):
            result[key] = {'body': body, 'title': title, 'related_source_refs': refs}[key]
        require(result['body'] == approved['body'] and result['title'] == approved['title'], 'Approved app conversion differs')
        return result
    breeds = [b.strip() for b in fields.get('breed_ids', '').split(',') if b.strip()]
    require((fields.get('Rasurval') == 'Alla raser' and not breeds) or
            (fields.get('Rasurval') == 'Utvalda raser' and bool(breeds)), 'Ambiguous breed selection')
    require(len(set(breeds)) == len(breeds) and all(re.fullmatch(r'[a-z0-9_-]{1,100}', b) for b in breeds), 'Invalid breed IDs')
    require(fields.get('topic_code') in ('homecoming_first_day', 'house_training', 'puppy_sleep', 'general'), 'Unknown topic code')
    require(bool(re.fullmatch(r'[a-z][a-z0-9-]{1,100}', fields.get('article_key', ''))), 'Invalid article key')
    rules = [rule(fields, 'primary')]
    for extra in tables[1:]:
        require(set(extra) == RULE_FIELDS and extra['Nivå'] in ('primary', 'secondary'), 'Invalid additional audience group')
        rules.append(rule(extra, extra['rule_key']))
    require(len(rules) <= 10 and len({r['rule_key'] for r in rules}) == len(rules), 'Duplicate/too many audience rules')
    return dict(source_id=source_id, source_hash=source_hash, modified_at=modified_at,
                slug=fields['article_key'], title=title, body=body,
                min_age_weeks=integer(fields['min_age_weeks']), max_age_weeks=integer(fields['max_age_weeks'], True),
                breed_ids=breeds, topic_code=fields['topic_code'], editorial_scope=editorial,
                related_source_refs=refs, rules=rules, review_reference=fields['review_reference'],
                reviewed_at=fields['reviewed_at'], is_ai_generated=fields['is_ai_generated'] == 'true', sources=sources)


def node_safe(value):
    return not value.startswith(('#', '<', '|', '```')) and '![' not in value and '](' not in value


class SafeHTTPError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SafeHTTPError('Unexpected redirect')


def request(url, token=None, data=None, content_type='application/json'):
    headers = {'Accept': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if data is not None:
        headers['Content-Type'] = content_type
    try:
        with urllib.request.build_opener(NoRedirect).open(urllib.request.Request(url, headers=headers, data=data), timeout=45) as response:
            raw = response.read(MAX_BYTES + 1)
            require(len(raw) <= MAX_BYTES, 'Response too large')
            return raw
    except urllib.error.HTTPError as error:
        # Never print API error bodies, credentials, filenames, or document text.
        raise SafeHTTPError('Remote request failed: HTTP ' + str(error.code)) from None


def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=')


def google_token():
    account = json.loads(os.environ['GOOGLE_DRIVE_SERVICE_ACCOUNT'])
    now = int(time.time())
    claims = dict(iss=account['client_email'], scope='https://www.googleapis.com/auth/drive.readonly',
                  aud='https://oauth2.googleapis.com/token', iat=now, exp=now + 3600)
    message = b'.'.join(b64(json.dumps(x, separators=(',', ':')).encode()) for x in ({'alg': 'RS256', 'typ': 'JWT'}, claims))
    with tempfile.NamedTemporaryFile(mode='w', prefix='tassla-google-', delete=True) as key:
        os.chmod(key.name, 0o600)
        key.write(account['private_key'])
        key.flush()
        signed = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', key.name], input=message, capture_output=True, check=True).stdout
    assertion = (message + b'.' + b64(signed)).decode()
    raw = request('https://oauth2.googleapis.com/token', data=urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': assertion}).encode(),
        content_type='application/x-www-form-urlencoded')
    return json.loads(raw)['access_token']


def validate_endpoint(endpoint, approved_project_ref):
    # The exact project ref is pinned in the protected environment, separately
    # from the configurable URL. Never transmit the token to another project.
    require(bool(re.fullmatch(r'[a-z0-9]{20}', approved_project_ref)), 'Invalid approved project ref')
    require(endpoint == 'https://' + approved_project_ref + '.supabase.co/functions/v1/sync-drive-article', 'Importer endpoint differs from approved project')


def sync():
    folder = os.environ['GOOGLE_DRIVE_ARTICLES_FOLDER_ID']
    require(bool(re.fullmatch(r'[A-Za-z0-9_-]{10,160}', folder)), 'Invalid folder ID')
    endpoint = os.environ['ARTICLE_SYNC_URL']
    validate_endpoint(endpoint, os.environ['ARTICLE_SYNC_PROJECT_REF'])
    token = google_token()
    originals = {item['source_id']: item for item in json.loads(BUNDLE.read_text())}
    files, page = [], None
    while True:
        query = {'q': "'" + folder + "' in parents and trashed = false", 'pageSize': 100,
                 'fields': 'nextPageToken,files(id,mimeType,modifiedTime)', 'supportsAllDrives': 'true', 'includeItemsFromAllDrives': 'true'}
        if page:
            query['pageToken'] = page
        result = json.loads(request('https://www.googleapis.com/drive/v3/files?' + urllib.parse.urlencode(query), token))
        files.extend(result.get('files', []))
        require(len(files) <= 200, 'Too many source documents')
        page = result.get('nextPageToken')
        if not page:
            break
    failures = 0
    for file in files:
        try:
            file_id = file['id']
            require(bool(re.fullmatch(r'[A-Za-z0-9_-]{10,160}', file_id)), 'Invalid Drive file ID')
            mime = file['mimeType']
            if mime not in (DOCX, NATIVE):
                continue
            base = 'https://www.googleapis.com/drive/v3/files/' + file_id
            suffix = '/export?' + urllib.parse.urlencode({'mimeType': DOCX}) if mime == NATIVE else '?alt=media&supportsAllDrives=true'
            data = request(base + suffix, token)
            # Detect a concurrent edit before submitting a snapshot.
            current = json.loads(request(base + '?fields=modifiedTime,parents,trashed&supportsAllDrives=true', token))
            require(not current.get('trashed') and folder in current.get('parents', []) and current['modifiedTime'] == file['modifiedTime'], 'Source changed during read')
            approved = originals.get(file_id)
            if approved and hashlib.sha256(data).hexdigest() != approved['source_hash']:
                approved = None
            payload = parse_docx(data, file_id, file['modifiedTime'], approved)
            request(endpoint, os.environ['ARTICLE_SYNC_TOKEN'], json.dumps({'article': payload}, ensure_ascii=False).encode())
            print('Article sync OK:', file_id)
        except (ValueError, KeyError, zipfile.BadZipFile, ET.ParseError, SafeHTTPError) as error:
            failures += 1
            print('Article sync failed:', file.get('id', 'unknown'), str(error) if isinstance(error, ValidationError) else type(error).__name__)
    require(not failures, str(failures) + ' article import(s) failed; last published versions retained')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--docx', type=Path)
    parser.add_argument('--source-id')
    parser.add_argument('--modified-at')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--sync', action='store_true')
    args = parser.parse_args()
    if args.sync:
        sync()
    else:
        require(args.docx and args.source_id and args.modified_at and args.output, 'Provide docx, source-id, modified-at and output')
        approved = next((x for x in json.loads(BUNDLE.read_text()) if x['source_id'] == args.source_id and x['source_hash'] == hashlib.sha256(args.docx.read_bytes()).hexdigest()), None)
        value = parse_docx(args.docx.read_bytes(), args.source_id, args.modified_at, approved)
        args.output.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, SafeHTTPError, OSError, subprocess.SubprocessError) as failure:
        raise SystemExit('Article sync stopped: ' + type(failure).__name__) from None
