import json, unittest
from pathlib import Path
from train import build,fit,samples,probability
class TrainingTests(unittest.TestCase):
    def test_export_reproducible(self):
        self.assertEqual(build(),json.loads((Path(__file__).parent/'artifact.json').read_text()))
    def test_training_scaler_uses_training_rows(self):
        rows=samples(3,20); m=fit(rows)
        self.assertEqual(m['mean'],[sum(x[j] for x,y in rows)/20 for j in range(4)])
        self.assertNotEqual(m['mean'],fit(rows+[([100]*4,1)])['mean'])
    def test_holdout_improves_on_majority(self):
        a=build(); self.assertGreater(a['metrics']['accuracy'],a['metrics']['baseline_accuracy']+.2)
        self.assertEqual(sum(a['metrics']['confusion'].values()),200)
    def test_probability_bounded(self):
        m=fit(samples(1,20))
        for x,y in samples(2,30): self.assertTrue(0<probability(m,x)<1)
if __name__=='__main__': unittest.main()
