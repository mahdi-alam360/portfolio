import csv
import json
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from pipeline import run, transform

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path.cwd())
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = Path(__file__).parent / 'orders.csv'
        self.db, self.output = self.root/'orders.db', self.root/'report.json'

    def execute(self, source=None):
        return run(source or self.source, self.db, self.output)

    def test_rejections_and_exact_money(self):
        report = self.execute()
        self.assertEqual((report['accepted'], len(report['rejected']), report['stored_orders']), (4,4,4))
        self.assertEqual(next(r['revenue_cents'] for r in report['regions'] if r['region']=='ON'), 5000)
        self.assertEqual(json.loads(self.output.read_text()), report)

    def test_replay_is_idempotent(self):
        first = self.execute()
        self.assertEqual(self.execute(), first)
        with closing(sqlite3.connect(self.db)) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM loads').fetchone()[0], 1)

    def test_upsert_and_parameterized_id(self):
        self.execute()
        path = self.root/'updates.csv'
        with path.open('w',newline='') as stream:
            writer=csv.writer(stream)
            writer.writerows([['order_id','order_date','region','amount'],
                              ['demo-001','2026-10-01','ON','20.00'],
                              ["x'); DROP TABLE orders;--",'2026-10-01','BC','1.00']])
        report=self.execute(path)
        self.assertEqual(report['stored_orders'],5)
        self.assertEqual(next(r['revenue_cents'] for r in report['regions'] if r['region']=='ON'),5005)

    def test_bad_schema_leaves_database_unchanged(self):
        before=self.execute()
        bad=self.root/'bad.csv'; bad.write_text('wrong\nvalue\n')
        with self.assertRaises(ValueError): self.execute(bad)
        self.assertEqual(self.execute(),before)

    def test_invalid_amounts(self):
        for amount in ['NaN','Infinity','-0.01','1.234','garbage','10000000.01']:
            with self.subTest(amount=amount), self.assertRaises(ValueError):
                transform(dict(order_id='a',order_date='2026-10-01',region='ON',amount=amount))

    def test_source_change_updates_provenance(self):
        before=self.execute()
        changed=self.root/'changed.csv'; changed.write_bytes(self.source.read_bytes()+b'\n')
        after=self.execute(changed)
        self.assertNotEqual(before['source_sha256'],after['source_sha256'])
        self.assertEqual(before['regions'],after['regions'])

if __name__=='__main__': unittest.main()
