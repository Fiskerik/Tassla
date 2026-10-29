import tomllib
import importlib.util
import hashlib
import io
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sync', ROOT / 'tools/sync_drive_articles.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


def source(fields=None, duplicate=False, paragraph='När valpen kommer hem behöver den vila.'):
    values = {'metadata_schema_version': '1', 'Format': 'Artikel', 'Appsektion': 'Kunskap',
              'article_key': 'synthetic-article', 'min_age_weeks': '6', 'max_age_weeks': '52',
              'Rasurval': 'Alla raser', 'breed_ids': '', 'topic_code': 'general',
              'Händelsekrav': 'expected_homecoming', 'event_offset_start_days': '-7', 'event_offset_end_days': '0',
              'Sakgranskning': 'Godkänd', 'Publiceringsstatus': 'Publicera',
              'review_reference': 'synthetic-review-1', 'reviewed_at': '2026-10-24T00:00:00Z', 'is_ai_generated': 'false'}
    values.update(fields or {})
    body = ET.Element(sync.W + 'body')
    table = ET.SubElement(body, sync.W + 'tbl')
    for key, value in list(values.items()) + ([('article_key', 'duplicate')] if duplicate else []):
        row = ET.SubElement(table, sync.W + 'tr')
        for cell in (key, value):
            tc = ET.SubElement(row, sync.W + 'tc')
            p = ET.SubElement(tc, sync.W + 'p')
            ET.SubElement(ET.SubElement(p, sync.W + 'r'), sync.W + 't').text = cell
    for style, value in [('Title', 'Syntetisk artikel'), ('Normal', paragraph), ('Heading2', 'Läs mer'), ('ListBullet', 'missing_editorial_ref')]:
        p = ET.SubElement(body, sync.W + 'p')
        ET.SubElement(ET.SubElement(p, sync.W + 'pPr'), sync.W + 'pStyle').set(sync.W + 'val', style)
        ET.SubElement(ET.SubElement(p, sync.W + 'r'), sync.W + 't').text = value
    root = ET.Element(sync.W + 'document')
    root.append(body)
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as archive:
        archive.writestr('word/document.xml', ET.tostring(root))
    return output.getvalue()


class DriveArticles(unittest.TestCase):
    def parse(self, data):
        return sync.parse_docx(data, 'synthetic_drive_file_01', '2026-10-24T00:00:00Z')

    def test_readable_body_preserves_generic_copy_and_separates_metadata(self):
        article = self.parse(source())
        self.assertEqual(article['body'], 'När valpen kommer hem behöver den vila.')
        self.assertNotIn('{{dog.', article['body'])
        self.assertNotIn('METADATA', article['body'])
        self.assertNotIn('missing_editorial_ref', article['body'])
        self.assertEqual(article['related_source_refs'], ['missing_editorial_ref'])
        self.assertEqual(article['rules'][0]['start_days'], -7)
        self.assertFalse(article['is_ai_generated'])

    def test_word_tips_preserve_reviewed_text_as_explicit_callouts(self):
        result = self.parse(source(paragraph='Tips: Låt valpen vila ostört.'))
        self.assertEqual(result['body'], '> Tips: Låt valpen vila ostört.')

    def test_dog_specific_personalization_tokens_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Dog-specific article personalization'):
            self.parse(source(paragraph='När {{dog.name}} kommer hem behöver den vila.'))

    def test_metadata_fails_closed(self):
        for fields in ({'Publiceringsstatus': 'Utkast'}, {'Sakgranskning': ''}, {'new_unknown_field': 'x'},
                       {'min_age_weeks': '60'}, {'event_offset_end_days': '1'}, {'is_ai_generated': ''},
                       {'Rasurval': 'Utvalda raser'}, {'Händelsekrav': 'homecoming'}):
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                self.parse(source(fields))
        with self.assertRaises(ValueError):
            self.parse(source(duplicate=True))
        with self.assertRaises(ValueError):
            self.parse(source(paragraph='{{dog.guess_health}}'))

    def test_archive_and_unsupported_structures_fail_closed(self):
        with self.assertRaises(ValueError):
            self.parse(b'x' * (sync.MAX_BYTES + 1))
        for raw in (b'<!DOCTYPE doc><document/>', b'<!ENTITY external SYSTEM "https://example.invalid">'):
            output = io.BytesIO()
            with zipfile.ZipFile(output, 'w') as archive:
                archive.writestr('word/document.xml', raw)
            with self.assertRaises(ValueError):
                self.parse(output.getvalue())

    def test_endpoint_is_pinned_to_protected_project(self):
        project = 'abcdefghijklmnopqrst'
        sync.validate_endpoint('https://' + project + '.supabase.co/functions/v1/bright-task', project)
        for endpoint in ('https://otherotherotherother.supabase.co/functions/v1/bright-task',
                         'https://evil.example/functions/v1/bright-task',
                         'http://' + project + '.supabase.co/functions/v1/bright-task',
                         'https://' + project + '.supabase.co/functions/v1/sync-drive-article',
                         'https://' + project + '.supabase.co/functions/v1/bright-task?query=1',
                         'https://' + project + '.supabase.co/functions/v1/bright-task#fragment',
                         'https://user@' + project + '.supabase.co/functions/v1/bright-task',
                         'https://' + project + '.supabase.co:443/functions/v1/bright-task',
                         'https://' + project + '.supabase.co/functions/v1/bright-task/'):
            with self.assertRaises(ValueError):
                sync.validate_endpoint(endpoint, project)

    def test_deployed_function_names_resolve_to_distinct_source_entries(self):
        config = tomllib.loads((ROOT / 'supabase/config.toml').read_text())['functions']
        self.assertEqual(set(config), {'swift-api', 'bright-task'})
        for name, folder, verify_jwt in [('swift-api', 'delete-account', True), ('bright-task', 'sync-drive-article', False)]:
            self.assertEqual(config[name]['verify_jwt'], verify_jwt)
            self.assertEqual(config[name]['entrypoint'], './functions/' + folder + '/index.ts')
            self.assertTrue((ROOT / 'supabase' / config[name]['entrypoint']).is_file())
            self.assertTrue((ROOT / 'supabase/functions' / folder / 'handler.ts').is_file())

    def test_initial_migration_exactly_matches_three_reviewed_payloads(self):
        values = json.loads(sync.BUNDLE.read_text())
        sql = (ROOT / 'supabase/migrations/202610250001_article-review-revisions.sql').read_text()
        self.assertEqual(len(values), 3)
        source_copy_fingerprints = {
            'forsta-dygnet-hemma': '1f06f169d0260d72c128f897d33ccff8e4f338d3edeca957e35454c9d6f27d47',
            'rumsrenhet': '49b370eb1230ec4addb52537040de1de0188c726ebcd4bc2bf2d660638990174',
            'valpens-somn': 'b89cf1a5b2055ba712cdd5109d2cf84cdbd81125dd070493eaeddb7ed03da304',
        }
        for article in values:
            self.assertIn(json.dumps(article, ensure_ascii=False, separators=(',', ':')), sql)
            self.assertNotIn('{{dog.', article['body'])
            digest = hashlib.sha256(article['title'].encode() + b'\0' + article['body'].encode()).hexdigest()
            self.assertEqual(digest, source_copy_fingerprints[article['slug']])
            self.assertTrue(article['review_reference'].startswith('owner-confirmed:2026-10-25:restore-original-generic-copy:'))
            self.assertFalse(article['is_ai_generated'])
        self.assertIn('hur mycket den sover och när på dygnet den brukar vila', values[2]['body'])
        self.assertEqual(values[0]['rules'][0]['start_days'], -7)
        self.assertEqual([v['min_age_weeks'] for v in values], [6, 8, 8])
        self.assertEqual([v['max_age_weeks'] for v in values], [16, 52, 52])


if __name__ == '__main__':
    unittest.main()
