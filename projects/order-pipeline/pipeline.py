"""AI-assisted learning project: deterministic CSV -> SQLite -> JSON ETL."""
import argparse
import csv
import hashlib
import json
import sqlite3
from contextlib import closing
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS orders (
 order_id TEXT PRIMARY KEY, order_date TEXT NOT NULL,
 region TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>=0)
);
CREATE TABLE IF NOT EXISTS loads (
 source_sha256 TEXT PRIMARY KEY, accepted INTEGER NOT NULL, rejected INTEGER NOT NULL
);
"""

def transform(row):
    if not row.get('order_id', '').strip():
        raise ValueError('missing order_id')
    order_date = date.fromisoformat(row['order_date']).isoformat()
    region = row['region'].strip().upper()
    if region not in {'ON', 'BC', 'QC'}:
        raise ValueError('unsupported region')
    try:
        amount = Decimal(row['amount'])
        if not amount.is_finite() or amount < 0 or amount.as_tuple().exponent < -2:
            raise ValueError('amount must be nonnegative with at most two decimals')
        cents = int(amount * 100)
        if cents > 1_000_000_000:
            raise ValueError('amount exceeds demonstration limit')
    except InvalidOperation as exc:
        raise ValueError('invalid amount') from exc
    return row['order_id'].strip(), order_date, region, cents

def run(source, database, output):
    source, database, output = map(Path, (source, database, output))
    raw = source.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    accepted, rejected, seen = [], [], set()
    with source.open(newline='', encoding='utf-8') as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != ['order_id', 'order_date', 'region', 'amount']:
            raise ValueError('expected columns: order_id,order_date,region,amount')
        for line, row in enumerate(reader, 2):
            try:
                record = transform(row)
                if record[0] in seen:
                    raise ValueError('duplicate order_id in input')
                seen.add(record[0])
                accepted.append(record)
            except (ValueError, KeyError, TypeError, AttributeError) as exc:
                rejected.append({'line': line, 'reason': str(exc)})
    database.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database)) as connection:
        connection.executescript(SCHEMA)
        # One transaction: readers cannot observe a partially loaded batch.
        with connection:
            connection.executemany('''INSERT INTO orders VALUES (?,?,?,?)
              ON CONFLICT(order_id) DO UPDATE SET order_date=excluded.order_date,
              region=excluded.region, amount_cents=excluded.amount_cents''', accepted)
            connection.execute('INSERT OR REPLACE INTO loads VALUES (?,?,?)',
                               (digest, len(accepted), len(rejected)))
        summaries = [{'region': r, 'orders': n, 'revenue_cents': cents}
                     for r, n, cents in connection.execute('''SELECT region, COUNT(*),
                     SUM(amount_cents) FROM orders GROUP BY region ORDER BY region''')]
        total = connection.execute('SELECT COUNT(*) FROM orders').fetchone()[0]
    report = {'schema_version': 1, 'synthetic_demo': True, 'source_sha256': digest,
              'accepted': len(accepted), 'rejected': rejected,
              'stored_orders': total, 'regions': summaries,
              'limitations': 'Local synthetic-data learning project. No AWS, production scale, scheduling, or real customer data.'}
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix(output.suffix + '.tmp')
    temp.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    temp.replace(output)
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--database', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = run(args.input, args.database, args.output)
    print(json.dumps({'accepted': report['accepted'], 'rejected': len(report['rejected']),
                      'stored_orders': report['stored_orders']}))
