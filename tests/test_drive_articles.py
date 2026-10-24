import importlib.util
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


def source(fields=None, duplicate=False, paragraph='När {{dog.name}} kommer hem behöver {{dog.subject}} vila.'):
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

    def test_readable_body_preserves_tokens_and_separates_metadata(self):
        article = self.parse(source())
        self.assertIn('{{dog.subject}}', article['body'])
        self.assertNotIn('METADATA', article['body'])
        self.assertNotIn('missing_editorial_ref', article['body'])
        self.assertEqual(article['related_source_refs'], ['missing_editorial_ref'])
        self.assertEqual(article['rules'][0]['start_days'], -7)
        self.assertFalse(article['is_ai_generated'])

    def test_word_tips_preserve_reviewed_text_as_explicit_callouts(self):
        result = self.parse(source(paragraph='Tips: Låt {{dog.name}} vila ostört.'))
        self.assertEqual(result['body'], '> Tips: Låt {{dog.name}} vila ostört.')

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
        sync.validate_endpoint('https://' + project + '.supabase.co/functions/v1/sync-drive-article', project)
        for endpoint in ('https://otherotherotherother.supabase.co/functions/v1/sync-drive-article',
                         'https://evil.example/functions/v1/sync-drive-article',
                         'http://' + project + '.supabase.co/functions/v1/sync-drive-article'):
            with self.assertRaises(ValueError):
                sync.validate_endpoint(endpoint, project)

    def test_initial_migration_exactly_matches_three_reviewed_payloads(self):
        values = json.loads(sync.BUNDLE.read_text())
        sql = (ROOT / 'supabase/migrations/202610240004_reviewed_drive_articles.sql').read_text()
        self.assertEqual(len(values), 3)
        for article in values:
            self.assertIn(json.dumps(article, ensure_ascii=False, separators=(',', ':')), sql)
            self.assertIn('{{dog.name}}', article['body'])
            self.assertFalse(article['is_ai_generated'])
            self.assertNotIn('hur mycket den sover', article['body'])
        self.assertEqual(values[0]['rules'][0]['start_days'], -7)
        self.assertEqual([v['min_age_weeks'] for v in values], [6, 8, 8])
        self.assertEqual([v['max_age_weeks'] for v in values], [16, 52, 52])


if __name__ == '__main__':
    unittest.main()
